import { useState, useEffect } from 'react';
import {
    Ship,
    Package,
    Clock,
    CheckCircle,
    TrendingUp,
    Users,
    Building2,
    AlertCircle,
    Plus,
    Settings,
    Shield
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { useShipments } from '../../context/shipments-context';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { Company } from '../../types/user';
import ChatAssistant from '../../components/chat-assistant/chat-assistant';
import Navbar from '../../components/navbar/navbar';
import { LanguageProvider } from '../../context/language-context';
import { AdminPanel } from '../../components/admin-panel/admin-panel';
import './dashboard.css';

type Shipment = {
    id?: string;
    status: string;
    etdOrigem?: string;
    pol?: string;
    pod?: string;
}

interface AdminDashboardStats {
    totalShipments: number;
    inTransit: number;
    delivered: number;
    pending: number;
    thisMonth: number;
    totalUsers: number;
    totalCompanies: number;
    activeCompanies: number;
}

export const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const { shipments, loading: shipmentsLoading } = useShipments() as { shipments: Shipment[], loading: boolean };
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminDashboardStats>({
        totalShipments: 0,
        inTransit: 0,
        delivered: 0,
        pending: 0,
        thisMonth: 0,
        totalUsers: 0,
        totalCompanies: 0,
        activeCompanies: 0
    });
    const [loading, setLoading] = useState(true);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);

                // Carregar usuários
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnapshot.size;

                // Carregar empresas
                const companiesSnapshot = await getDocs(collection(db, 'companies'));
                const companies = companiesSnapshot.docs.map(doc => doc.data() as Company);
                const totalCompanies = companies.length;
                const activeCompanies = companies.filter(c => c.isActive).length;

                // Calcular estatísticas de shipments
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const totalShipments = shipments.length;
                const inTransit = shipments.filter(s => s.status === 'em-trânsito' || s.status === 'agendado').length;
                const delivered = shipments.filter(s => s.status === 'concluído').length;
                const pending = shipments.filter(s => s.status === 'documentação').length;

                const thisMonth = shipments.filter(s => {
                    if (s.etdOrigem) {
                        const shipDate = new Date(s.etdOrigem);
                        return shipDate.getMonth() === currentMonth && shipDate.getFullYear() === currentYear;
                    }
                    return false;
                }).length;

                setStats({
                    totalShipments,
                    inTransit,
                    delivered,
                    pending,
                    thisMonth,
                    totalUsers,
                    totalCompanies,
                    activeCompanies
                });
            } catch (error) {
                console.error('Error loading admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (shipments.length > 0) {
            loadStats();
        }
    }, [shipments]);

    if (loading || shipmentsLoading) {
        return (
            <LanguageProvider>
                <main className="dashboard-container">
                    <Navbar />
                    <div className="dashboard-content">
                        <div className="loading-message">
                            Carregando...
                        </div>
                    </div>
                    <ChatAssistant />
                </main>
            </LanguageProvider>
        );
    }

    return (
        <LanguageProvider>
            <main className="dashboard-container">
                <Navbar />
                <div className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>Dashboard Administrativo</h1>
                        <p>Bem-vindo, {currentUser?.displayName || 'Admin'}!</p>
                    </div>

                    {/* Cards de Estatísticas */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <Ship size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Total de Envios</h3>
                                <p className="stat-number">{stats.totalShipments}</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon in-transit">
                                <Package size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Em Trânsito</h3>
                                <p className="stat-number">{stats.inTransit}</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon delivered">
                                <CheckCircle size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Entregues</h3>
                                <p className="stat-number">{stats.delivered}</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon pending">
                                <Clock size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Pendentes</h3>
                                <p className="stat-number">{stats.pending}</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon this-month">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Este Mês</h3>
                                <p className="stat-number">{stats.thisMonth}</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon users">
                                <Users size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Total de Usuários</h3>
                                <p className="stat-number">{stats.totalUsers}</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon companies">
                                <Building2 size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Empresas Ativas</h3>
                                <p className="stat-number">{stats.activeCompanies}/{stats.totalCompanies}</p>
                            </div>
                        </div>

                        <div className="stat-card action-card" onClick={() => navigate('/envios')}>
                            <div className="stat-icon action">
                                <AlertCircle size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>Gerenciar Envios</h3>
                                <p className="action-text">Clique para ver todos os envios</p>
                            </div>
                        </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="quick-actions">
                        <h2>Ações Rápidas</h2>
                        <div className="actions-grid">
                            <button className="action-button" onClick={() => navigate('/novo-envio')}>
                                <Plus size={20} />
                                Novo Envio
                            </button>
                            <button className="action-button" onClick={() => setShowAdminPanel(true)}>
                                <Shield size={20} />
                                Painel Admin
                            </button>
                            <button className="action-button" onClick={() => navigate('/settings')}>
                                <Settings size={20} />
                                Configurações
                            </button>
                        </div>
                    </div>
                </div>
                <ChatAssistant />
            </main>

            {/* Painel Administrativo Modal */}
            {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
        </LanguageProvider>
    );
}; 