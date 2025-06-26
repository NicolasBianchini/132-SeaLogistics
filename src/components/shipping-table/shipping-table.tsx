"use client";

import StatusSelector from "./status-selector";
import { DropdownProvider } from "./dropdown-context";
import { useShipments, Shipment } from "../../context/shipments-context";
import "./shipping-table.css";

interface ShippingTableProps {
  shipments?: Shipment[];
  onShipmentUpdate?: (shipment: Shipment) => void;
}

const ShippingTable = ({ shipments: propShipments, onShipmentUpdate }: ShippingTableProps) => {
  const { shipments: contextShipments, updateShipment, loading } = useShipments();

  // Use shipments from props if provided, otherwise use context
  const shipments = propShipments || contextShipments;

  const handleStatusChange = async (shipmentId: string, newStatus: string) => {
    const updatedShipment = shipments.find(s => s.id === shipmentId);
    if (updatedShipment) {
      try {
        const updated = { ...updatedShipment, status: newStatus };
        await updateShipment(updated);

        if (onShipmentUpdate) {
          onShipmentUpdate(updated);
        }

        console.log(`Status do envio ${shipmentId} alterado para: ${newStatus}`);
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar o status. Tente novamente.');
      }
    }
  };

  if (loading) {
    return (
      <div className="shipping-table-container">
        <h2 className="shipping-table-title">Tabela de Envios</h2>
        <div className="shipping-table-empty">
          Carregando envios...
        </div>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="shipping-table-container">
        <h2 className="shipping-table-title">Tabela de Envios</h2>
        <div className="shipping-table-empty">
          Nenhum envio encontrado. Que tal criar o primeiro?
        </div>
      </div>
    );
  }

  return (
    <DropdownProvider>
      <div className="shipping-table-container">
        <h2 className="shipping-table-title">Tabela de Envios</h2>
        <div className="table-wrapper">
          <table className="shipping-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Operador</th>
                <th>POL</th>
                <th>POD</th>
                <th>ETD Origem</th>
                <th>ETA Destino</th>
                <th>Quant Box</th>
                <th>Status</th>
                <th>N° BL</th>
                <th>Armador</th>
                <th>Booking</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td>{shipment.cliente}</td>
                  <td>{shipment.operador}</td>
                  <td>{shipment.pol}</td>
                  <td>{shipment.pod}</td>
                  <td>{shipment.etdOrigem}</td>
                  <td>{shipment.etaDestino}</td>
                  <td>{shipment.quantBox}</td>
                  <td>
                    <StatusSelector
                      currentStatus={shipment.status}
                      onStatusChange={(newStatus) => {
                        if (shipment.id) {
                          return handleStatusChange(shipment.id, newStatus);
                        }
                      }}
                      instanceId={`shipment-${shipment.id}`}
                    />
                  </td>
                  <td>{shipment.numeroBl}</td>
                  <td>{shipment.armador}</td>
                  <td>{shipment.booking}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DropdownProvider>
  );
};

export default ShippingTable;
export type { Shipment };
