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

  // Dados para gráfico de barras por cliente
  const getClientData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const clientCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      const client = shipment.cliente || 'Cliente não definido';
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    });

    return Object.entries(clientCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 clientes
      .map(([client, count], index) => ({
        name: client,
        value: count,
        color: COLORS[index % COLORS.length]
      }));
  };

  // Dados para gráfico de barras por navio/armador
  const getVesselData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const vesselCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      const vessel = shipment.armador || 'Navio não definido';
      vesselCounts[vessel] = (vesselCounts[vessel] || 0) + 1;
    });

    return Object.entries(vesselCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8) // Top 8 navios
      .map(([vessel, count], index) => ({
        name: vessel,
        value: count,
        color: COLORS[index % COLORS.length]
      }));
  };

  // Dados para gráfico de linha por mês
  const getMonthlyData = (): ChartData[] => {
    if (validShipments.length === 0) return [];

    const monthlyCounts: { [key: string]: number } = {};

    validShipments.forEach(shipment => {
      if (shipment.createdAt) {
        let date: Date;
        if (shipment.createdAt instanceof Date) {
          date = shipment.createdAt;
        } else {
          // É um Timestamp do Firestore
          date = shipment.createdAt.toDate();
        }
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
      }
    });

    return Object.entries(monthlyCounts)
      .sort(([a], [b]) => {
        const [monthA, yearA] = a.split('/');
        const [monthB, yearB] = b.split('/');
        return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() -
          new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
      })
      .map(([month, count], index) => ({
        name: month,
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

  const statusData = useMemo(() => getStatusData(), [validShipments]);
  const clientData = useMemo(() => getClientData(), [validShipments]);
  const vesselData = useMemo(() => getVesselData(), [validShipments]);
  const monthlyData = useMemo(() => getMonthlyData(), [validShipments]);
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
            <h3>Total de Envios</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon completed">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>Completos</h3>
            <p className="stat-number">{stats.completedPercentage}%</p>
            <small>{stats.completed} de {stats.total}</small>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <h3>Pendentes</h3>
            <p className="stat-number">{stats.pendingPercentage}%</p>
            <small>{stats.pending} de {stats.total}</small>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon in-transit">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <h3>Em Trânsito</h3>
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        {/* Gráfico de Barras - Clientes */}
        <div className="chart-container">
          <h3>{translations.top10Clients}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Navios */}
        <div className="chart-container">
          <h3>Top 8 Navios/Armadores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vesselData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Linha - Evolução Mensal */}
        <div className="chart-container">
          <h3>Evolução Mensal</h3>
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
      </div>

      {/* Filtros Avançados */}
      {isAdmin && (
        <div className="advanced-filters">
          <h3>Filtros Avançados</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Período</label>
              <select defaultValue="">
                <option value="">Todos os períodos</option>
                <option value="this-month">Este mês</option>
                <option value="last-month">Mês passado</option>
                <option value="this-quarter">Este trimestre</option>
                <option value="this-year">Este ano</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select defaultValue="">
                <option value="">Todos os status</option>
                <option value="documentacao">Documentação</option>
                <option value="agendado">Agendado</option>
                <option value="embarcado">Embarcado</option>
                <option value="em-transito">Em Trânsito</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Tipo de Documento</label>
              <select defaultValue="">
                <option value="">Todos os tipos</option>
                <option value="bl">Bill of Lading</option>
                <option value="invoice">Invoice</option>
                <option value="packing-list">Packing List</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Cliente</label>
              <select defaultValue="">
                <option value="">Todos os clientes</option>
                {Array.from(new Set(shipments.map(s => s.cliente))).map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
