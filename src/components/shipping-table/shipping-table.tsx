"use client";

import { useState } from "react";
import "./shipping-table.css";

const ShippingTable = () => {
  const [shipments, setShipments] = useState([
    {
      id: 1,
      cliente: "Empresa ABC",
      operador: "João Silva",
      pol: "Santos, Brasil",
      pod: "Rotterdam, Holanda",
      etdOrigem: "2023-10-15",
      etaDestino: "2023-11-05",
      quantBox: 12,
      status: "Em trânsito",
      numeroBl: "BL123456789",
      armador: "MSC",
      booking: "BK987654321",
    },
    {
      id: 2,
      cliente: "Indústria XYZ",
      operador: "Maria Oliveira",
      pol: "Itajaí, Brasil",
      pod: "Xangai, China",
      etdOrigem: "2023-10-20",
      etaDestino: "2023-12-10",
      quantBox: 8,
      status: "Agendado",
      numeroBl: "BL987654321",
      armador: "Maersk",
      booking: "BK123456789",
    },
    {
      id: 3,
      cliente: "Comércio Global",
      operador: "Carlos Mendes",
      pol: "Paranaguá, Brasil",
      pod: "Singapura",
      etdOrigem: "2023-11-05",
      etaDestino: "2023-12-15",
      quantBox: 24,
      status: "Documentação",
      numeroBl: "BL456789123",
      armador: "CMA CGM",
      booking: "BK789123456",
    },
    {
      id: 4,
      cliente: "Exportadora Sul",
      operador: "Ana Pereira",
      pol: "Rio Grande, Brasil",
      pod: "Barcelona, Espanha",
      etdOrigem: "2023-11-10",
      etaDestino: "2023-12-05",
      quantBox: 16,
      status: "Concluído",
      numeroBl: "BL789123456",
      armador: "Hapag-Lloyd",
      booking: "BK456789123",
    },
  ]);

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  return (
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
                <td>{formatDate(shipment.etdOrigem)}</td>
                <td>{formatDate(shipment.etaDestino)}</td>
                <td>{shipment.quantBox}</td>
                <td>
                  <span
                    className={`status-badge status-${shipment.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {shipment.status}
                  </span>
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
  );
};

export default ShippingTable;
