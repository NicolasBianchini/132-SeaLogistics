"use client";

import { saveAs } from "file-saver";
import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { Check, Edit, FileText } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/auth-context";
import { useShipments, type Shipment } from "../../context/shipments-context";
import { db } from "../../lib/firebaseConfig";
import { sendEmail } from "../../services/emailService";
import EditShipmentModal from "../edit-shipment-modal/edit-shipment-modal";
import { DropdownProvider } from "./dropdown-context";
import ShippingFilters, { type FilterOptions } from "./shipping-filters";
import "./shipping-table.css";
import StatusSelector from "./status-selector";

interface ShippingTableProps {
  shipments?: Shipment[];
  onShipmentUpdate?: (shipment: Shipment) => void;
  initialFilters?: {
    status?: string;
    filter?: string;
  };
}

const ShippingTable = ({
  shipments: propShipments,
  onShipmentUpdate,
  initialFilters,
}: ShippingTableProps) => {
  const {
    shipments: contextShipments,
    updateShipment,
    loading,
  } = useShipments();
  const { isAdmin, currentUser } = useAuth();

  const shipments = propShipments || contextShipments;

  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: "",
    dateTo: "",
    month: "",
    sortBy: "recent",
    sortOrder: "desc",
    searchTerm: "",
  });

  // Aplicar filtros iniciais quando o componente carregar
  useEffect(() => {
    if (initialFilters) {
      let newFilters = { ...filters };

      // Aplicar filtro de status
      if (initialFilters.status) {
        // O filtro de status será aplicado na lógica de filtragem
      }

      // Aplicar filtro especial
      if (initialFilters.filter === 'this-month') {
        const currentMonth = new Date().getMonth() + 1;
        newFilters.month = currentMonth.toString();
      }

      setFilters(newFilters);
    }
  }, [initialFilters]);

  const filteredAndSortedShipments = useMemo(() => {
    let filtered = [...shipments];

    // Aplicar filtro de status inicial
    if (initialFilters?.status) {
      filtered = filtered.filter((shipment) => {
        return shipment.status === initialFilters.status;
      });
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((shipment) => {
        const commonFields = [
          shipment.numeroBl?.toLowerCase().includes(searchTerm),
          shipment.booking?.toLowerCase().includes(searchTerm),
          shipment.armador?.toLowerCase().includes(searchTerm),
        ];

        const adminFields = isAdmin()
          ? [
            shipment.cliente?.toLowerCase().includes(searchTerm),
            shipment.operador?.toLowerCase().includes(searchTerm),
          ]
          : [];

        return [...commonFields, ...adminFields].some((match) => match);
      });
    }

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

        return false;
      });
    }

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

    console.log("Enviando informações para o cliente:", shipment);
    alert(`Funcionalidade em desenvolvimento. Envio: ${shipment.numeroBl}`);
  };

  const handleEditShipment = (shipment: Shipment) => {
    if (!canEditShipment(shipment)) {
      alert("Você não tem permissão para editar este envio.");
      return;
    }

    setEditingShipment(shipment);
    setShowEditModal(true);
  };

  const handleSaveShipment = async (updatedShipment: Shipment) => {
    try {
      await updateShipment(updatedShipment);

      if (onShipmentUpdate) {
        onShipmentUpdate(updatedShipment);
      }

      console.log("Envio atualizado com sucesso:", updatedShipment);
    } catch (error) {
      console.error("Erro ao salvar envio:", error);
      throw error;
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingShipment(null);
  };

  const canEditShipment = (shipment: Shipment): boolean => {
    if (!currentUser) return false;

    if (isAdmin()) return true;

    if (currentUser.role === "company_user") {
      return shipment.companyId === currentUser.companyId;
    }

    return false;
  };

  const handleStatusChange = async (shipmentId: string, newStatus: string) => {
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

  const exportToPDF = (shipment: Shipment) => {
    const doc = new jsPDF();

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

    const tableRow = [
      [
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
      ],
    ];

    autoTable(doc, {
      head: [tableColumn],
      body: tableRow,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.text("Informações do Envio", 14, 15);
    doc.save(`envio-${shipment.numeroBl || "sem-bl"}.pdf`);
  };

  const sendShipmentEmail = async (shipment: Shipment) => {
    if (!shipment.companyId) {
      console.warn("Shipment sem companyId, não é possível enviar email.");
      return;
    }

    try {
      const companyDoc = await getDoc(doc(db, "companies", shipment.companyId));
      if (!companyDoc.exists()) {
        console.warn("Empresa não encontrada no Firestore");
        return;
      }

      const companyData = companyDoc.data();
      if (!companyData.contactEmail) {
        console.warn("Empresa não tem email de contato cadastrado");
        return;
      }

      await sendEmail({
        to: companyData.contactEmail,
        subject: `Informações do envio - ${shipment.numeroBl}`,
        html: `
        <h2>Informações do envio</h2>
        <ul>
          <li><strong>Número BL:</strong> ${shipment.numeroBl}</li>
          <li><strong>Cliente:</strong> ${shipment.cliente}</li>
          <li><strong>Operador:</strong> ${shipment.operador}</li>
          <li><strong>Porto de Origem:</strong> ${shipment.pol}</li>
          <li><strong>Porto de Destino:</strong> ${shipment.pod}</li>
          <li><strong>ETD Origem:</strong> ${shipment.etdOrigem}</li>
          <li><strong>ETA Destino:</strong> ${shipment.etaDestino}</li>
          <li><strong>Localização Atual:</strong> ${shipment.currentLocation
          }</li>
          <li><strong>Quantidade de Containers:</strong> ${shipment.quantBox
          }</li>
          <li><strong>Status:</strong> ${shipment.status}</li>
          <li><strong>Armador:</strong> ${shipment.armador}</li>
          <li><strong>Booking:</strong> ${shipment.booking}</li>
          <li><strong>Observações:</strong> ${shipment.observacoes || "-"}</li>
        </ul>
      `,
      });

      console.log(
        "✅ Email enviado com sucesso para:",
        companyData.contactEmail
      );
    } catch (error) {
      console.error("Erro ao enviar email manual:", error);
    }
  };

  const exportToExcel = (shipment: Shipment) => {
    const worksheetData = [
      {
        Cliente: shipment.cliente,
        Shipper: shipment.shipper,
        POL: shipment.pol,
        POD: shipment.pod,
        "ETD Origem": formatDate(shipment.etdOrigem),
        "ETA Destino": formatDate(shipment.etaDestino),
        "Quant Box": shipment.quantBox,
        Status: shipment.status,
        "N° BL": shipment.numeroBl,
        Armador: shipment.armador,
        Booking: shipment.booking,
        Invoice: shipment.invoice,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Envio");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(fileData, `envio-${shipment.numeroBl || "sem-bl"}.xlsx`);
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
                          className="action-icon edit-icon"
                          onClick={() => handleEditShipment(shipment)}
                          title="Editar envio"
                          disabled={!canEditShipment(shipment)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-icon"
                          onClick={() => exportToExcel(shipment)}
                          title="Exportar para Excel"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          className="action-icon check-icon"
                          onClick={async () => {
                            try {
                              //    await exportToPDF(shipment);
                              await sendShipmentEmail(shipment);
                            } catch (err) {
                              console.error(
                                "Erro ao exportar ou enviar email:",
                                err
                              );
                            }
                          }}
                          title="Enviar informações para o cliente"
                          disabled={!isAdmin()}
                        >
                          <Check size={16} />
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

        {showEditModal && editingShipment && (
          <EditShipmentModal
            shipment={editingShipment}
            onClose={handleCloseEditModal}
            onSave={handleSaveShipment}
            canEdit={canEditShipment(editingShipment)}
          />
        )}
      </div>
    </DropdownProvider>
  );
};

export default ShippingTable;
export type { Shipment };
