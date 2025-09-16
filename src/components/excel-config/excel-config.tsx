import React, { useState, useEffect } from 'react';
import { excelService, ExcelWorkbook, ExcelConfig } from '../../services/excelService';
import './excel-config.css';

interface ExcelConfigProps {
    onConfigSaved: (config: ExcelConfig) => void;
    onClose: () => void;
}

const ExcelConfigModal: React.FC<ExcelConfigProps> = ({ onConfigSaved, onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [workbooks, setWorkbooks] = useState<ExcelWorkbook[]>([]);
    const [selectedWorkbook, setSelectedWorkbook] = useState<string>('');
    const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [error, setError] = useState<string>('');

    // Campos disponíveis para mapeamento
    const availableFields = [
        { key: 'shipmentNumber', label: 'Número do Envio' },
        { key: 'origin', label: 'Origem' },
        { key: 'destination', label: 'Destino' },
        { key: 'status', label: 'Status' },
        { key: 'company', label: 'Empresa' },
        { key: 'date', label: 'Data' },
        { key: 'client', label: 'Cliente' },
        { key: 'type', label: 'Tipo' },
        { key: 'shipper', label: 'Shipper' },
        { key: 'pol', label: 'POL' },
        { key: 'pod', label: 'POD' },
        { key: 'etdOrigin', label: 'ETD Origem' },
        { key: 'etaDestination', label: 'ETA Destino' },
        { key: 'quantBox', label: 'Quant Box' },
        { key: 'blNumber', label: 'N° BL' },
        { key: 'carrier', label: 'Armador' },
        { key: 'booking', label: 'Booking' }
    ];

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        setIsLoading(true);
        try {
            const authenticated = await excelService.initializeAuth();
            setIsAuthenticated(authenticated);

            if (authenticated) {
                await loadWorkbooks();
            }
        } catch (error) {
            console.error('Erro na verificação de autenticação:', error);
            setError('Erro na autenticação com Microsoft Excel');
        } finally {
            setIsLoading(false);
        }
    };

    const loadWorkbooks = async () => {
        try {
            setIsLoading(true);
            const workbooksData = await excelService.listExcelFiles();
            setWorkbooks(workbooksData);
        } catch (error) {
            console.error('Erro ao carregar workbooks:', error);
            setError('Erro ao carregar arquivos Excel');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWorkbookChange = async (workbookId: string) => {
        setSelectedWorkbook(workbookId);
        setSelectedWorksheet('');
        setSelectedTable('');
        setHeaders([]);
        setMapping({});

        if (workbookId) {
            try {
                const workbook = workbooks.find(w => w.id === workbookId);
                if (workbook) {
                    // Se há apenas uma planilha, seleciona automaticamente
                    if (workbook.worksheets.length === 1) {
                        setSelectedWorksheet(workbook.worksheets[0].id);
                        await handleWorksheetChange(workbook.worksheets[0].id);
                    }
                }
            } catch (error) {
                console.error('Erro ao processar workbook:', error);
            }
        }
    };

    const handleWorksheetChange = async (worksheetId: string) => {
        setSelectedWorksheet(worksheetId);
        setSelectedTable('');
        setHeaders([]);
        setMapping({});

        if (worksheetId && selectedWorkbook) {
            try {
                const workbook = workbooks.find(w => w.id === selectedWorkbook);
                const worksheet = workbook?.worksheets.find(w => w.id === worksheetId);

                if (worksheet) {
                    // Se há apenas uma tabela, seleciona automaticamente
                    if (worksheet.tables.length === 1) {
                        setSelectedTable(worksheet.tables[0].id);
                        await handleTableChange(worksheet.tables[0].id);
                    }
                }
            } catch (error) {
                console.error('Erro ao processar worksheet:', error);
            }
        }
    };

    const handleTableChange = async (tableId: string) => {
        setSelectedTable(tableId);
        setHeaders([]);
        setMapping({});

        if (tableId && selectedWorkbook && selectedWorksheet) {
            try {
                const workbook = workbooks.find(w => w.id === selectedWorkbook);
                const worksheet = workbook?.worksheets.find(w => w.id === selectedWorksheet);
                const table = worksheet?.tables.find(t => t.id === tableId);

                if (table && table.rows.length > 0) {
                    // Usa a primeira linha como cabeçalho
                    const headerRow = table.rows[0];
                    setHeaders(headerRow.values);

                    // Mapeia automaticamente campos com nomes similares
                    const autoMapping: Record<string, string> = {};
                    headerRow.values.forEach((header: string, index: number) => {
                        const field = availableFields.find(f =>
                            f.label.toLowerCase().includes(header.toLowerCase()) ||
                            header.toLowerCase().includes(f.label.toLowerCase())
                        );
                        if (field) {
                            autoMapping[header] = field.key;
                        }
                    });
                    setMapping(autoMapping);
                }
            } catch (error) {
                console.error('Erro ao processar tabela:', error);
            }
        }
    };

    const handleMappingChange = (header: string, field: string) => {
        setMapping(prev => ({
            ...prev,
            [header]: field
        }));
    };

    const handleSave = () => {
        if (!selectedWorkbook || !selectedWorksheet || !selectedTable || headers.length === 0) {
            setError('Por favor, selecione um workbook, planilha e tabela válidos');
            return;
        }

        const config: ExcelConfig = {
            workbookId: selectedWorkbook,
            worksheetName: selectedWorksheet,
            tableName: selectedTable,
            headers,
            mapping
        };

        onConfigSaved(config);
    };

    const handleDisconnect = () => {
        excelService.disconnect();
        setIsAuthenticated(false);
        setWorkbooks([]);
        setSelectedWorkbook('');
        setSelectedWorksheet('');
        setSelectedTable('');
        setHeaders([]);
        setMapping({});
    };

    if (isLoading) {
        return (
            <div className="excel-config-overlay">
                <div className="excel-config-modal">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Carregando configuração do Excel...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="excel-config-overlay">
            <div className="excel-config-modal">
                <div className="excel-config-header">
                    <h2>Configuração do Excel Online</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="excel-config-content">
                    {!isAuthenticated ? (
                        <div className="auth-section">
                            <div className="auth-info">
                                <h3>Conectar com Microsoft Excel</h3>
                                <p>Para usar o Excel como banco de dados vivo, você precisa conectar sua conta Microsoft.</p>
                                <ul>
                                    <li>✅ Acesso em tempo real aos dados</li>
                                    <li>✅ Sincronização automática</li>
                                    <li>✅ Mapeamento inteligente de campos</li>
                                </ul>
                            </div>
                            <button
                                className="auth-button"
                                onClick={checkAuthentication}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Conectando...' : 'Conectar com Microsoft'}
                            </button>
                        </div>
                    ) : (
                        <div className="config-section">
                            <div className="config-step">
                                <h3>1. Selecione o Arquivo Excel</h3>
                                <select
                                    value={selectedWorkbook}
                                    onChange={(e) => handleWorkbookChange(e.target.value)}
                                    className="config-select"
                                >
                                    <option value="">Selecione um arquivo...</option>
                                    {workbooks.map(workbook => (
                                        <option key={workbook.id} value={workbook.id}>
                                            {workbook.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedWorkbook && (
                                <div className="config-step">
                                    <h3>2. Selecione a Planilha</h3>
                                    <select
                                        value={selectedWorksheet}
                                        onChange={(e) => handleWorksheetChange(e.target.value)}
                                        className="config-select"
                                    >
                                        <option value="">Selecione uma planilha...</option>
                                        {workbooks
                                            .find(w => w.id === selectedWorkbook)
                                            ?.worksheets.map(worksheet => (
                                                <option key={worksheet.id} value={worksheet.id}>
                                                    {worksheet.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {selectedWorksheet && (
                                <div className="config-step">
                                    <h3>3. Selecione a Tabela</h3>
                                    <select
                                        value={selectedTable}
                                        onChange={(e) => handleTableChange(e.target.value)}
                                        className="config-select"
                                    >
                                        <option value="">Selecione uma tabela...</option>
                                        {workbooks
                                            .find(w => w.id === selectedWorkbook)
                                            ?.worksheets.find(w => w.id === selectedWorksheet)
                                            ?.tables.map(table => (
                                                <option key={table.id} value={table.id}>
                                                    {table.name} ({table.address})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {headers.length > 0 && (
                                <div className="config-step">
                                    <h3>4. Mapeamento de Campos</h3>
                                    <p>Mapeie as colunas do Excel com os campos do sistema:</p>
                                    <div className="mapping-container">
                                        {headers.map((header, index) => (
                                            <div key={index} className="mapping-row">
                                                <label className="mapping-label">{header}</label>
                                                <select
                                                    value={mapping[header] || ''}
                                                    onChange={(e) => handleMappingChange(header, e.target.value)}
                                                    className="mapping-select"
                                                >
                                                    <option value="">-- Não mapear --</option>
                                                    {availableFields.map(field => (
                                                        <option key={field.key} value={field.key}>
                                                            {field.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <div className="config-actions">
                                <button
                                    className="disconnect-button"
                                    onClick={handleDisconnect}
                                >
                                    Desconectar
                                </button>
                                <button
                                    className="save-button"
                                    onClick={handleSave}
                                    disabled={!selectedWorkbook || !selectedWorksheet || !selectedTable}
                                >
                                    Salvar Configuração
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExcelConfigModal;
