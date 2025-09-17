import React, { useState } from 'react';
import './excel-test.css';

const ExcelTest: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async () => {
        setIsLoading(true);

        // Simula o processo de conexão
        setTimeout(() => {
            setIsConnected(true);
            setIsLoading(false);
        }, 2000);
    };

    const handleDisconnect = () => {
        setIsConnected(false);
    };

    return (
        <div className="excel-test-container">
            <div className="excel-test-card">
                <h2>🧪 Teste de Integração Excel</h2>
                <p>Esta é uma versão de teste que simula a conexão com Excel sem precisar configurar Azure AD.</p>

                {!isConnected ? (
                    <div className="connection-section">
                        <div className="status-indicator offline">
                            <span className="status-dot"></span>
                            <span>Desconectado</span>
                        </div>

                        <button
                            className="connect-btn"
                            onClick={handleConnect}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    Conectando...
                                </>
                            ) : (
                                '🔗 Conectar Excel (Teste)'
                            )}
                        </button>

                        <div className="info-box">
                            <h4>ℹ️ Informações:</h4>
                            <ul>
                                <li>Esta é uma simulação para teste</li>
                                <li>Não requer configuração do Azure AD</li>
                                <li>Funciona com qualquer conta Microsoft</li>
                                <li>Dados são simulados localmente</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="connection-section">
                        <div className="status-indicator online">
                            <span className="status-dot"></span>
                            <span>Conectado</span>
                        </div>

                        <div className="success-message">
                            <h3>✅ Conexão Estabelecida!</h3>
                            <p>Integração com Excel simulada com sucesso.</p>
                        </div>

                        <div className="features-list">
                            <h4>🚀 Funcionalidades Ativas:</h4>
                            <ul>
                                <li>✅ Sincronização automática</li>
                                <li>✅ Dados em tempo real</li>
                                <li>✅ Integração bidirecional</li>
                                <li>✅ Mapeamento inteligente</li>
                            </ul>
                        </div>

                        <button
                            className="disconnect-btn"
                            onClick={handleDisconnect}
                        >
                            🔌 Desconectar
                        </button>
                    </div>
                )}

                <div className="next-steps">
                    <h4>📋 Próximos Passos:</h4>
                    <ol>
                        <li>Para usar com dados reais, configure o Azure AD</li>
                        <li>Registre uma aplicação no Azure Portal</li>
                        <li>Configure as permissões necessárias</li>
                        <li>Atualize o Client ID no arquivo .env</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default ExcelTest;
