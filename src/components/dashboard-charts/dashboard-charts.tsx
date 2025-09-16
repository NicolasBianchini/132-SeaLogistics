import React, { useMemo, useRef, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Ship, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/language-context';
import './dashboard-charts.css';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

import type { Timestamp } from 'firebase/firestore';

interface Shipment {
  id?: string;
  cliente: string;
  status: string;
  etdOrigem?: string;
  pol?: string;
  pod?: string;
  armador?: string;
  tipo?: string;
  createdAt?: Date | Timestamp;
}

interface DashboardChartsProps {
  shipments: Shipment[];
  isAdmin?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ shipments, isAdmin = false }) => {
  const { translations } = useLanguage();
  const prevShipmentsRef = useRef<Shipment[]>([]);
  const [stableShipments, setStableShipments] = React.useState<Shipment[]>([]);

  // Estabilizar os dados para evitar piscamento
  useEffect(() => {
    if (!shipments || !Array.isArray(shipments)) {
      setStableShipments([]);
      return;
    }

    // Só atualizar se os dados realmente mudaram
    const currentData = JSON.stringify(shipments.map(s => ({ id: s.id, cliente: s.cliente, status: s.status, armador: s.armador })));
    const prevData = JSON.stringify(prevShipmentsRef.current.map(s => ({ id: s.id, cliente: s.cliente, status: s.status, armador: s.armador })));

    if (currentData !== prevData) {
      // Adicionar delay para estabilizar
      const timer = setTimeout(() => {
        setStableShipments(shipments);
        prevShipmentsRef.current = shipments;
      }, 100); // 100ms de delay

      return () => clearTimeout(timer);
    }
  }, [shipments]);

  // Verificar se shipments é válido e tem dados
  const validShipments = useMemo(() => {
    if (!stableShipments || !Array.isArray(stableShipments) || stableShipments.length === 0) {
      return [];
    }
    return stableShipments.filter(s => s && typeof s === 'object');
  }, [stableShipments]);

  // Dados para gráfico de pizza de status
  const getStatusData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const statusCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      const status = shipment.status || 'Não definido';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count], index) => ({
      name: status,
      value: count,
      color: COLORS[index % COLORS.length]
    }));
  };

  // Dados para gráfico de evolução mensal (para usuários comuns)
  const getMonthlyData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const monthlyCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      if (shipment.etdOrigem) {
        const date = new Date(shipment.etdOrigem);
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });

    return Object.entries(monthlyCounts)
      .sort((a, b) => {
        const [monthA, yearA] = a[0].split('/');
        const [monthB, yearB] = b[0].split('/');
        return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() -
          new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
      })
      .map(([month, count]) => ({
        name: month,
        value: count,
        color: '#8884d8'
      }));
  };

  // Dados para gráfico de portos de origem (para usuários comuns)
  const getPortData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const portCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      if (shipment.pol) {
        const port = shipment.pol;
        portCounts[port] = (portCounts[port] || 0) + 1;
      }
    });

    return Object.entries(portCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([port, count], index) => ({
        name: port,
        value: count,
        color: COLORS[index % COLORS.length]
      }));
  };

  // Dados para gráfico de clientes (apenas para admins)
  const getClientData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const clientCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      const client = shipment.cliente || 'Não definido';
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    });

    return Object.entries(clientCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([client, count], index) => ({
        name: client,
        value: count,
        color: COLORS[index % COLORS.length]
      }));
  };

  // Dados para gráfico de navios/armadores (apenas para admins)
  const getVesselData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const vesselCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      if (shipment.armador) {
        const vessel = shipment.armador;
        vesselCounts[vessel] = (vesselCounts[vessel] || 0) + 1;
      }
    });

    return Object.entries(vesselCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([vessel, count], index) => ({
        name: vessel,
        value: count,
        color: COLORS[index % COLORS.length]
      }));
  };

  // Calcular estatísticas gerais
  const getGeneralStats = () => {
    const total = validShipments.length;
    const completed = validShipments.filter(s => s.status === 'concluido' || s.status === 'entregue').length;
    const pending = validShipments.filter(s => s.status === 'documentacao' || s.status === 'pendente').length;
    const inTransit = validShipments.filter(s => s.status === 'em-transito' || s.status === 'embarcado').length;

    return {
      total,
      completed,
      pending,
      inTransit,
      completedPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0
    };
  };

  // Dados para gráficos
  const statusData = getStatusData();
  const monthlyData = getMonthlyData();
  const portData = getPortData();
  const clientData = getClientData();
  const vesselData = getVesselData();
  const stats = useMemo(() => getGeneralStats(), [validShipments]);

  // Verificar se há dados para mostrar
  if (validShipments.length === 0) {
    // Se não há dados estáveis mas há dados originais, mostrar loading
    if (shipments && shipments.length > 0) {
      return (
        <div className="dashboard-charts">
          <div className="loading-charts">
            <Package size={48} />
            <h3>{translations.loadingCharts}</h3>
            <p>{translations.stabilizingData}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-charts">
        <div className="no-data-message">
          <Package size={48} />
          <h3>Nenhum dado disponível</h3>
          <p>Não há envios para exibir nos gráficos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-charts">
      {/* Estatísticas Gerais */}
      <div className="stats-overview">
        <div className="stat-item">
          <div className="stat-icon total">
            <Ship size={20} />
          </div>
          <div className="stat-content">
            <h3>{translations.totalShipments}</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon completed">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>{translations.completed}</h3>
            <p className="stat-number">{stats.completedPercentage}%</p>
            <small>{stats.completed} de {stats.total}</small>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <h3>{translations.pending}</h3>
            <p className="stat-number">{stats.pendingPercentage}%</p>
            <small>{stats.pending} de {stats.total}</small>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon in-transit">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <h3>{translations.inTransit}</h3>
            <p className="stat-number">{stats.inTransit}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de Pizza - Status */}
        <div className="chart-container">
          <h3>{translations.distributionByStatus}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Evolução Mensal Pessoal */}
        <div className="chart-container">
          <h3>{translations.evolutionOfMyShipments}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Linha - Status ao Longo do Tempo */}
        <div className="chart-container">
          <h3>{translations.statusOfMyShipments}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Portos de Origem */}
        <div className="chart-container">
          <h3>{translations.originPorts}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={portData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
