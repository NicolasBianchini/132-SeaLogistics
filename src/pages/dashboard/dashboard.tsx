import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Settings,
  Ship,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import { useAuth } from "../../context/auth-context";
import { LanguageProvider } from "../../context/language-context";
import { Shipment, useShipments } from "../../context/shipments-context";
import "./user-dashboard.css";

interface DashboardStats {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  pending: number;
  thisMonth: number;
}

interface RecentActivity {
  id: string;
  action: string;
  shipment: string;
  date: string;
  status: string;
}

export const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const { shipments, loading } = useShipments();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    thisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Redirecionar admins para a página de envios
  useEffect(() => {
    if (!loading && isAdmin()) {
      navigate("/envios");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (shipments.length > 0) {
      calculateStats(shipments);
      generateRecentActivity(shipments);
    }
  }, [shipments]);

  const calculateStats = (shipmentsToStat: Shipment[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalShipments = shipmentsToStat.length;
    const inTransit = shipmentsToStat.filter(
      (s) => s.status === "em-trânsito" || s.status === "agendado"
    ).length;
    const delivered = shipmentsToStat.filter(
      (s) => s.status === "concluído"
    ).length;
    const pending = shipmentsToStat.filter(
      (s) => s.status === "documentação"
    ).length;

    const thisMonth = shipmentsToStat.filter((s) => {
      if (s.etdOrigem) {
        const shipDate = new Date(s.etdOrigem);
        return (
          shipDate.getMonth() === currentMonth &&
          shipDate.getFullYear() === currentYear
        );
      }
      return false;
    }).length;

    setStats({
      totalShipments,
      inTransit,
      delivered,
      pending,
      thisMonth,
    });
  };

  const generateRecentActivity = (shipmentsToProcess: Shipment[]) => {
    const activities: RecentActivity[] = shipmentsToProcess
      .slice(0, 5)
      .map((shipment) => ({
        id: shipment.id || "",
        action: getActionText(shipment.status),
        shipment: `${shipment.pol} → ${shipment.pod}`,
        date: shipment.etdOrigem || "",
        status: shipment.status,
      }));

    setRecentActivity(activities);
  };

  const getActionText = (status: string) => {
    switch (status) {
      case "documentação":
        return "Documentação em andamento";
      case "agendado":
        return "Embarque agendado";
      case "em-trânsito":
        return "Em trânsito";
      case "concluído":
        return "Entregue no destino";
      default:
        return "Status atualizado";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "documentação":
        return "#073b4c";
      case "agendado":
        return "#118ab2";
      case "em-trânsito":
        return "#ffd166";
      case "concluído":
        return "#06d6a0";
      default:
        return "#6c757d";
    }
  };

  // Se for admin ou ainda carregando, não mostrar o dashboard
  if (loading || isAdmin()) {
    return (
      <LanguageProvider>
        <main className="dashboard-container">
          <Navbar />
          <div className="dashboard-content">
            <div className="loading-message">
              {loading ? "Carregando..." : "Redirecionando..."}
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
            <h1>Dashboard</h1>
            <p>Bem-vindo, {currentUser?.displayName}!</p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Ship size={24} />
              </div>
              <div className="stat-info">
                <h3>Meus Envios</h3>
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
          </div>

          {/* Seção de Atividades Recentes */}
          <div className="recent-activity">
            <h2>Meus Envios Recentes</h2>
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div
                      className="activity-status-dot"
                      style={{
                        backgroundColor: getStatusColor(activity.status),
                      }}
                    ></div>
                    <div className="activity-details">
                      <p className="activity-action">{activity.action}</p>
                      <p className="activity-shipment">
                        <MapPin size={14} />
                        {activity.shipment}
                      </p>
                    </div>
                    <div className="activity-date">
                      <Calendar size={14} />
                      {formatDate(activity.date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-activity">
                <AlertCircle size={48} />
                <p>Você ainda não possui envios registrados</p>
              </div>
            )}
          </div>

          {/* Links Rápidos */}
          <div className="quick-links">
            <h2>Acesso Rápido</h2>
            <div className="links-grid">
              <a href="/envios" className="quick-link-card">
                <Ship size={24} />
                <span>Ver Meus Envios</span>
              </a>
              <a href="/settings" className="quick-link-card">
                <Settings size={24} />
                <span>Configurações</span>
              </a>
            </div>
          </div>
        </div>
        <ChatAssistant />
      </main>
    </LanguageProvider>
  );
};
