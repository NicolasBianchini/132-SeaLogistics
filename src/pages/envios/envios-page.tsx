"use client";

import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import { NavbarContext } from "../../components/navbar/navbar-context";
import ShippingTable, {
  type Shipment,
} from "../../components/shipping-table/shipping-table";
import "./envios-page.css";

export const EnviosPage = () => {
  const { isCollapsed } = useContext(NavbarContext);
  const [searchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState({
    status: "",
    filter: ""
  });

  useEffect(() => {
    // Processar parâmetros da URL para aplicar filtros
    const status = searchParams.get('status') || '';
    const filter = searchParams.get('filter') || '';

    setActiveFilters({ status, filter });
  }, [searchParams]);

  const handleShipmentUpdate = (updatedShipment: Shipment) => {
    console.log("Envio atualizado na página de envios:", updatedShipment);
  };

  return (
    <main className="envios-container">
      <Navbar />
      <div
        className={`envios-content ${isCollapsed ? "navbar-collapsed" : ""}`}
      >
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
        />
      </div>
      <ChatAssistant />
    </main>
  );
};
