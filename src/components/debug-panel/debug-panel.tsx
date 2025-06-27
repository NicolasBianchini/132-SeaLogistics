import React from 'react';
import { useAuth } from '../../context/auth-context';
import './debug-panel.css';

export const DebugPanel: React.FC = () => {
    const {
        currentUser,
        currentCompany,
        isAdmin,
        isCompanyUser,
        loading,
        refreshUserData
    } = useAuth();

    const handleRefresh = () => {
        refreshUserData();
    };

    const handleClearStorage = () => {
        localStorage.removeItem('currentUser');
        window.location.reload();
    };

    return (
        <div className="debug-panel">
            <h3>🔍 Debug Panel</h3>

            <div className="debug-section">
                <h4>Estado do Loading:</h4>
                <p>Loading: {loading ? 'true' : 'false'}</p>
            </div>

            <div className="debug-section">
                <h4>Usuário Atual:</h4>
                {currentUser ? (
                    <div>
                        <p><strong>UID:</strong> {currentUser.uid}</p>
                        <p><strong>Email:</strong> {currentUser.email}</p>
                        <p><strong>Nome:</strong> {currentUser.displayName}</p>
                        <p><strong>Role:</strong> {currentUser.role}</p>
                        <p><strong>Ativo:</strong> {currentUser.isActive ? 'Sim' : 'Não'}</p>
                        {currentUser.companyId && <p><strong>Company ID:</strong> {currentUser.companyId}</p>}
                        {currentUser.companyName && <p><strong>Company Name:</strong> {currentUser.companyName}</p>}
                    </div>
                ) : (
                    <p>Nenhum usuário logado</p>
                )}
            </div>

            <div className="debug-section">
                <h4>Empresa Atual:</h4>
                {currentCompany ? (
                    <div>
                        <p><strong>ID:</strong> {currentCompany.id}</p>
                        <p><strong>Nome:</strong> {currentCompany.name}</p>
                        <p><strong>Código:</strong> {currentCompany.code}</p>
                    </div>
                ) : (
                    <p>Nenhuma empresa carregada</p>
                )}
            </div>

            <div className="debug-section">
                <h4>Verificações de Permissão:</h4>
                <p><strong>É Admin:</strong> {isAdmin() ? 'SIM' : 'NÃO'}</p>
                <p><strong>É Usuário de Empresa:</strong> {isCompanyUser() ? 'SIM' : 'NÃO'}</p>
            </div>

            <div className="debug-section">
                <h4>LocalStorage:</h4>
                <pre>{localStorage.getItem('currentUser') || 'Nenhum dado'}</pre>
            </div>

            <div className="debug-actions">
                <button onClick={handleRefresh} className="debug-btn">
                    🔄 Atualizar Dados
                </button>
                <button onClick={handleClearStorage} className="debug-btn danger">
                    🗑️ Limpar Storage
                </button>
            </div>
        </div>
    );
}; 