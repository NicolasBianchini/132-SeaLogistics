import React, { useState, useEffect } from 'react';
import { excelService } from '../../services/excelService';
import './excel-specific-test.css';

const ExcelSpecificTest: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [workbook, setWorkbook] = useState<any>(null);
    const [availableWorkbooks, setAvailableWorkbooks] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const token = localStorage.getItem('excel_access_token');
            if (token && !token.startsWith('mock_access_token_')) {
                setIsConnected(true);
            }
        } catch (error) {
            console.error('Erro ao verificar conexão:', error);
        }
    };

    const connectToExcel = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Iniciando autenticação com Microsoft Excel...');
            const success = await excelService.initializeAuth();
            if (success) {
                setIsConnected(true);
                console.log('Conectado com sucesso ao Excel!');
            } else {
                setError('Falha na autenticação com Microsoft Excel');
            }
        } catch (error) {
            console.error('Erro na conexão:', error);
            setError('Erro ao conectar com Excel: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvailableWorkbooks = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Listando arquivos Excel disponíveis...');
            const workbooks = await excelService.listExcelFiles();
            setAvailableWorkbooks(workbooks);
            console.log('Arquivos Excel encontrados:', workbooks);
        } catch (error) {
            console.error('Erro ao listar arquivos Excel:', error);
            setError('Erro ao listar arquivos Excel: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSpecificWorkbook = async (workbookId?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            let workbookData;
            if (workbookId) {
                console.log('Carregando planilha específica por ID:', workbookId);
                workbookData = await excelService.getWorkbookDetails(workbookId);
            } else {
                console.log('Carregando planilha específica...');
                workbookData = await excelService.getSpecificWorkbook();
            }
            setWorkbook(workbookData);
            console.log('Planilha carregada:', workbookData);
        } catch (error) {
            console.error('Erro ao carregar planilha:', error);
            setError('Erro ao carregar planilha: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const disconnect = () => {
        excelService.disconnect();
        setIsConnected(false);
        setWorkbook(null);
        setError(null);
    };

    const clearTokensAndReconnect = () => {
        excelService.clearMockTokens();
        excelService.disconnect();
        // Limpa dados de autenticação do sessionStorage
        sessionStorage.removeItem('excel_code_verifier');
        sessionStorage.removeItem('excel_used_code');
        setIsConnected(false);
        setWorkbook(null);
        setError(null);
        console.log('Tokens e dados de autenticação limpos. Pronto para nova autenticação.');
    };

    return (
        <div className="excel-specific-test">
            <div className="test-header">
                <h2>🧪 Teste de Integração com Planilha Específica</h2>
                <p>Teste a integração com sua planilha do OneDrive</p>
            </div>

            <div className="test-controls">
                {!isConnected ? (
                    <button
                        className="connect-btn"
                        onClick={connectToExcel}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Conectando...' : '🔗 Conectar com Excel'}
                    </button>
                ) : (
                    <div className="connected-controls">
                        <div className="status">
                            <span className="status-indicator connected">✅ Conectado</span>
                        </div>
                        <div className="actions">
                            <button
                                className="list-btn"
                                onClick={loadAvailableWorkbooks}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Listando...' : '📋 Listar Arquivos Excel'}
                            </button>
                            <button
                                className="load-btn"
                                onClick={() => loadSpecificWorkbook()}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Carregando...' : '📊 Carregar Primeira Planilha'}
                            </button>
                            <button
                                className="clear-btn"
                                onClick={clearTokensAndReconnect}
                            >
                                🧹 Limpar Tokens
                            </button>
                            <button
                                className="disconnect-btn"
                                onClick={disconnect}
                            >
                                ❌ Desconectar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message">
                    <strong>❌ Erro:</strong> {error}
                </div>
            )}

            {availableWorkbooks.length > 0 && (
                <div className="available-workbooks">
                    <h3>📋 Arquivos Excel Disponíveis</h3>
                    <div className="workbooks-list">
                        {availableWorkbooks.map((wb, index) => (
                            <div key={index} className="workbook-item">
                                <div className="workbook-info">
                                    <strong>{wb.name}</strong>
                                    <span className="workbook-id">ID: {wb.id}</span>
                                </div>
                                <button
                                    className="select-btn"
                                    onClick={() => loadSpecificWorkbook(wb.id)}
                                    disabled={isLoading}
                                >
                                    📊 Selecionar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {workbook && (
                <div className="workbook-info">
                    <h3>📋 Informações da Planilha</h3>
                    <div className="workbook-details">
                        <p><strong>Nome:</strong> {workbook.name}</p>
                        <p><strong>ID:</strong> {workbook.id}</p>
                        <p><strong>Planilhas:</strong> {workbook.worksheets?.length || 0}</p>

                        {workbook.worksheets && workbook.worksheets.length > 0 && (
                            <div className="worksheets-list">
                                <h4>Planilhas Disponíveis:</h4>
                                <ul>
                                    {workbook.worksheets.map((worksheet: any, index: number) => (
                                        <li key={index}>
                                            <strong>{worksheet.name}</strong>
                                            {worksheet.tables && worksheet.tables.length > 0 && (
                                                <span> ({worksheet.tables.length} tabelas)</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="test-info">
                <h4>ℹ️ Informações do Teste</h4>
                <ul>
                    <li><strong>URL da Planilha:</strong> https://1drv.ms/x/c/dc64d46ccb357759/EavjQ3OTbP5JtQkQibDsyk4BYb1CbJxHcAPSenLuH8tH-Q?e=519kWi</li>
                    <li><strong>Servidor Backend:</strong> http://localhost:3002</li>
                    <li><strong>Client ID:</strong> 21f52d49-5e17-4d39-b05c-8a3f355ecbc9</li>
                </ul>
            </div>
        </div>
    );
};

export default ExcelSpecificTest;
