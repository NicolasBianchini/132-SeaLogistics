"use client";

import jsPDF from "jspdf";
import "jspdf-autotable";
import { Check, Edit } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { useShipments, type Shipment } from "../../context/shipments-context";
import { DropdownProvider } from "./dropdown-context";
import ShippingFilters, { type FilterOptions } from "./shipping-filters";
import "./shipping-table.css";
import StatusSelector from "./status-selector";

interface ShippingTableProps {
  shipments?: Shipment[];
  onShipmentUpdate?: (shipment: Shipment) => void;
}

const ShippingTable = ({
  shipments: propShipments,
  onShipmentUpdate,
}: ShippingTableProps) => {
  const {
    shipments: contextShipments,
    updateShipment,
    loading,
  } = useShipments();
  const { isAdmin, currentUser } = useAuth();

  // Use shipments from props if provided, otherwise use context
  const shipments = propShipments || contextShipments;

  // Função para formatar data no padrão brasileiro
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Estado dos filtros
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: "",
    dateTo: "",
    month: "",
    sortBy: "recent",
    sortOrder: "desc",
    searchTerm: "",
  });

  // Função para filtrar e ordenar os shipments
  const filteredAndSortedShipments = useMemo(() => {
    let filtered = [...shipments];

    // Filtro por termo de busca
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((shipment) => {
        // Campos que todos podem buscar
        const commonFields = [
          shipment.numeroBl?.toLowerCase().includes(searchTerm),
          shipment.booking?.toLowerCase().includes(searchTerm),
          shipment.armador?.toLowerCase().includes(searchTerm),
        ];

        // Campos adicionais apenas para admins
        const adminFields = isAdmin()
          ? [
              shipment.cliente?.toLowerCase().includes(searchTerm),
              shipment.operador?.toLowerCase().includes(searchTerm),
            ]
          : [];

        return [...commonFields, ...adminFields].some((match) => match);
      });
    }

    // Filtro por mês (baseado na data de origem - ETD)
    if (filters.month) {
      filtered = filtered.filter((shipment) => {
        const etdDate = shipment.etdOrigem
          ? new Date(shipment.etdOrigem)
          : null;
        const targetMonth = Number.parseInt(filters.month);

        if (etdDate && !isNaN(etdDate.getTime())) {
          const etdMonth = etdDate.getMonth() + 1;
          return etdMonth === targetMonth;
        }

        return false; // Se não tem ETD, não inclui no filtro
      });
    }

    // Filtro por intervalo de datas
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter((shipment) => {
        const etdDate = shipment.etdOrigem
          ? new Date(shipment.etdOrigem)
          : null;
        const etaDate = shipment.etaDestino
          ? new Date(shipment.etaDestino)
          : null;
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        let matchesDate = false;

        if (etdDate) {
          if (fromDate && toDate) {
            matchesDate = etdDate >= fromDate && etdDate <= toDate;
          } else if (fromDate) {
            matchesDate = etdDate >= fromDate;
          } else if (toDate) {
            matchesDate = etdDate <= toDate;
          }
        }

        if (!matchesDate && etaDate) {
          if (fromDate && toDate) {
            matchesDate = etaDate >= fromDate && etaDate <= toDate;
          } else if (fromDate) {
            matchesDate = etaDate >= fromDate;
          } else if (toDate) {
            matchesDate = etaDate <= toDate;
          }
        }

        return matchesDate || (!filters.dateFrom && !filters.dateTo);
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "recent":
        case "old": {
          const aDate = a.createdAt
            ? new Date(a.createdAt.toString())
            : new Date(0);
          const bDate = b.createdAt
            ? new Date(b.createdAt.toString())
            : new Date(0);
          comparison = aDate.getTime() - bDate.getTime();
          if (filters.sortBy === "recent") comparison = -comparison;
          break;
        }

        case "etd": {
          const aETD = a.etdOrigem ? new Date(a.etdOrigem) : new Date(0);
          const bETD = b.etdOrigem ? new Date(b.etdOrigem) : new Date(0);
          comparison = aETD.getTime() - bETD.getTime();
          break;
        }

        case "eta": {
          const aETA = a.etaDestino ? new Date(a.etaDestino) : new Date(0);
          const bETA = b.etaDestino ? new Date(b.etaDestino) : new Date(0);
          comparison = aETA.getTime() - bETA.getTime();
          break;
        }

        case "client": {
          comparison = (a.cliente || "").localeCompare(b.cliente || "");
          break;
        }

        default:
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [shipments, filters]);

  const handleSendToClient = (shipment: Shipment) => {
    if (!isAdmin()) {
      alert("Apenas administradores podem enviar informações para clientes.");
      return;
    }

    // TODO: Implementar envio de informações para o cliente
    console.log("Enviando informações para o cliente:", shipment);
    alert(`Funcionalidade em desenvolvimento. Envio: ${shipment.numeroBl}`);
  };

  const handleEditShipment = (shipment: Shipment) => {
    if (!canEditShipment(shipment)) {
      alert("Você não tem permissão para editar este envio.");
      return;
    }

    // TODO: Implementar edição de envio
    console.log("Editando envio:", shipment);
    alert(
      `Funcionalidade em desenvolvimento. Editar envio: ${shipment.numeroBl}`
    );
  };

  const canEditShipment = (shipment: Shipment): boolean => {
    if (!currentUser) return false;

    // Admin pode editar qualquer shipment
    if (isAdmin()) return true;

    // Usuário de empresa só pode editar shipments da própria empresa
    if (currentUser.role === "company_user") {
      return shipment.companyId === currentUser.companyId;
    }

    return false;
  };

  const handleStatusChange = async (shipmentId: string, newStatus: string) => {
    // Verificar permissões antes de atualizar
    if (!isAdmin()) {
      alert(
        "Acesso negado. Apenas administradores podem alterar o status dos envios."
      );
      return;
    }

    const updatedShipment = shipments.find((s) => s.id === shipmentId);
    if (updatedShipment) {
      try {
        const updated = { ...updatedShipment, status: newStatus };
        await updateShipment(updated);

        if (onShipmentUpdate) {
          onShipmentUpdate(updated);
        }

        console.log(
          `Status do envio ${shipmentId} alterado para: ${newStatus}`
        );
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao atualizar o status. Tente novamente.");
      }
    }
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      month: "",
      sortBy: "recent",
      sortOrder: "desc",
      searchTerm: "",
    });
  };

  if (loading) {
    return (
      <div className="shipping-table-container">
        <h2 className="shipping-table-title">Tabela de Envios</h2>
        <div className="shipping-table-empty">Carregando envios...</div>
      </div>
    );
  }

  const exportToPDF = () => {
    const doc = new (jsPDF as any)();

    const tableColumn = [
      "Cliente",
      "Shipper",
      "POL",
      "POD",
      "ETD Origem",
      "ETA Destino",
      "Quant Box",
      "Status",
      "N° BL",
      "Armador",
      "Booking",
      "Invoice",
    ];

    const tableRows = filteredAndSortedShipments.map((shipment) => [
      shipment.cliente,
      shipment.shipper,
      shipment.pol,
      shipment.pod,
      formatDate(shipment.etdOrigem),
      formatDate(shipment.etaDestino),
      shipment.quantBox,
      shipment.status,
      shipment.numeroBl,
      shipment.armador,
      shipment.booking,
      shipment.invoice,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.text("Relatório de Envios", 14, 15);
    doc.save("relatorio-envios.pdf");
  };

  return (
    <DropdownProvider>
      <div className="shipping-table-container">
        <h2 className="shipping-table-title">Tabela de Envios</h2>

        <ShippingFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {filteredAndSortedShipments.length === 0 ? (
          <div className="shipping-table-empty">
            {shipments.length === 0
              ? "Nenhum envio encontrado. Que tal criar o primeiro?"
              : "Nenhum envio encontrado com os filtros aplicados."}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="shipping-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Shipper</th>
                  <th>POL</th>
                  <th>POD</th>
                  <th>ETD Origem</th>
                  <th>ETA Destino</th>
                  <th>Quant Box</th>
                  <th>Status</th>
                  <th>N° BL</th>
                  <th>Armador</th>
                  <th>Booking</th>
                  <th>Invoice</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedShipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>{shipment.cliente}</td>
                    <td>{shipment.shipper}</td>
                    <td>{shipment.pol}</td>
                    <td>{shipment.pod}</td>
                    <td>{formatDate(shipment.etdOrigem)}</td>
                    <td>{formatDate(shipment.etaDestino)}</td>
                    <td>{shipment.quantBox}</td>
                    <td>
                      <div
                        title={
                          !isAdmin()
                            ? "Apenas administradores podem alterar o status"
                            : undefined
                        }
                      >
                        <StatusSelector
                          currentStatus={shipment.status}
                          onStatusChange={(newStatus) => {
                            if (shipment.id && isAdmin()) {
                              return handleStatusChange(shipment.id, newStatus);
                            }
                          }}
                          instanceId={`shipment-${shipment.id}`}
                          disabled={!isAdmin()}
                        />
                      </div>
                    </td>
                    <td>{shipment.numeroBl}</td>
                    <td>{shipment.armador}</td>
                    <td>{shipment.booking}</td>
                    <td>{shipment.invoice}</td>
                    <td>
                      <div className="action-icons">
                        <button
                          className="action-icon check-icon"
                          onClick={exportToPDF}
                          title="Enviar informações para o cliente"
                          disabled={!isAdmin()}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="action-icon edit-icon"
                          onClick={() => handleEditShipment(shipment)}
                          title="Editar envio"
                          disabled={!canEditShipment(shipment)}
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredAndSortedShipments.length > 0 && (
          <div className="table-summary">
            Mostrando {filteredAndSortedShipments.length} de {shipments.length}{" "}
            envios
          </div>
        )}
      </div>
    </DropdownProvider>
  );
};

export default ShippingTable;
export type { Shipment };
