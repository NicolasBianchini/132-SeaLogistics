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
    private baseUrl = azureConfig.graphApiUrl;

    /**
     * Inicializa a autenticação com Microsoft Graph
     */
    async initializeAuth(): Promise<boolean> {
        try {
            // Verifica se já temos um token válido
            const token = localStorage.getItem('excel_access_token');
            if (token && await this.validateToken(token)) {
                this.accessToken = token;
                return true;
            }

            // Inicia o fluxo de autenticação
            return await this.startAuthFlow();
        } catch (error) {
            console.error('Erro na inicialização da autenticação:', error);
            return false;
        }
    }

    /**
     * Inicia o fluxo de autenticação OAuth2
     */
    private async startAuthFlow(): Promise<boolean> {
        return new Promise((resolve) => {
            const authUrl = new URL(azureConfig.authUrl);
            authUrl.searchParams.set('client_id', azureConfig.clientId);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('redirect_uri', azureConfig.redirectUri);
            authUrl.searchParams.set('scope', azureConfig.scopes.join(' '));
            authUrl.searchParams.set('response_mode', 'query');
            authUrl.searchParams.set('state', 'excel_auth');

            // Abre popup para autenticação
            const popup = window.open(authUrl.toString(), 'excel_auth', 'width=600,height=600');

            if (!popup) {
                console.error('Popup bloqueado pelo navegador');
                resolve(false);
                return;
            }

            // Monitora o popup
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    resolve(false);
                }
            }, 1000);

            // Monitora mensagens do popup
            const messageHandler = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'EXCEL_AUTH_SUCCESS') {
                    this.accessToken = event.data.token;
                    localStorage.setItem('excel_access_token', event.data.token);
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    popup.close();
                    resolve(true);
                } else if (event.data.type === 'EXCEL_AUTH_ERROR') {
                    console.error('Erro na autenticação:', event.data.error);
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    popup.close();
                    resolve(false);
                }
            };

            window.addEventListener('message', messageHandler);
        });
    }

    /**
     * Valida se o token ainda é válido
     */
    private async validateToken(token: string): Promise<boolean> {
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
     * Lista todos os arquivos Excel do usuário
     */
    async listExcelFiles(): Promise<ExcelWorkbook[]> {
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me/drive/root/children?$filter=file/mimeType eq 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao listar arquivos: ${response.statusText}`);
            }

            const data = await response.json();
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
        if (!this.accessToken) {
            throw new Error('Token de acesso não disponível');
        }

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
                throw new Error(`Erro ao obter linhas: ${response.statusText}`);
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
            const rows = await this.getTableRows(config.workbookId, config.worksheetName, config.tableName);

            // Converte dados do Excel para formato do sistema
            const shipments = rows.slice(1).map(row => { // Pula cabeçalho
                const shipment: any = {};
                config.headers.forEach((header, index) => {
                    const mappedField = config.mapping[header];
                    shipment[mappedField] = row.values[index] || '';
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
}

export const excelService = new ExcelService();
