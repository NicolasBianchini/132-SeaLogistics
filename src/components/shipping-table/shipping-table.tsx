"use client";

import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Check, Edit, Eye, FileText, FolderOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { useLanguage } from "../../context/language-context";
import { useShipments, type Shipment } from "../../context/shipments-context";
import { db } from "../../lib/firebaseConfig";
import { sendEmail } from "../../services/emailService";
import { DocumentManager } from "../document-manager";
import { DocumentViewer } from "../document-viewer";
import EditShipmentModal from "../edit-shipment-modal/edit-shipment-modal";
import { DropdownProvider } from "./dropdown-context";
import ShippingFilters, { type FilterOptions } from "./shipping-filters";
import "./shipping-table.css";

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
  const { isAdmin } = useAuth();
  const { translations } = useLanguage();

  const shipments = propShipments || contextShipments;

  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedShipmentForDocs, setSelectedShipmentForDocs] =
    useState<Shipment | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedShipmentForViewer, setSelectedShipmentForViewer] =
    useState<Shipment | null>(null);

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
      if (initialFilters.filter === "this-month") {
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
      filtered = filtered.filter(
        (shipment) => shipment.status === initialFilters.status
      );
    }

    // Aplicar filtro de mês
    if (filters.month) {
      filtered = filtered.filter((shipment) => {
        if (shipment.etdOrigem) {
          const shipmentMonth = new Date(shipment.etdOrigem).getMonth() + 1;
          return shipmentMonth.toString() === filters.month;
        }
        return false;
      });
    }

    // Aplicar filtro de data
    if (filters.dateFrom) {
      filtered = filtered.filter((shipment) => {
        if (shipment.etdOrigem) {
          const shipmentDate = new Date(shipment.etdOrigem);
          const filterDate = new Date(filters.dateFrom);
          return shipmentDate >= filterDate;
        }
        return false;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter((shipment) => {
        if (shipment.etdOrigem) {
          const shipmentDate = new Date(shipment.etdOrigem);
          const filterDate = new Date(filters.dateTo);
          return shipmentDate <= filterDate;
        }
        return false;
      });
    }

    // Aplicar filtro de busca
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (shipment) =>
          shipment.cliente?.toLowerCase().includes(searchLower) ||
          shipment.numeroBl?.toLowerCase().includes(searchLower) ||
          shipment.booking?.toLowerCase().includes(searchLower) ||
          shipment.pol?.toLowerCase().includes(searchLower) ||
          shipment.pod?.toLowerCase().includes(searchLower) ||
          shipment.armador?.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "recent":
        case "old":
          aValue = new Date(a.etdOrigem || 0);
          bValue = new Date(b.etdOrigem || 0);
          break;
        case "client":
          aValue = a.cliente || "";
          bValue = b.cliente || "";
          break;
        case "etd":
          aValue = new Date(a.etdOrigem || 0);
          bValue = new Date(b.etdOrigem || 0);
          break;
        case "eta":
          aValue = new Date(a.etaDestino || 0);
          bValue = new Date(b.etaDestino || 0);
          break;
        default:
          aValue = new Date(a.etdOrigem || 0);
          bValue = new Date(b.etdOrigem || 0);
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [shipments, filters, initialFilters]);

  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setEditingShipment(null);
    setShowEditModal(false);
  };

  const handleSaveShipment = async (updatedShipment: Shipment) => {
    try {
      await updateShipment(updatedShipment);
      if (onShipmentUpdate) {
        onShipmentUpdate(updatedShipment);
      }
      handleCloseEditModal();
    } catch (error) {
      console.error("Erro ao salvar envio:", error);
    }
  };

  const canEditShipment = (shipment: Shipment) => {
    if (!isAdmin()) return false;
    if (shipment.status === "concluido") return false;
    return true;
  };

  // const exportToExcel = async (shipment: Shipment) => {
  //   try {
  //     console.log('🚀 Iniciando exportação individual para:', shipment.cliente, shipment.numeroBl);

  //     // Criar workbook
  //     const workbook = XLSX.utils.book_new();

  //     // Dados do cabeçalho
  //     const currentDate = new Date().toLocaleDateString('pt-BR', {
  //       day: '2-digit',
  //       month: 'long',
  //       year: 'numeric'
  //     }).toUpperCase();

  //     // Configurar dados da planilha com formatação
  //     const sheetData = [
  //       // Linha 1: Nome da empresa (mesclar células)
  //       ['SEA LOGISTICS INTERNATIONAL', '', '', '', '', '', '', '', '', '', ''],
  //       // Linha 2: Título do documento
  //       [`FOLLOW UP (${shipment.cliente || 'NOME CLIENTE'}) - ${currentDate}`, '', '', '', '', '', '', '', '', '', ''],
  //       // Linha 3: Espaçamento
  //       ['', '', '', '', '', '', '', '', '', '', ''],
  //       // Linha 4: Cabeçalho da primeira tabela
  //       ['PROCESSO IM', 'CLIENTE', 'SHIPPER', 'OPERADOR', 'POL', 'POD', 'ETA', 'ETD', 'STATUS', 'INCOTERM', 'NAVIO'],
  //       // Linha 5: Dados da primeira tabela
  //       [
  //         shipment.numeroBl || 'N/A',
  //         shipment.cliente || 'N/A',
  //         shipment.shipper || 'N/A',
  //         shipment.operador || 'N/A',
  //         shipment.pol || 'N/A',
  //         shipment.pod || 'N/A',
  //         formatDate(shipment.etaDestino),
  //         formatDate(shipment.etdOrigem),
  //         shipment.status || 'N/A',
  //         'FOB',
  //         shipment.armador || 'N/A'
  //       ],
  //       // Linha 6: Espaçamento
  //       ['', '', '', '', '', '', '', '', '', '', ''],
  //       // Linha 7: Cabeçalho da segunda tabela
  //       ['BOOKING', 'NR DE CONTAINER', 'POSIÇÃO DO NAVIO', 'ARMADOR', 'QUANTIDADE', 'N° BL', 'FREE TIME', 'CE'],
  //       // Linha 8: Dados da segunda tabela
  //       [
  //         shipment.booking || 'N/A',
  //         'CAAU8164329',
  //         'O navio porta-contêineres está atualmente localizado no Mar da China Oriental.',
  //         shipment.armador || 'N/A',
  //         `${shipment.quantBox || 1}X40HC`,
  //         shipment.numeroBl || 'N/A',
  //         '21 DIAS',
  //         'A INFORMAR'
  //       ]
  //     ];

  //     // Criar planilha a partir dos dados
  //     const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  //     // Configurar largura das colunas
  //     const colWidths = [
  //       { wch: 18 }, // A - PROCESSO IM
  //       { wch: 15 }, // B - CLIENTE
  //       { wch: 18 }, // C - SHIPPER
  //       { wch: 18 }, // D - OPERADOR
  //       { wch: 12 }, // E - POL
  //       { wch: 12 }, // F - POD
  //       { wch: 12 }, // G - ETA
  //       { wch: 12 }, // H - ETD
  //       { wch: 15 }, // I - STATUS
  //       { wch: 12 }, // J - INCOTERM
  //       { wch: 18 }  // K - NAVIO
  //     ];
  //     worksheet['!cols'] = colWidths;

  //     // Configurar altura das linhas
  //     const rowHeights = [
  //       { hpt: 30 }, // Linha 1 - Nome da empresa
  //       { hpt: 25 }, // Linha 2 - Título
  //       { hpt: 15 }, // Linha 3 - Espaçamento
  //       { hpt: 25 }, // Linha 4 - Cabeçalho 1
  //       { hpt: 25 }, // Linha 5 - Dados 1
  //       { hpt: 15 }, // Linha 6 - Espaçamento
  //       { hpt: 25 }, // Linha 7 - Cabeçalho 2
  //       { hpt: 40 }  // Linha 8 - Dados 2 (mais alta para posição do navio)
  //     ];
  //     worksheet['!rows'] = rowHeights;

  //     // Configurar mesclagem de células para o cabeçalho
  //     worksheet['!merges'] = [
  //       { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Nome da empresa - linha inteira
  //       { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Título - linha inteira
  //     ];

  //     // Adicionar planilha ao workbook
  //     XLSX.utils.book_append_sheet(workbook, worksheet, "Follow Up");

  //     // Gerar arquivo Excel
  //     const excelBuffer = XLSX.write(workbook, {
  //       bookType: "xlsx",
  //       type: "array",
  //     });

  //     const fileData = new Blob([excelBuffer], {
  //       type: "application/octet-stream",
  //     });

  //     // Nome do arquivo baseado no número BL ou cliente
  //     const fileName = shipment.numeroBl
  //       ? `follow-up-${shipment.cliente}-${shipment.numeroBl}.xlsx`
  //       : `follow-up-${shipment.cliente}-${new Date().toISOString().split('T')[0]}.xlsx`;

  //     console.log('📁 Nome do arquivo gerado:', fileName);
  //     console.log('💾 Iniciando download do arquivo...');

  //     saveAs(fileData, fileName);

  //     console.log('✅ Exportação individual concluída com sucesso!');
  //   } catch (error) {
  //     console.error('❌ Erro ao exportar para Excel:', error);
  //     alert('Erro ao exportar para Excel. Tente novamente.');
  //   }
  // };

  const exportToPDF = async (shipment: Shipment) => {
    try {
      console.log(
        "🚀 Iniciando exportação PDF para:",
        shipment.cliente,
        shipment.numeroBl
      );

      const doc = new jsPDF();

      // Título
      doc.setFontSize(16);
      doc.text(`FOLLOW UP - ${shipment.cliente || "NOME CLIENTE"}`, 14, 15);

      // Data
      doc.setFontSize(12);
      const currentDate = new Date()
        .toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
        .toUpperCase();
      doc.text(`Data: ${currentDate}`, 14, 25);

      // Informações do envio
      doc.setFontSize(10);
      let yPosition = 40;

      const shipmentInfo = [
        ["PROCESSO IM:", shipment.numeroBl || "N/A"],
        ["CLIENTE:", shipment.cliente || "N/A"],
        ["SHIPPER:", shipment.shipper || "N/A"],
        ["OPERADOR:", shipment.operador || "N/A"],
        ["POL:", shipment.pol || "N/A"],
        ["POD:", shipment.pod || "N/A"],
        ["ETA:", formatDate(shipment.etaDestino)],
        ["ETD:", formatDate(shipment.etdOrigem)],
        ["STATUS:", shipment.status || "N/A"],
        ["ARMADOR:", shipment.armador || "N/A"],
        ["BOOKING:", shipment.booking || "N/A"],
        ["QUANTIDADE:", `${shipment.quantBox || 1}X40HC`],
        ["N° BL:", shipment.numeroBl || "N/A"],
      ];

      shipmentInfo.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.text(label, 14, yPosition);
        doc.setFontSize(10);
        doc.text(value, 60, yPosition);
        yPosition += 8;
      });

      doc.save(`follow-up-${shipment.cliente}-${shipment.numeroBl}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error);
    }
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
          <li><strong>Localização Atual:</strong> ${
            shipment.currentLocation
          }</li>
          <li><strong>Quantidade de Containers:</strong> ${
            shipment.quantBox
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

  const handleManageDocuments = (shipment: Shipment) => {
    setSelectedShipmentForDocs(shipment);
    setShowDocumentsModal(true);
  };

  const handleCloseDocumentViewer = () => {
    setShowDocumentViewer(false);
    setSelectedShipmentForViewer(null);
  };

  if (loading) {
    return (
      <div className="shipping-table-container">
        <h2 className="shipping-table-title">{translations.shippingTable}</h2>
        <div className="shipping-table-empty">{translations.loading}</div>
      </div>
    );
  }

  return (
    <DropdownProvider>
      <div className="shipping-table-container">
        <div className="shipping-table-header">
          <h2 className="shipping-table-title">{translations.shippingTable}</h2>
        </div>

        <ShippingFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {filteredAndSortedShipments.length === 0 ? (
          <div className="shipping-table-empty">
            {shipments.length === 0
              ? translations.noShipments
              : translations.noShipments}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="shipping-table">
              <thead>
                <tr>
                  <th>{translations.client}</th>
                  <th>{translations.type}</th>
                  <th>{translations.shipper}</th>
                  <th>{translations.pol}</th>
                  <th>{translations.pod}</th>
                  <th>{translations.etdOrigin}</th>
                  <th>{translations.etaDestination}</th>
                  <th>{translations.quantBox}</th>
                  <th>{translations.blNumber}</th>
                  <th>{translations.carrier}</th>
                  <th>{translations.booking}</th>

                  <th>{translations.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedShipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>{shipment.cliente}</td>
                    <td>
                      <span
                        className={`tipo-badge tipo-${
                          shipment.tipo?.toLowerCase() || "nao-especificado"
                        }`}
                      >
                        {shipment.tipo || "N/A"}
                      </span>
                    </td>
                    <td>{shipment.shipper}</td>
                    <td>{shipment.pol}</td>
                    <td>{shipment.pod}</td>
                    <td>{formatDate(shipment.etdOrigem)}</td>
                    <td>{formatDate(shipment.etaDestino)}</td>
                    <td>{shipment.quantBox}</td>
                    <td>{shipment.numeroBl}</td>
                    <td>{shipment.armador}</td>
                    <td>{shipment.booking}</td>
                    <td>{shipment.invoice}</td>
                    <td>
                      <div className="action-icons">
                        {isAdmin() && (
                          <>
                            <button
                              className="action-icon edit-icon"
                              onClick={() => handleEditShipment(shipment)}
                              title={translations.edit}
                              disabled={!canEditShipment(shipment)}
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              className="action-icon documents-icon"
                              onClick={() => handleManageDocuments(shipment)}
                              title={translations.manageDocuments}
                            >
                              <FolderOpen size={20} />
                            </button>
                            <button
                              className="action-icon check-icon"
                              onClick={async () => {
                                try {
                                  await sendShipmentEmail(shipment);
                                } catch (err) {
                                  console.error(
                                    "Erro ao exportar ou enviar email:",
                                    err
                                  );
                                }
                              }}
                              title="Enviar informações para o cliente"
                            >
                              <Check size={20} />
                            </button>
                          </>
                        )}

                        {!isAdmin() && (
                          <button
                            className="action-icon view-documents-icon"
                            onClick={() => {
                              setSelectedShipmentForViewer(shipment);
                              setShowDocumentViewer(true);
                            }}
                            title={translations.viewDocuments}
                          >
                            <Eye size={20} />
                          </button>
                        )}

                        <button
                          className="action-icon export-icon"
                          onClick={() => exportToPDF(shipment)}
                          title="Exportar para PDF"
                        >
                          <FileText size={20} />
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

        {showDocumentsModal && selectedShipmentForDocs && (
          <DocumentManager
            shipmentId={selectedShipmentForDocs.id || ""}
            shipmentNumber={selectedShipmentForDocs.numeroBl}
            clientName={selectedShipmentForDocs.cliente}
            isOpen={showDocumentsModal}
            onClose={() => setShowDocumentsModal(false)}
            onDocumentsUpdate={() => {
              // Recarregar dados se necessário
              console.log("Documentos atualizados");
            }}
          />
        )}

        {showDocumentViewer && selectedShipmentForViewer && (
          <DocumentViewer
            shipmentId={selectedShipmentForViewer.id || ""}
            isOpen={showDocumentViewer}
            onClose={handleCloseDocumentViewer}
          />
        )}
      </div>
    </DropdownProvider>
  );
};

export default ShippingTable;
export type { Shipment };
