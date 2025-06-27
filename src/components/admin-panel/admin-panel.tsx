import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { User, Company, UserRole } from '../../types/user';
import { Shipment } from '../../context/shipments-context';
import { db } from '../../lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './admin-panel.css';

interface AdminPanelProps {
    onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'companies' | 'shipments'>('users');

    useEffect(() => {
        if (!isAdmin()) return;
        loadData();
    }, [isAdmin]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Carregar usuários
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id
            } as User));
            setUsers(usersData);

            // Carregar empresas
            const companiesSnapshot = await getDocs(collection(db, 'companies'));
            const companiesData = companiesSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as Company));
            setCompanies(companiesData);

            // Carregar shipments
            const shipmentsSnapshot = await getDocs(collection(db, 'shipments'));
            const shipmentsData = shipmentsSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as Shipment));
            setShipments(shipmentsData);

        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                isActive: !currentStatus,
                updatedAt: new Date()
            });

            setUsers(users.map(user =>
                user.uid === userId
                    ? { ...user, isActive: !currentStatus }
                    : user
            ));
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Erro ao atualizar status do usuário');
        }
    };

    const toggleCompanyStatus = async (companyId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'companies', companyId), {
                isActive: !currentStatus,
                updatedAt: new Date()
            });

            setCompanies(companies.map(company =>
                company.id === companyId
                    ? { ...company, isActive: !currentStatus }
                    : company
            ));
        } catch (error) {
            console.error('Error updating company status:', error);
            alert('Erro ao atualizar status da empresa');
        }
    };

    const assignShipmentToCompany = async (shipmentId: string, companyId: string) => {
        try {
            await updateDoc(doc(db, 'shipments', shipmentId), {
                companyId: companyId === 'unassigned' ? null : companyId,
                updatedAt: new Date()
            });

            setShipments(shipments.map(shipment =>
                shipment.id === shipmentId
                    ? { ...shipment, companyId: companyId === 'unassigned' ? undefined : companyId }
                    : shipment
            ));
        } catch (error) {
            console.error('Error assigning shipment:', error);
            alert('Erro ao atribuir shipment à empresa');
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(users.filter(user => user.uid !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao excluir usuário');
        }
    };

    const getCompanyName = (companyId?: string) => {
        if (!companyId) return 'Não atribuído';
        const company = companies.find(c => c.id === companyId);
        return company ? company.name : 'Empresa não encontrada';
    };

    if (!isAdmin()) {
        return (
            <div className="admin-panel">
                <div className="admin-panel-content">
                    <h2>Acesso Negado</h2>
                    <p>Você não tem permissão para acessar o painel administrativo.</p>
                    <button onClick={onClose}>Fechar</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-panel">
                <div className="admin-panel-content">
                    <h2>Carregando...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-content">
                <div className="admin-panel-header">
                    <h2>Painel Administrativo</h2>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <div className="admin-tabs">
                    <button
                        className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Usuários ({users.length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'companies' ? 'active' : ''}`}
                        onClick={() => setActiveTab('companies')}
                    >
                        Empresas ({companies.length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'shipments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shipments')}
                    >
                        Shipments ({shipments.length})
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="admin-section">
                        <h3>Gerenciar Usuários</h3>
                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Empresa</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.uid}>
                                            <td>{user.displayName}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`role-badge ${user.role}`}>
                                                    {user.role === UserRole.ADMIN ? 'Admin' : 'Empresa'}
                                                </span>
                                            </td>
                                            <td>{user.companyName || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                    {user.isActive ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => toggleUserStatus(user.uid, user.isActive)}
                                                    className="action-button"
                                                >
                                                    {user.isActive ? 'Desativar' : 'Ativar'}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.uid)}
                                                    className="action-button delete"
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'companies' && (
                    <div className="admin-section">
                        <h3>Gerenciar Empresas</h3>
                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Código</th>
                                        <th>Email de Contato</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map(company => (
                                        <tr key={company.id}>
                                            <td>{company.name}</td>
                                            <td>{company.code}</td>
                                            <td>{company.contactEmail}</td>
                                            <td>
                                                <span className={`status-badge ${company.isActive ? 'active' : 'inactive'}`}>
                                                    {company.isActive ? 'Ativa' : 'Inativa'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => toggleCompanyStatus(company.id, company.isActive)}
                                                    className="action-button"
                                                >
                                                    {company.isActive ? 'Desativar' : 'Ativar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'shipments' && (
                    <div className="admin-section">
                        <h3>Gerenciar Shipments</h3>
                        <div className="admin-note">
                            <p><strong>Nota:</strong> Apenas administradores podem criar shipments. Use esta aba para atribuir shipments às empresas.</p>
                        </div>
                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>BL</th>
                                        <th>Cliente</th>
                                        <th>POL → POD</th>
                                        <th>Status</th>
                                        <th>Empresa Atual</th>
                                        <th>Atribuir à Empresa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipments.map(shipment => (
                                        <tr key={shipment.id}>
                                            <td>{shipment.numeroBl}</td>
                                            <td>{shipment.cliente}</td>
                                            <td>{shipment.pol} → {shipment.pod}</td>
                                            <td>{shipment.status}</td>
                                            <td>{getCompanyName(shipment.companyId)}</td>
                                            <td>
                                                <select
                                                    value={shipment.companyId || 'unassigned'}
                                                    onChange={(e) => assignShipmentToCompany(shipment.id!, e.target.value)}
                                                    className="company-selector"
                                                >
                                                    <option value="unassigned">Não atribuído</option>
                                                    {companies.filter(c => c.isActive).map(company => (
                                                        <option key={company.id} value={company.id}>
                                                            {company.name} ({company.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}; 