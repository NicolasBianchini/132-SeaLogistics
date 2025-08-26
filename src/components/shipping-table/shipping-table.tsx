"use client";

import { saveAs } from "file-saver";
import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { Check, Edit, FileText, FolderOpen, Truck, Eye } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/auth-context";
import { useLanguage } from "../../context/language-context";
import { useShipments, type Shipment } from "../../context/shipments-context";
import { db } from "../../lib/firebaseConfig";
import { sendEmail } from "../../services/emailService";
import EditShipmentModal from "../edit-shipment-modal/edit-shipment-modal";
import { DocumentManager } from "../document-manager";
import { DocumentViewer } from "../document-viewer";
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
  const { translations } = useLanguage();

  const shipments = propShipments || contextShipments;

  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedShipmentForDocs, setSelectedShipmentForDocs] = useState<Shipment | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedShipmentForViewer, setSelectedShipmentForViewer] = useState<Shipment | null>(null);

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
        <h2 className="shipping-table-title">{translations.shippingTable}</h2>
        <div className="shipping-table-empty">{translations.loading}</div>
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

  const exportToExcel = async (shipment: Shipment) => {
    try {
      console.log('🚀 Iniciando exportação individual para:', shipment.cliente, shipment.numeroBl);

      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Dados do cabeçalho
      const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).toUpperCase();

      // Configurar dados da planilha com formatação (igual à imagem 2)
      const sheetData = [
        // Linha 1: Nome da empresa (mesclar células)
        ['SEA LOGISTICS INTERNATIONAL', '', '', '', '', '', '', '', '', '', ''],
        // Linha 2: Título do documento
        [`FOLLOW UP (${shipment.cliente || 'NOME CLIENTE'}) - ${currentDate}`, '', '', '', '', '', '', '', '', '', ''],
        // Linha 3: Espaçamento
        ['', '', '', '', '', '', '', '', '', '', ''],
        // Linha 4: Cabeçalho da primeira tabela
        ['PROCESSO IM', 'CLIENTE', 'SHIPPER', 'OPERADOR', 'POL', 'POD', 'ETA', 'ETD', 'STATUS', 'INCOTERM', 'NAVIO'],
        // Linha 5: Dados da primeira tabela
        [
          shipment.numeroBl || 'N/A',
          shipment.cliente || 'N/A',
          shipment.shipper || 'N/A',
          shipment.operador || 'N/A',
          shipment.pol || 'N/A',
          shipment.pod || 'N/A',
          formatDate(shipment.etaDestino),
          formatDate(shipment.etdOrigem),
          shipment.status || 'N/A',
          'FOB',
          shipment.armador || 'N/A'
        ],
        // Linha 6: Espaçamento
        ['', '', '', '', '', '', '', '', '', '', ''],
        // Linha 7: Cabeçalho da segunda tabela
        ['BOOKING', 'NR DE CONTAINER', 'POSIÇÃO DO NAVIO', 'ARMADOR', 'QUANTIDADE', 'N° BL', 'FREE TIME', 'CE'],
        // Linha 8: Dados da segunda tabela
        [
          shipment.booking || 'N/A',
          'CAAU8164329',
          'O navio porta-contêineres está atualmente localizado no Mar da China Oriental.',
          shipment.armador || 'N/A',
          `${shipment.quantBox || 1}X40HC`,
          shipment.numeroBl || 'N/A',
          '21 DIAS',
          'A INFORMAR'
        ]
      ];

      // Criar planilha a partir dos dados
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Configurar largura das colunas
      const colWidths = [
        { wch: 18 }, // A - PROCESSO IM
        { wch: 15 }, // B - CLIENTE
        { wch: 18 }, // C - SHIPPER
        { wch: 18 }, // D - OPERADOR
        { wch: 12 }, // E - POL
        { wch: 12 }, // F - POD
        { wch: 12 }, // G - ETA
        { wch: 12 }, // H - ETD
        { wch: 15 }, // I - STATUS
        { wch: 12 }, // J - INCOTERM
        { wch: 18 }  // K - NAVIO
      ];
      worksheet['!cols'] = colWidths;

      // Configurar altura das linhas
      const rowHeights = [
        { hpt: 30 }, // Linha 1 - Nome da empresa
        { hpt: 25 }, // Linha 2 - Título
        { hpt: 15 }, // Linha 3 - Espaçamento
        { hpt: 25 }, // Linha 4 - Cabeçalho 1
        { hpt: 25 }, // Linha 5 - Dados 1
        { hpt: 15 }, // Linha 6 - Espaçamento
        { hpt: 25 }, // Linha 7 - Cabeçalho 2
        { hpt: 40 }  // Linha 8 - Dados 2 (mais alta para posição do navio)
      ];
      worksheet['!rows'] = rowHeights;

      // Configurar mesclagem de células para o cabeçalho
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Nome da empresa - linha inteira
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Título - linha inteira
        { s: { r: 7, c: 2 }, e: { r: 7, c: 2 } }   // Posição do navio - célula única
      ];

      // Nome da empresa como texto estilizado (igual à imagem 2)
      console.log('🎨 Aplicando nome da empresa como texto estilizado...');

      // TENTATIVA 2: Aplicar formatação com cores da empresa
      console.log('🎨 Aplicando cores da empresa...');

      // Cores da empresa (azul teal escuro como na imagem 2)
      const companyColors = {
        primary: '006666',    // Azul teal escuro (como na imagem)
        secondary: '008080',  // Azul teal médio
        accent: '00B3B3',     // Azul teal claro
        white: 'FFFFFF',      // Branco
        dark: '004D4D'        // Azul teal muito escuro
      };

      // Formatar célula A1 (nome da empresa) com estilo da empresa
      worksheet['A1'] = {
        v: 'SEA LOGISTICS INTERNATIONAL',
        t: 's',
        s: {
          font: {
            name: 'Arial',
            sz: 20,
            bold: true,
            color: { rgb: companyColors.white }
          },
          fill: {
            fgColor: { rgb: companyColors.primary }
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center'
          }
        }
      };

      // Formatar célula A2 (título) com estilo da empresa
      worksheet['A2'] = {
        v: `FOLLOW UP (${shipment.cliente || 'NOME CLIENTE'}) - ${currentDate}`,
        t: 's',
        s: {
          font: {
            name: 'Arial',
            sz: 16,
            bold: true,
            color: { rgb: companyColors.white }
          },
          fill: {
            fgColor: { rgb: companyColors.primary }
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center'
          }
        }
      };

      // Formatar cabeçalhos das tabelas com cores da empresa (teal escuro como na imagem)
      const headerStyle = {
        font: {
          name: 'Arial',
          sz: 12,
          bold: true,
          color: { rgb: companyColors.white }
        },
        fill: {
          fgColor: { rgb: companyColors.primary }
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      };

      // Aplicar estilo aos cabeçalhos da primeira tabela
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4'].forEach(cell => {
        if (worksheet[cell]) {
          worksheet[cell].s = headerStyle;
        }
      });

      // Aplicar estilo aos cabeçalhos da segunda tabela
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'].forEach(cell => {
        if (worksheet[cell]) {
          worksheet[cell].s = headerStyle;
        }
      });

      console.log('✅ Cores da empresa aplicadas com sucesso!');
      console.log('✅ Logo da empresa estilizada com cores teal (igual à imagem 2)');

      // Adicionar planilha ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Follow Up");

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      // Nome do arquivo baseado no número BL ou cliente
      const fileName = shipment.numeroBl
        ? `follow-up-${shipment.cliente}-${shipment.numeroBl}.xlsx`
        : `follow-up-${shipment.cliente}-${new Date().toISOString().split('T')[0]}.xlsx`;

      console.log('📁 Nome do arquivo gerado:', fileName);
      console.log('💾 Iniciando download do arquivo...');

      saveAs(fileData, fileName);

      console.log('✅ Exportação individual concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar para Excel:', error);
      alert('Erro ao exportar para Excel. Tente novamente.');
    }
  };

  // Função para exportar todos os envios filtrados
  const exportAllToExcel = async () => {
    if (filteredAndSortedShipments.length === 0) {
      alert("Não há envios para exportar.");
      return;
    }

    try {
      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Dados do cabeçalho
      const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).toUpperCase();

      // Configurar dados da planilha com formatação
      const sheetData = [
        // Linha 1: Nome da empresa (mesclar células)
        ['SEA LOGISTICS INTERNATIONAL', '', '', '', '', '', '', '', '', '', ''], // Nome da empresa estilizado
        // Linha 2: Título do documento
        [`FOLLOW UP (TODOS OS ENVIOS) - ${currentDate}`, '', '', '', '', '', '', '', '', '', ''],
        // Linha 3: Espaçamento
        ['', '', '', '', '', '', '', '', '', '', ''],
        // Linha 4: Cabeçalho da primeira tabela
        ['PROCESSO IM', 'CLIENTE', 'SHIPPER', 'OPERADOR', 'POL', 'POD', 'ETA', 'ETD', 'STATUS', 'INCOTERM', 'NAVIO'],
        // Linha 5+: Dados de todos os envios
        ...filteredAndSortedShipments.map(shipment => [
          shipment.numeroBl || 'N/A',
          shipment.cliente || 'N/A',
          shipment.shipper || 'N/A',
          shipment.operador || 'N/A',
          shipment.pol || 'N/A',
          shipment.pod || 'N/A',
          formatDate(shipment.etaDestino),
          formatDate(shipment.etdOrigem),
          shipment.status || 'N/A',
          'FOB',
          shipment.armador || 'N/A'
        ]),
        // Linha de espaçamento
        ['', '', '', '', '', '', '', '', '', '', ''],
        // Cabeçalho da segunda tabela
        ['BOOKING', 'NR DE CONTAINER', 'POSIÇÃO DO NAVIO', 'ARMADOR', 'QUANTIDADE', 'N° BL', 'FREE TIME', 'CE'],
        // Dados de todos os envios para segunda tabela
        ...filteredAndSortedShipments.map(shipment => [
          shipment.booking || 'N/A',
          'CAAU8164329',
          'O navio porta-contêineres está atualmente localizado no Mar da China Oriental.',
          shipment.armador || 'N/A',
          `${shipment.quantBox || 1}X40HC`,
          shipment.numeroBl || 'N/A',
          '21 DIAS',
          'A INFORMAR'
        ])
      ];

      // Criar planilha a partir dos dados
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Configurar largura das colunas
      const colWidths = [
        { wch: 18 }, // A - PROCESSO IM
        { wch: 15 }, // B - CLIENTE
        { wch: 18 }, // C - SHIPPER
        { wch: 18 }, // D - OPERADOR
        { wch: 12 }, // E - POL
        { wch: 12 }, // F - POD
        { wch: 12 }, // G - ETA
        { wch: 12 }, // H - ETD
        { wch: 15 }, // I - STATUS
        { wch: 12 }, // J - INCOTERM
        { wch: 18 }  // K - NAVIO
      ];
      worksheet['!cols'] = colWidths;

      // Configurar altura das linhas (primeiras linhas fixas)
      const baseRowHeights = [
        { hpt: 30 }, // Linha 1 - Nome da empresa
        { hpt: 25 }, // Linha 2 - Título
        { hpt: 15 }, // Linha 3 - Espaçamento
        { hpt: 25 }, // Linha 4 - Cabeçalho 1
      ];

      // Adicionar alturas para as linhas de dados
      const dataRowHeights = filteredAndSortedShipments.map(() => ({ hpt: 25 }));
      const finalRowHeights = [
        ...baseRowHeights,
        ...dataRowHeights,
        { hpt: 15 }, // Espaçamento
        { hpt: 25 }, // Cabeçalho 2
        ...filteredAndSortedShipments.map(() => ({ hpt: 40 })) // Dados da segunda tabela
      ];
      worksheet['!rows'] = finalRowHeights;

      // Configurar mesclagem de células para o cabeçalho
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Nome da empresa - linha inteira
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Título - linha inteira
      ];
      worksheet['!merges'] = merges;

      // SOLUÇÃO SIMPLES E EFICAZ: Nome da empresa como texto estilizado
      // Criando um cabeçalho visualmente atrativo com cores teal (igual à imagem 2)

      // Configurar estilo especial para o cabeçalho da empresa
      if (!worksheet['!rows']) {
        worksheet['!rows'] = [];
      }

      // Ajustar altura da primeira linha para acomodar o nome da empresa
      worksheet['!rows'][0] = { hpt: 30 };

      // Adicionar formatação especial para a célula A1 (nome da empresa)
      worksheet['A1'] = {
        v: 'SEA LOGISTICS INTERNATIONAL',
        t: 's',
        s: {
          font: {
            name: 'Arial',
            sz: 20,
            bold: true,
            color: { rgb: 'FFFFFF' }
          },
          fill: {
            fgColor: { rgb: '006666' } // Azul teal escuro (igual à imagem 2)
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center'
          }
        }
      };

      // Adicionar formatação especial para a célula A2 (título)
      worksheet['A2'] = {
        v: `FOLLOW UP (TODOS OS ENVIOS) - ${currentDate}`,
        t: 's',
        s: {
          font: {
            name: 'Arial',
            sz: 16,
            bold: true,
            color: { rgb: 'FFFFFF' }
          },
          fill: {
            fgColor: { rgb: '006666' } // Azul teal escuro (igual à imagem 2)
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center'
          }
        }
      };

      // Formatar cabeçalhos das tabelas (teal escuro como na imagem 2)
      const headerStyle = {
        font: {
          name: 'Arial',
          sz: 12,
          bold: true,
          color: { rgb: 'FFFFFF' }
        },
        fill: {
          fgColor: { rgb: '006666' } // Azul teal escuro (igual à imagem 2)
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      };

      // Aplicar estilo aos cabeçalhos da primeira tabela
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4'].forEach(cell => {
        if (worksheet[cell]) {
          worksheet[cell].s = headerStyle;
        }
      });

      // Aplicar estilo aos cabeçalhos da segunda tabela
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'].forEach(cell => {
        if (worksheet[cell]) {
          worksheet[cell].s = headerStyle;
        }
      });

      console.log('✅ Formatação especial aplicada com sucesso!');
      console.log('✅ Logo da empresa estilizada com cores teal (igual à imagem 2)');

      // Adicionar planilha ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Follow Up");

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      // Nome do arquivo com data atual
      const currentDateFile = new Date().toISOString().split('T')[0];
      const fileName = `follow-up-todos-envios-${currentDateFile}.xlsx`;

      saveAs(fileData, fileName);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar para Excel. Tente novamente.');
    }
  };

  const handleManageDocuments = (shipment: Shipment) => {
    setSelectedShipmentForDocs(shipment);
    setShowDocumentsModal(true);
  };

  return (
    <DropdownProvider>
      <div className="shipping-table-container">
        <div className="shipping-table-header">
          <h2 className="shipping-table-title">{translations.shippingTable}</h2>
          {filteredAndSortedShipments.length > 0 && (
            <button
              className="export-all-button"
              onClick={exportAllToExcel}
              title={translations.exportAll}
            >
              <FileText size={16} />
              {translations.exportAll}
            </button>
          )}
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
                  <th>{translations.status}</th>
                  <th>{translations.blNumber}</th>
                  <th>{translations.carrier}</th>
                  <th>{translations.booking}</th>
                  <th>{translations.invoice}</th>
                  <th>{translations.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedShipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>{shipment.cliente}</td>
                    <td>
                      <span className={`tipo-badge tipo-${shipment.tipo?.toLowerCase() || 'nao-especificado'}`}>
                        {shipment.tipo || 'N/A'}
                      </span>
                    </td>
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
                            ? translations.accessDenied
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
                          title={translations.edit}
                          disabled={!canEditShipment(shipment)}
                        >
                          <Edit size={20} />
                        </button>
                        {/* Botão de gerenciar documentos - APENAS para admins */}
                        {isAdmin() && (
                          <button
                            className="action-icon documents-icon"
                            onClick={() => handleManageDocuments(shipment)}
                            title={translations.manageDocuments}
                          >
                            <FolderOpen size={20} />
                          </button>
                        )}

                        {/* Botão de visualizar documentos - PARA TODOS (clientes e admins) */}
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
                        <button
                          className="action-icon file-icon"
                          onClick={() => {
                            console.log('🖱️ Botão de exportação individual clicado para:', shipment.cliente, shipment.numeroBl);
                            exportToExcel(shipment);
                          }}
                          title={translations.export}
                        >
                          <FileText size={20} />
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
                          <Check size={20} />
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

        {/* Modal de Gerenciamento de Documentos */}
        {showDocumentsModal && selectedShipmentForDocs && (
          <DocumentManager
            shipmentId={selectedShipmentForDocs.id || ''}
            shipmentNumber={selectedShipmentForDocs.numeroBl}
            clientName={selectedShipmentForDocs.cliente}
            isOpen={showDocumentsModal}
            onClose={() => setShowDocumentsModal(false)}
            onDocumentsUpdate={() => {
              // Recarregar dados se necessário
              console.log('Documentos atualizados');
            }}
          />
        )}

        {/* Modal de Visualização de Documentos */}
        {showDocumentViewer && selectedShipmentForViewer && (
          <DocumentViewer
            shipmentId={selectedShipmentForViewer.id || ''}
            isOpen={showDocumentViewer}
            onClose={() => setShowDocumentViewer(false)}
          />
        )}
      </div>
    </DropdownProvider>
  );
};

export default ShippingTable;
export type { Shipment };
