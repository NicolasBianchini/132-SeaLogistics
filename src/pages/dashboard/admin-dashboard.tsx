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
import { useLanguage } from '../../context/language-context';
import { useShipments } from '../../context/shipments-context';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { Company } from '../../types/user';
import ChatAssistant from '../../components/chat-assistant/chat-assistant';
import Navbar from '../../components/navbar/navbar';
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
    const { translations } = useLanguage();
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
    const [adminPanelTab, setAdminPanelTab] = useState<"users" | "companies" | "shipments">("users");
    
    // Função para abrir o painel admin com uma aba específica
    const openAdminPanel = (tab: "users" | "companies" | "shipments") => {
        setAdminPanelTab(tab);
        setShowAdminPanel(true);
    };

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
                const inTransit = shipments.filter(s => s.status === 'em-transito' || s.status === 'agendado').length;
                const delivered = shipments.filter(s => s.status === 'concluido').length;
                const pending = shipments.filter(s => s.status === 'documentacao').length;

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

        loadStats();
    }, [shipments]);

    if (loading || shipmentsLoading) {
        return (
            <main className="dashboard-container">
                <Navbar />
                <div className="dashboard-content">
                    <div className="loading-message">
                        Carregando...
                    </div>
                </div>
                <ChatAssistant />
            </main>
        );
    }

    return (
        <main className="dashboard-container">
            <Navbar />
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>{translations.administrativeDashboard}</h1>
                    <p>{translations.welcomeAdmin}</p>
                </div>

                {/* Cards de Estatísticas */}
                <div className="stats-grid">
                    <div className="stat-card clickable" onClick={() => navigate('/envios')}>
                        <div className="stat-icon">
                            <Ship size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.totalShipments}</h3>
                            <p className="stat-number">{stats.totalShipments}</p>
                        </div>
                    </div>

                    <div className="stat-card clickable" onClick={() => navigate('/envios?status=em-transito')}>
                        <div className="stat-icon in-transit">
                            <Package size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.inTransit}</h3>
                            <p className="stat-number">{stats.inTransit}</p>
                        </div>
                    </div>

                    <div className="stat-card clickable" onClick={() => navigate('/envios?status=concluido')}>
                        <div className="stat-icon delivered">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.delivered}</h3>
                            <p className="stat-number">{stats.delivered}</p>
                        </div>
                    </div>

                    <div className="stat-card clickable" onClick={() => navigate('/envios?status=documentacao')}>
                        <div className="stat-icon pending">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.pending}</h3>
                            <p className="stat-number">{stats.pending}</p>
                        </div>
                    </div>

                    <div className="stat-card clickable" onClick={() => navigate('/envios?filter=this-month')}>
                        <div className="stat-icon this-month">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.thisMonth}</h3>
                            <p className="stat-number">{stats.thisMonth}</p>
                        </div>
                    </div>

                    <div className="stat-card clickable" onClick={() => {
                        openAdminPanel("users");
                    }}>
                        <div className="stat-icon users">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.totalUsers}</h3>
                            <p className="stat-number">{stats.totalUsers}</p>
                        </div>
                    </div>

                    <div className="stat-card clickable" onClick={() => {
                        openAdminPanel("companies");
                    }}>
                        <div className="stat-icon companies">
                            <Building2 size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.activeCompanies}</h3>
                            <p className="stat-number">{stats.activeCompanies}/{stats.totalCompanies}</p>
                        </div>
                    </div>

                    <div className="stat-card clickable" onClick={() => navigate('/envios')}>
                        <div className="stat-icon action">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{translations.manageShipments}</h3>
                            <p className="action-text">{translations.clickToSeeAllShipments}</p>
                        </div>
                    </div>
                </div>

                {/* Ações Rápidas */}
                <div className="quick-actions">
                    <h2>{translations.quickActions}</h2>
                    <div className="actions-grid">
                        <button
                            className="action-button"
                            onClick={() => navigate('/novo-envio')}
                        >
                            <Plus size={20} />
                            <span>{translations.newShipment}</span>
                        </button>

                        <button
                            className="action-button"
                            onClick={() => {
                                openAdminPanel("users");
                            }}
                        >
                            <Shield size={20} />
                            <span>{translations.adminPanel}</span>
                        </button>

                        <button
                            className="action-button"
                            onClick={() => navigate('/settings')}
                        >
                            <Settings size={20} />
                            <span>{translations.configurations}</span>
                        </button>
                    </div>
                </div>
            </div>

            {showAdminPanel && (
                <AdminPanel onClose={() => setShowAdminPanel(false)} initialTab={adminPanelTab} />
            )}

            <ChatAssistant />
        </main>
    );
}; 