import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import './advanced-filters.css';

interface AdvancedFiltersProps {
    shipments: any[];
    onFiltersChange: (filters: FilterOptions) => void;
    isAdmin?: boolean;
}

export interface FilterOptions {
    period: string;
    status: string;
    documentType: string;
    client: string;
    dateFrom: string;
    dateTo: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    shipments,
    onFiltersChange,
    isAdmin = false
}) => {
    const [filters, setFilters] = useState<FilterOptions>({
        period: '',
        status: '',
        documentType: '',
        client: '',
        dateFrom: '',
        dateTo: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    // Contar filtros ativos
    useEffect(() => {
        const count = Object.values(filters).filter(value => value !== '').length;
        setActiveFiltersCount(count);
    }, [filters]);

    // Aplicar filtros quando mudarem - usando useCallback para evitar loops
    const applyFilters = useCallback(() => {
        // Só chamar onFiltersChange se houver filtros ativos
        const hasActiveFilters = Object.values(filters).some(value => value !== '');
        if (hasActiveFilters || Object.values(filters).every(value => value === '')) {
            onFiltersChange(filters);
        }
    }, [filters, onFiltersChange]);

    // Aplicar filtros quando mudarem
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const clearFilters = useCallback(() => {
        const clearedFilters = {
            period: '',
            status: '',
            documentType: '',
            client: '',
            dateFrom: '',
            dateTo: ''
        };
        setFilters(clearedFilters);
    }, []);

    const getUniqueClients = useMemo(() => {
        return Array.from(new Set(shipments.map(s => s.cliente).filter(Boolean)));
    }, [shipments]);

    const getFilteredShipments = () => {
        let filtered = [...shipments];

        // Filtro por período
        if (filters.period) {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            switch (filters.period) {
                case 'this-month':
                    filtered = filtered.filter(s => {
                        if (s.createdAt) {
                            const date = s.createdAt instanceof Date ? s.createdAt : s.createdAt.toDate();
                            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                        }
                        return false;
                    });
                    break;
                case 'last-month':
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    filtered = filtered.filter(s => {
                        if (s.createdAt) {
                            const date = s.createdAt instanceof Date ? s.createdAt : s.createdAt.toDate();
                            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
                        }
                        return false;
                    });
                    break;
                case 'this-quarter':
                    const currentQuarter = Math.floor(currentMonth / 3);
                    filtered = filtered.filter(s => {
                        if (s.createdAt) {
                            const date = s.createdAt instanceof Date ? s.createdAt : s.createdAt.toDate();
                            const shipmentQuarter = Math.floor(date.getMonth() / 3);
                            return shipmentQuarter === currentQuarter && date.getFullYear() === currentYear;
                        }
                        return false;
                    });
                    break;
                case 'this-year':
                    filtered = filtered.filter(s => {
                        if (s.createdAt) {
                            const date = s.createdAt instanceof Date ? s.createdAt : s.createdAt.toDate();
                            return date.getFullYear() === currentYear;
                        }
                        return false;
                    });
                    break;
            }
        }

        // Filtro por status
        if (filters.status) {
            filtered = filtered.filter(s => s.status === filters.status);
        }

        // Filtro por cliente
        if (filters.client) {
            filtered = filtered.filter(s => s.cliente === filters.client);
        }

        // Filtros de data
        if (filters.dateFrom) {
            filtered = filtered.filter(s => {
                if (s.createdAt) {
                    const date = s.createdAt instanceof Date ? s.createdAt : s.createdAt.toDate();
                    return date >= new Date(filters.dateFrom);
                }
                return false;
            });
        }

        if (filters.dateTo) {
            filtered = filtered.filter(s => {
                if (s.createdAt) {
                    const date = s.createdAt instanceof Date ? s.createdAt : s.createdAt.toDate();
                    return date <= new Date(filters.dateTo);
                }
                return false;
            });
        }

        return filtered;
    };

    const filteredShipments = getFilteredShipments();

    return (
        <div className="advanced-filters-container">
            {/* Botão para mostrar/ocultar filtros */}
            <div className="filters-toggle">
                <button
                    className={`filters-toggle-btn ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={16} />
                    Filtros Avançados
                    {activeFiltersCount > 0 && (
                        <span className="active-filters-badge">{activeFiltersCount}</span>
                    )}
                </button>
            </div>

            {/* Painel de filtros */}
            {showFilters && (
                <div className="filters-panel">
                    <div className="filters-header">
                        <h3>Filtros Avançados</h3>
                        <button
                            className="close-filters-btn"
                            onClick={() => setShowFilters(false)}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="filters-content">
                        <div className="filters-grid">
                            {/* Filtro por período */}
                            <div className="filter-group">
                                <label htmlFor="period">
                                    <Calendar size={16} />
                                    Período
                                </label>
                                <select
                                    id="period"
                                    value={filters.period}
                                    onChange={(e) => handleFilterChange('period', e.target.value)}
                                >
                                    <option value="">Todos os períodos</option>
                                    <option value="this-month">Este mês</option>
                                    <option value="last-month">Mês passado</option>
                                    <option value="this-quarter">Este trimestre</option>
                                    <option value="this-year">Este ano</option>
                                </select>
                            </div>

                            {/* Filtro por status */}
                            <div className="filter-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">Todos os status</option>
                                    <option value="documentacao">Documentação</option>
                                    <option value="agendado">Agendado</option>
                                    <option value="embarcado">Embarcado</option>
                                    <option value="em-transito">Em Trânsito</option>
                                    <option value="concluido">Concluído</option>
                                    <option value="entregue">Entregue</option>
                                </select>
                            </div>

                            {/* Filtro por tipo de documento (apenas para admin) */}
                            {isAdmin && (
                                <div className="filter-group">
                                    <label htmlFor="documentType">Tipo de Documento</label>
                                    <select
                                        id="documentType"
                                        value={filters.documentType}
                                        onChange={(e) => handleFilterChange('documentType', e.target.value)}
                                    >
                                        <option value="">Todos os tipos</option>
                                        <option value="bl">Bill of Lading</option>
                                        <option value="invoice">Invoice</option>
                                        <option value="packing-list">Packing List</option>
                                        <option value="certificate">Certificate</option>
                                        <option value="other">Outros</option>
                                    </select>
                                </div>
                            )}

                            {/* Filtro por cliente */}
                            <div className="filter-group">
                                <label htmlFor="client">Cliente</label>
                                <select
                                    id="client"
                                    value={filters.client}
                                    onChange={(e) => handleFilterChange('client', e.target.value)}
                                >
                                    <option value="">Todos os clientes</option>
                                    {getUniqueClients().map(client => (
                                        <option key={client} value={client}>{client}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por data de início */}
                            <div className="filter-group">
                                <label htmlFor="dateFrom">Data de Início</label>
                                <input
                                    type="date"
                                    id="dateFrom"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                />
                            </div>

                            {/* Filtro por data de fim */}
                            <div className="filter-group">
                                <label htmlFor="dateTo">Data de Fim</label>
                                <input
                                    type="date"
                                    id="dateTo"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Resultados dos filtros */}
                        <div className="filters-results">
                            <p>
                                <strong>{filteredShipments.length}</strong> de <strong>{shipments.length}</strong> envios encontrados
                            </p>
                        </div>

                        {/* Ações dos filtros */}
                        <div className="filters-actions">
                            <button
                                className="clear-filters-btn"
                                onClick={clearFilters}
                                disabled={activeFiltersCount === 0}
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
