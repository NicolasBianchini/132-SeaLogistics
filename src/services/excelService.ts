import { DocumentType } from '../types/document';
import { azureConfig } from '../config/azureConfig';

// Tipos para Excel
export interface ExcelTable {
    id: string;
    name: string;
    address: string;
    hasHeaders: boolean;
    rows: ExcelRow[];
}

export interface ExcelRow {
    id: string;
    values: any[];
}

export interface ExcelWorksheet {
    id: string;
    name: string;
    tables: ExcelTable[];
}

export interface ExcelWorkbook {
    id: string;
    name: string;
    worksheets: ExcelWorksheet[];
}

export interface ExcelConfig {
    workbookId: string;
    worksheetName: string;
    tableName: string;
    headers: string[];
    mapping: Record<string, string>;
}

class ExcelService {
    private accessToken: string | null = null;
    private isAuthenticating: boolean = false;
    private baseUrl = azureConfig.graphApiUrl;

    // URL da planilha específica do usuário
    private specificWorkbookUrl = 'https://1drv.ms/x/c/dc64d46ccb357759/EavjQ3OTbP5JtQkQibDsyk4BYb1CbJxHcAPSenLuH8tH-Q?e=519kWi';

    /**
     * Gera um code_verifier para PKCE (43-128 caracteres, URL-safe)
     */
    private generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const base64 = btoa(String.fromCharCode.apply(null, Array.from(array)));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Gera um code_challenge para PKCE usando SHA256
     */
    private async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        const base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Inicializa a autenticação com Microsoft Graph
     */
    async initializeAuth(): Promise<boolean> {
        try {
            // Evita múltiplas autenticações simultâneas
            if (this.isAuthenticating) {
                return false;
            }

            // Limpa tokens mock e dados de autenticação anteriores antes de verificar
            this.clearMockTokens();
            this.clearAuthState();

            // Verifica se já temos um token válido
            const token = localStorage.getItem('excel_access_token');
            if (token && !token.startsWith('mock_access_token_') && await this.validateToken(token)) {
                this.accessToken = token;
                console.log('Token válido encontrado, autenticação bem-sucedida');
                return true;
            }

            // Se não há token válido, inicia o fluxo de autenticação
            console.log('Nenhum token válido encontrado, iniciando fluxo de autenticação...');
            this.isAuthenticating = true;
            const result = await this.startAuthFlow();
            this.isAuthenticating = false;
            return result;
        } catch (error) {
            console.error('Erro na inicialização da autenticação:', error);
            this.isAuthenticating = false;
            return false;
        }
    }

