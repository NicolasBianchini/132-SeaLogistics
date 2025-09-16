import React, { useState, useEffect } from 'react';
import { excelService, ExcelConfig } from '../../services/excelService';
import './excel-sync.css';

interface ExcelSyncProps {
    config: ExcelConfig | null;
    onDataUpdate: (data: any[]) => void;
}

const ExcelSync: React.FC<ExcelSyncProps> = ({ config, onDataUpdate }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [syncStatus, setSyncStatus] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [autoSync, setAutoSync] = useState(false);
    const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (config) {
            checkConnection();
        }
        return () => {
            if (syncInterval) {
                clearInterval(syncInterval);
            }
        };
    }, [config]);

    const checkConnection = async () => {
        if (!config) return;

        try {
            // Verifica se consegue acessar a tabela
            await excelService.getTableRows(config.workbookId, config.worksheetName, config.tableName);
            setIsConnected(true);
            setError('');
        } catch (error) {
            console.error('Erro na verificação de conexão:', error);
            setIsConnected(false);
            setError('Erro na conexão com Excel');
        }
    };

    const performSync = async () => {
        if (!config || isSyncing) return;

        setIsSyncing(true);
        setSyncStatus('Sincronizando...');
        setError('');

        try {
            // Obtém dados do Excel
            const excelData = await excelService.getShipmentsFromExcel(config);

            // Atualiza dados no sistema
            onDataUpdate(excelData);

            setLastSync(new Date());
            setSyncStatus(`Sincronizado com sucesso - ${excelData.length} registros`);
            setIsConnected(true);
        } catch (error) {
            console.error('Erro na sincronização:', error);
            setError('Erro na sincronização com Excel');
            setSyncStatus('Erro na sincronização');
            setIsConnected(false);
        } finally {
            setIsSyncing(false);
        }
    };

    const syncToExcel = async (shipments: any[]) => {
        if (!config || isSyncing) return;

        setIsSyncing(true);
        setSyncStatus('Enviando dados para Excel...');
        setError('');

        try {
            await excelService.syncShipmentsToExcel(config, shipments);
            setLastSync(new Date());
            setSyncStatus(`Dados enviados com sucesso - ${shipments.length} registros`);
        } catch (error) {
            console.error('Erro ao enviar dados para Excel:', error);
            setError('Erro ao enviar dados para Excel');
            setSyncStatus('Erro no envio');
        } finally {
            setIsSyncing(false);
        }
    };

    const toggleAutoSync = () => {
        if (autoSync) {
            // Para sincronização automática
            if (syncInterval) {
                clearInterval(syncInterval);
                setSyncInterval(null);
            }
            setAutoSync(false);
            setSyncStatus('Sincronização automática desabilitada');
        } else {
            // Inicia sincronização automática (a cada 30 segundos)
            const interval = setInterval(() => {
                performSync();
            }, 30000);

            setSyncInterval(interval);
            setAutoSync(true);
            setSyncStatus('Sincronização automática ativada (30s)');

            // Faz primeira sincronização imediatamente
            performSync();
        }
    };

    const setupWebhook = async () => {
        if (!config) return;

        try {
            const callbackUrl = `${window.location.origin}/api/excel/webhook`;
            await excelService.setupWebhook(config.workbookId, callbackUrl);
            setSyncStatus('Webhook configurado para mudanças em tempo real');
        } catch (error) {
            console.error('Erro ao configurar webhook:', error);
            setError('Erro ao configurar webhook');
        }
    };

    const removeWebhook = async () => {
        try {
            await excelService.removeWebhook();
            setSyncStatus('Webhook removido');
        } catch (error) {
            console.error('Erro ao remover webhook:', error);
        }
    };

    if (!config) {
        return (
            <div className="excel-sync-container">
                <div className="excel-sync-placeholder">
                    <div className="excel-icon">📊</div>
                    <h3>Excel não configurado</h3>
                    <p>Configure a integração com Excel para sincronização em tempo real</p>
                </div>
            </div>
        );
    }

    return (
        <div className="excel-sync-container">
            <div className="excel-sync-header">
                <div className="excel-sync-title">
                    <div className="excel-icon">📊</div>
                    <h3>Sincronização Excel</h3>
                </div>
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    <div className="status-dot"></div>
                    <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
            </div>

            <div className="excel-sync-info">
                <div className="sync-info-item">
                    <strong>Arquivo:</strong> {config.workbookId}
                </div>
                <div className="sync-info-item">
                    <strong>Planilha:</strong> {config.worksheetName}
                </div>
                <div className="sync-info-item">
                    <strong>Tabela:</strong> {config.tableName}
                </div>
                {lastSync && (
                    <div className="sync-info-item">
                        <strong>Última sincronização:</strong> {lastSync.toLocaleString()}
                    </div>
                )}
            </div>

            {syncStatus && (
                <div className={`sync-status ${error ? 'error' : 'success'}`}>
                    {syncStatus}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="excel-sync-actions">
                <button
                    className="sync-button primary"
                    onClick={performSync}
                    disabled={isSyncing || !isConnected}
                >
                    {isSyncing ? (
                        <>
                            <div className="loading-spinner"></div>
                            Sincronizando...
                        </>
                    ) : (
                        <>
                            <span>🔄</span>
                            Sincronizar Agora
                        </>
                    )}
                </button>

                <button
                    className={`sync-button ${autoSync ? 'active' : 'secondary'}`}
                    onClick={toggleAutoSync}
                    disabled={isSyncing || !isConnected}
                >
                    <span>{autoSync ? '⏸️' : '▶️'}</span>
                    {autoSync ? 'Parar Auto Sync' : 'Auto Sync'}
                </button>

                <button
                    className="sync-button secondary"
                    onClick={checkConnection}
                    disabled={isSyncing}
                >
                    <span>🔍</span>
                    Verificar Conexão
                </button>
            </div>

            <div className="excel-sync-advanced">
                <h4>Configurações Avançadas</h4>
                <div className="advanced-actions">
                    <button
                        className="webhook-button"
                        onClick={setupWebhook}
                        disabled={isSyncing}
                    >
                        <span>🔗</span>
                        Configurar Webhook
                    </button>

                    <button
                        className="webhook-button remove"
                        onClick={removeWebhook}
                        disabled={isSyncing}
                    >
                        <span>❌</span>
                        Remover Webhook
                    </button>
                </div>

                <div className="webhook-info">
                    <p><strong>Webhook:</strong> Recebe notificações em tempo real quando o Excel é modificado</p>
                    <p><strong>Auto Sync:</strong> Sincroniza automaticamente a cada 30 segundos</p>
                </div>
            </div>

            <div className="excel-sync-stats">
                <h4>Estatísticas</h4>
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-value">{config.headers.length}</div>
                        <div className="stat-label">Colunas Mapeadas</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{Object.keys(config.mapping).length}</div>
                        <div className="stat-label">Campos Ativos</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{autoSync ? 'Ativo' : 'Inativo'}</div>
                        <div className="stat-label">Auto Sync</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelSync;
