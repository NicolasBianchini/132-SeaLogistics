"use client";

import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import { NavbarContext } from "../../components/navbar/navbar-context";
import ShippingTable, {
  type Shipment,
} from "../../components/shipping-table/shipping-table";
import ExcelIntegration from "../../components/excel-integration/excel-integration";
import "./envios-page.css";

export const EnviosPage = () => {
  const { isCollapsed } = useContext(NavbarContext);
  const [searchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState({
    status: "",
    filter: ""
  });
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [showExcelIntegration, setShowExcelIntegration] = useState(false);

  useEffect(() => {
    // Processar parâmetros da URL para aplicar filtros
    const status = searchParams.get('status') || '';
    const filter = searchParams.get('filter') || '';

    setActiveFilters({ status, filter });
  }, [searchParams]);

  const handleShipmentUpdate = (updatedShipment: Shipment) => {
    console.log("Envio atualizado na página de envios:", updatedShipment);
    // Atualizar o shipment na lista local
    setShipments(prev =>
      prev.map(shipment =>
        shipment.id === updatedShipment.id ? updatedShipment : shipment
      )
    );
  };

  const handleShipmentsUpdate = (updatedShipments: any[]) => {
    console.log("Lista de envios atualizada via Excel:", updatedShipments);
    setShipments(updatedShipments);
  };

  return (
    <main className="envios-container">
      <Navbar />
      <div
        className={`envios-content ${isCollapsed ? "navbar-collapsed" : ""}`}
      >
        {/* Controles de Excel */}
        <div className="excel-controls">
          <div className="excel-controls-header">
            <h3>📊 Integração com Excel</h3>
            <button
              className={`excel-toggle-btn ${showExcelIntegration ? 'active' : ''}`}
              onClick={() => setShowExcelIntegration(!showExcelIntegration)}
            >
              {showExcelIntegration ? 'Ocultar Excel' : 'Mostrar Excel'}
            </button>
          </div>

          {showExcelIntegration && (
            <ExcelIntegration
              shipments={shipments}
              onShipmentsUpdate={handleShipmentsUpdate}
            />
          )}
        </div>

        {/* Mostrar filtros ativos se houver */}
        {(activeFilters.status || activeFilters.filter) && (
          <div className="active-filters">
            <h3>Filtros Ativos:</h3>
            <div className="filter-tags">
              {activeFilters.status && (
                <span className="filter-tag">
                  Status: {activeFilters.status === 'em-transito' ? 'Em Trânsito' :
                    activeFilters.status === 'concluido' ? 'Entregue' :
                      activeFilters.status === 'documentacao' ? 'Pendente' : activeFilters.status}
                </span>
              )}
              {activeFilters.filter === 'this-month' && (
                <span className="filter-tag">
                  Este Mês
                </span>
              )}
            </div>
          </div>
        )}

        <ShippingTable
          onShipmentUpdate={handleShipmentUpdate}
          initialFilters={activeFilters}
          shipments={shipments}
        />
      </div>
      <ChatAssistant />
    </main>
  );
};