    /**
     * Inicia o fluxo de autenticação OAuth2 com Authorization Code Flow e PKCE
     */
    private async startAuthFlow(): Promise<boolean> {
        return new Promise(async (resolve) => {
            // Gera PKCE parameters corretamente
            const codeVerifier = this.generateCodeVerifier();
            const codeChallenge = await this.generateCodeChallenge(codeVerifier);

            // Salva o code_verifier para usar depois (múltiplas estratégias)
            sessionStorage.setItem('excel_code_verifier', codeVerifier);
            localStorage.setItem('excel_code_verifier_backup', codeVerifier);

            // Também salva com timestamp para debug
            const verifierData = {
                verifier: codeVerifier,
                challenge: codeChallenge,
                timestamp: Date.now(),
                origin: window.location.origin
            };
            localStorage.setItem('excel_pkce_data', JSON.stringify(verifierData));

            // Debug: Log dos parâmetros PKCE
            console.log('=== AUTHORIZATION CODE FLOW WITH PKCE ===');
            console.log('Code Verifier:', codeVerifier);
            console.log('Code Challenge:', codeChallenge);
            console.log('Code Verifier Length:', codeVerifier.length);
            console.log('Code Challenge Length:', codeChallenge.length);

            // Debug: Log das configurações do frontend
            console.log('=== DEBUG FRONTEND CONFIG ===');
            console.log('Client ID no frontend:', azureConfig.clientId);
            console.log('Redirect URI no frontend:', azureConfig.redirectUri);
            console.log('Token URL:', azureConfig.tokenUrl);

            // Usando Authorization Code Flow com PKCE
            const authUrl = new URL(azureConfig.authUrl);
            authUrl.searchParams.set('client_id', azureConfig.clientId);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('redirect_uri', azureConfig.redirectUri);
            authUrl.searchParams.set('scope', azureConfig.scopes.join(' '));
            authUrl.searchParams.set('response_mode', 'query');
            authUrl.searchParams.set('state', 'excel_auth');
            authUrl.searchParams.set('code_challenge', codeChallenge);
            authUrl.searchParams.set('code_challenge_method', 'S256');

            // Abre popup para autenticação
            const popup = window.open(authUrl.toString(), 'excel_auth', 'width=600,height=600,scrollbars=yes,resizable=yes');

            if (!popup) {
                console.error('Popup bloqueado pelo navegador. Tentando redirecionamento direto...');
                // Fallback: redirecionamento direto
                window.location.href = authUrl.toString();
                resolve(false);
                return;
            }

            // Monitora o popup usando apenas mensagens e timeout (sem usar popup.closed)
            let popupClosed = false;
            let messageReceived = false;

            // Declara variáveis para os intervalos
            let checkClosed: NodeJS.Timeout;
            let timeout: NodeJS.Timeout;

            // Timeout para detectar se o popup não respondeu
            checkClosed = setInterval(() => {
                // Se não recebeu mensagem em 30 segundos, assume que o popup foi fechado
                if (!messageReceived && !popupClosed) {
                    popupClosed = true;
                    clearInterval(checkClosed);
                    resolve(false);
                }
            }, 30000); // 30 segundos

            // Timeout de 5 minutos para evitar popup indefinido
            timeout = setTimeout(() => {
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                try {
                    popup.close();
                } catch (error) {
                    console.warn('Não foi possível fechar o popup');
                }
                resolve(false);
            }, 5 * 60 * 1000); // 5 minutos

            // Monitora mensagens do popup
            const messageHandler = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;

                messageReceived = true; // Marca que recebeu uma mensagem

                if (event.data.type === 'EXCEL_AUTH_SUCCESS') {
                    popupClosed = true;
                    this.accessToken = event.data.token;
                    localStorage.setItem('excel_access_token', event.data.token);
                    console.log('Token salvo com sucesso:', event.data.token.substring(0, 20) + '...');
                    clearInterval(checkClosed);
                    clearTimeout(timeout);
                    window.removeEventListener('message', messageHandler);
                    try {
                        popup.close();
                    } catch (error) {
                        console.warn('Não foi possível fechar o popup');
                    }
                    resolve(true);
                } else if (event.data.type === 'EXCEL_AUTH_ERROR') {
                    popupClosed = true;
                    console.error('Erro na autenticação:', event.data.error);
                    clearInterval(checkClosed);
                    clearTimeout(timeout);
                    window.removeEventListener('message', messageHandler);
                    try {
                        popup.close();
                    } catch (error) {
                        console.warn('Não foi possível fechar o popup');
                    }
                    resolve(false);
                }
            };

            window.addEventListener('message', messageHandler);
        });
    }

    /**
     * Valida se o token ainda é válido
     */
    async validateToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Garante que temos um token válido antes de fazer requisições
     */
    private async ensureValidToken(): Promise<void> {
        if (!this.accessToken) {
            const token = localStorage.getItem('excel_access_token');
            if (token && !token.startsWith('mock_access_token_')) {
                this.accessToken = token;
                console.log('Token carregado do localStorage');
            } else {
                throw new Error('Token de acesso não disponível. Faça login primeiro.');
            }
        }
    }

    /**
     * Lista todos os arquivos Excel do usuário
     */
    async listExcelFiles(): Promise<ExcelWorkbook[]> {
        await this.ensureValidToken();

        try {
            // Primeiro, vamos tentar uma query mais simples para testar a conectividade
            console.log('Testando conectividade com Microsoft Graph...');
            const testResponse = await fetch(`${this.baseUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!testResponse.ok) {
                console.error('Erro no teste de conectividade:', testResponse.status, await testResponse.text());
                throw new Error(`Erro de conectividade: ${testResponse.statusText}`);
            }

            console.log('Conectividade OK, listando arquivos...');

            // Primeiro, vamos listar TODOS os arquivos para ver o que está disponível
            const allFilesResponse = await fetch(`${this.baseUrl}/me/drive/root/children`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (allFilesResponse.ok) {
                const allFiles = await allFilesResponse.json();
                console.log('Todos os arquivos no OneDrive:', allFiles);
                console.log('Total de arquivos encontrados:', allFiles.value?.length || 0);

                // Filtra apenas arquivos Excel
                const excelFiles = allFiles.value?.filter((file: any) =>
                    file.name?.endsWith('.xlsx') ||
                    file.name?.endsWith('.xls') ||
                    file.file?.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ) || [];

                console.log('Arquivos Excel encontrados:', excelFiles);

                // Se não encontrou arquivos Excel, vamos tentar uma abordagem diferente
                if (excelFiles.length === 0) {
                    console.log('Nenhum arquivo Excel encontrado na raiz. Tentando buscar em toda a conta...');

                    // Busca por arquivos Excel em toda a conta
                    const searchResponse = await fetch(`${this.baseUrl}/me/drive/root/search(q='.xlsx')`, {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    });

                    if (searchResponse.ok) {
                        const searchResults = await searchResponse.json();
                        console.log('Resultados da busca por .xlsx:', searchResults);
                        const data = searchResults;
                        const workbooks: ExcelWorkbook[] = [];

                        for (const file of data.value || []) {
                            try {
                                const workbook = await this.getWorkbookDetails(file.id);
                                workbooks.push(workbook);
                            } catch (error) {
                                console.warn(`Erro ao obter detalhes do arquivo ${file.name}:`, error);
                            }
                        }

                        return workbooks;
                    }
                } else {
                    // Se encontrou arquivos Excel na raiz, processa eles
                    const data = { value: excelFiles };
                    const workbooks: ExcelWorkbook[] = [];

                    for (const file of data.value) {
                        try {
                            const workbook = await this.getWorkbookDetails(file.id);
                            workbooks.push(workbook);
                        } catch (error) {
                            console.warn(`Erro ao obter detalhes do arquivo ${file.name}:`, error);
                        }
                    }

                    return workbooks;
                }
            }

            // Fallback: tenta a query original
            const response = await fetch(`${this.baseUrl}/me/drive/root/children?$filter=endsWith(name,'.xlsx') or endsWith(name,'.xls')`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro ao listar arquivos Excel:', response.status, errorText);
                throw new Error(`Erro ao listar arquivos: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Dados recebidos do Microsoft Graph:', data);
            const workbooks: ExcelWorkbook[] = [];

            for (const file of data.value) {
                try {
                    const workbook = await this.getWorkbookDetails(file.id);
                    workbooks.push(workbook);
                } catch (error) {
                    console.warn(`Erro ao obter detalhes do arquivo ${file.name}:`, error);
                }
            }

            return workbooks;
        } catch (error) {
            console.error('Erro ao listar arquivos Excel:', error);
            throw error;
        }
    }

    /**
     * Obtém detalhes de um workbook específico
     */
    async getWorkbookDetails(workbookId: string): Promise<ExcelWorkbook> {
        await this.ensureValidToken();

        try {
            // Obtém informações básicas do arquivo
            const fileResponse = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!fileResponse.ok) {
                throw new Error(`Erro ao obter arquivo: ${fileResponse.statusText}`);
            }

            const fileData = await fileResponse.json();

            // Obtém as planilhas
            const worksheetsResponse = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!worksheetsResponse.ok) {
                throw new Error(`Erro ao obter planilhas: ${worksheetsResponse.statusText}`);
            }

            const worksheetsData = await worksheetsResponse.json();
            const worksheets: ExcelWorksheet[] = [];

            for (const worksheet of worksheetsData.value) {
                try {
                    const tables = await this.getWorksheetTables(workbookId, worksheet.id);
                    worksheets.push({
                        id: worksheet.id,
                        name: worksheet.name,
                        tables
                    });
                } catch (error) {
                    console.warn(`Erro ao obter tabelas da planilha ${worksheet.name}:`, error);
                    worksheets.push({
                        id: worksheet.id,
                        name: worksheet.name,
                        tables: []
                    });
                }
            }

            return {
                id: workbookId,
                name: fileData.name,
                worksheets
            };
        } catch (error) {
            console.error('Erro ao obter detalhes do workbook:', error);
            throw error;
        }
    }

    /**
     * Obtém tabelas de uma planilha específica
     */
    async getWorksheetTables(workbookId: string, worksheetId: string): Promise<ExcelTable[]> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/tables`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao obter tabelas: ${response.statusText}`);
            }

            const data = await response.json();
            const tables: ExcelTable[] = [];

            for (const table of data.value) {
                try {
                    const rows = await this.getTableRows(workbookId, worksheetId, table.id);
                    tables.push({
                        id: table.id,
                        name: table.name,
                        address: table.address,
                        hasHeaders: table.hasHeaders,
                        rows
                    });
                } catch (error) {
                    console.warn(`Erro ao obter linhas da tabela ${table.name}:`, error);
                }
            }

            return tables;
        } catch (error) {
            console.error('Erro ao obter tabelas da planilha:', error);
            throw error;
        }
    }

    /**
     * Obtém linhas de uma tabela específica
     */
    async getTableRows(workbookId: string, worksheetId: string, tableId: string): Promise<ExcelRow[]> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Arquivo Excel não encontrado. Verifique se o arquivo existe e se você tem permissão de acesso.`);
                }
                throw new Error(`Erro ao obter linhas: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return data.value.map((row: any, index: number) => ({
                id: row.id || `row_${index}`,
                values: row.values || []
            }));
        } catch (error) {
            console.error('Erro ao obter linhas da tabela:', error);
            throw error;
        }
    }

    /**
     * Adiciona uma nova linha a uma tabela
     */
    async addTableRow(workbookId: string, worksheetId: string, tableId: string, values: any[]): Promise<void> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao adicionar linha: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erro ao adicionar linha à tabela:', error);
            throw error;
        }
    }

    /**
     * Atualiza uma linha específica de uma tabela
     */
    async updateTableRow(workbookId: string, worksheetId: string, tableId: string, rowId: string, values: any[]): Promise<void> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows/${rowId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar linha: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erro ao atualizar linha da tabela:', error);
            throw error;
        }
    }

    /**
     * Remove uma linha de uma tabela
     */
    async deleteTableRow(workbookId: string, worksheetId: string, tableId: string, rowId: string): Promise<void> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets/${tableId}/rows/${rowId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao remover linha: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erro ao remover linha da tabela:', error);
            throw error;
        }
    }

    /**
     * Sincroniza dados do sistema com Excel
     */
    async syncShipmentsToExcel(config: ExcelConfig, shipments: any[]): Promise<void> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            // Obtém dados atuais da tabela
            const currentRows = await this.getTableRows(config.workbookId, config.worksheetName, config.tableName);

            // Mapeia dados dos shipments para formato Excel
            const excelData = shipments.map(shipment => {
                const row: any[] = [];
                config.headers.forEach(header => {
                    const mappedField = config.mapping[header];
                    row.push(shipment[mappedField] || '');
                });
                return row;
            });

            // Limpa tabela existente (remove todas as linhas exceto cabeçalho)
            if (currentRows.length > 1) {
                for (let i = currentRows.length - 1; i >= 1; i--) {
                    await this.deleteTableRow(config.workbookId, config.worksheetName, config.tableName, currentRows[i].id);
                }
            }

            // Adiciona novos dados
            for (const rowData of excelData) {
                await this.addTableRow(config.workbookId, config.worksheetName, config.tableName, rowData);
            }

            console.log(`Sincronizados ${shipments.length} shipments com Excel`);
        } catch (error) {
            console.error('Erro na sincronização com Excel:', error);
            throw error;
        }
    }

    /**
     * Obtém dados do Excel e converte para formato do sistema
     */
    async getShipmentsFromExcel(config: ExcelConfig): Promise<any[]> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            let rows: ExcelRow[];

            // Se é uma tabela padrão, busca dados diretamente da planilha
            if (config.tableName === 'default_table') {
                rows = await this.getWorksheetDataDirect(config.workbookId, config.worksheetName);
            } else {
                rows = await this.getTableRows(config.workbookId, config.worksheetName, config.tableName);
            }

            // Converte dados do Excel para formato do sistema
            const shipments = rows.slice(1).map((row, index) => { // Pula cabeçalho
                const shipment: any = { id: `excel_${index + 1}` };
                config.headers.forEach((header, headerIndex) => {
                    const mappedField = config.mapping[header];
                    if (mappedField) {
                        shipment[mappedField] = row.values[headerIndex] || '';
                    }
                });
                return shipment;
            });

            return shipments;
        } catch (error) {
            console.error('Erro ao obter dados do Excel:', error);
            throw error;
        }
    }

    /**
     * Obtém dados diretamente da planilha (sem tabela estruturada)
     */
    async getWorksheetDataDirect(workbookId: string, worksheetId: string): Promise<ExcelRow[]> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            // Primeiro verifica se o arquivo existe
            const fileResponse = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!fileResponse.ok) {
                if (fileResponse.status === 404) {
                    throw new Error(`Arquivo Excel não encontrado. Verifique se o arquivo existe e se você tem permissão de acesso.`);
                }
                throw new Error(`Erro ao acessar arquivo: ${fileResponse.status} - ${fileResponse.statusText}`);
            }

            // Busca dados de uma faixa específica da planilha (ex: A1:K100)
            const response = await fetch(`${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='A1:K100')`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Planilha não encontrada. Verifique se a planilha "${worksheetId}" existe no arquivo.`);
                }
                throw new Error(`Erro ao obter dados da planilha: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            const rows: ExcelRow[] = [];

            if (data.values && Array.isArray(data.values)) {
                data.values.forEach((rowValues: any[], index: number) => {
                    rows.push({
                        id: `row_${index}`,
                        values: rowValues || []
                    });
                });
            }

            return rows;
        } catch (error) {
            console.error('Erro ao obter dados diretos da planilha:', error);
            throw error;
        }
    }

    /**
     * Configura webhook para mudanças em tempo real (requer Microsoft Graph webhooks)
     */
    async setupWebhook(workbookId: string, callbackUrl: string): Promise<void> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            const response = await fetch(`${this.baseUrl}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    changeType: 'updated',
                    notificationUrl: callbackUrl,
                    resource: `/me/drive/items/${workbookId}`,
                    expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
                    clientState: 'excel_sync'
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao configurar webhook: ${response.statusText}`);
            }

            const subscription = await response.json();
            localStorage.setItem('excel_webhook_id', subscription.id);
        } catch (error) {
            console.error('Erro ao configurar webhook:', error);
            throw error;
        }
    }

    /**
     * Remove webhook
     */
    async removeWebhook(): Promise<void> {
        const webhookId = localStorage.getItem('excel_webhook_id');
        if (!webhookId || !this.accessToken) {
            return;
        }

        try {
            await fetch(`${this.baseUrl}/subscriptions/${webhookId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            localStorage.removeItem('excel_webhook_id');
        } catch (error) {
            console.error('Erro ao remover webhook:', error);
        }
    }

    /**
     * Desconecta do Excel
     */
    disconnect(): void {
        this.accessToken = null;
        localStorage.removeItem('excel_access_token');
        localStorage.removeItem('excel_webhook_id');
    }

    /**
     * Limpa tokens mock do localStorage
     */
    clearMockTokens(): void {
        const token = localStorage.getItem('excel_access_token');
        if (token && token.startsWith('mock_access_token_')) {
            console.log('Removendo token mock do localStorage');
            localStorage.removeItem('excel_access_token');
            this.accessToken = null;
        }
    }

    /**
     * Limpa estado de autenticação anterior
     */
    clearAuthState(): void {
        sessionStorage.removeItem('excel_code_verifier');
        sessionStorage.removeItem('excel_used_code');
        localStorage.removeItem('excel_code_verifier_backup');
        console.log('Estado de autenticação anterior limpo');
    }

    /**
     * Converte URL do OneDrive para formato correto da API
     */
    private async getFileFromOneDriveUrl(url: string): Promise<string> {
        // Para URLs do OneDrive compartilhado, precisamos usar um approach diferente
        // Vamos tentar listar todos os arquivos Excel e encontrar o correto
        try {
            console.log('Listando arquivos Excel para encontrar a planilha específica...');
            const workbooks = await this.listExcelFiles();

            // Se encontrarmos algum arquivo, vamos usar o primeiro como exemplo
            if (workbooks.length > 0) {
                console.log('Arquivos Excel encontrados:', workbooks.map(w => w.name));
                return workbooks[0].id;
            } else {
                throw new Error('Nenhum arquivo Excel encontrado na conta');
            }
        } catch (error) {
            console.error('Erro ao listar arquivos Excel:', error);
            throw new Error('Não foi possível acessar arquivos Excel');
        }
    }

    /**
     * Obtém a planilha específica do usuário
     */
    async getSpecificWorkbook(): Promise<ExcelWorkbook> {
        await this.ensureValidToken();

        try {
            console.log('Buscando planilha específica...');
            const fileId = await this.getFileFromOneDriveUrl(this.specificWorkbookUrl);
            console.log('ID do arquivo encontrado:', fileId);

            return await this.getWorkbookDetails(fileId);
        } catch (error) {
            console.error('Erro ao obter planilha específica:', error);
            throw error;
        }
    }
}

export const excelService = new ExcelService();
