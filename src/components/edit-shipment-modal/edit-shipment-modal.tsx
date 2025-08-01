"use client";

import type React from "react";

import { FileText, MapPin, Package, Save, Ship, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Shipment } from "../../context/shipments-context";
import "./edit-shipment-modal.css";

interface EditShipmentModalProps {
  shipment: Shipment;
  onClose: () => void;
  onSave: (updatedShipment: Shipment) => Promise<void>;
  canEdit: boolean;
}

interface FormData {
  cliente: string;
  operador: string;
  shipper: string;
  pol: string;
  pod: string;
  etdOrigem: string;
  etaDestino: string;
  currentLocation: string;
  quantBox: number;
  status: string;
  numeroBl: string;
  armador: string;
  booking: string;
  invoice: string;
  observacoes: string;
}

const EditShipmentModal = ({
  shipment,
  onClose,
  onSave,
  canEdit,
}: EditShipmentModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    cliente: "",
    operador: "",
    shipper: "",
    pol: "",
    pod: "",
    etdOrigem: "",
    etaDestino: "",
    currentLocation: "",
    quantBox: 1,
    status: "",
    numeroBl: "",
    armador: "",
    booking: "",
    invoice: "",
    observacoes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Opções para os selects
  const statusOptions = ["A Embarcar", "Embarcado", "Concluído"];

  const armadores = [
    "MSC",
    "Maersk",
    "CMA CGM",
    "Hapag-Lloyd",
    "COSCO",
    "Evergreen",
  ];

  const portos = [
    "Santos, Brasil",
    "Itajaí, Brasil",
    "Paranaguá, Brasil",
    "Rio Grande, Brasil",
    "Suape, Brasil",
    "Rotterdam, Holanda",
    "Hamburgo, Alemanha",
    "Barcelona, Espanha",
    "Xangai, China",
    "Singapura",
    "Los Angeles, EUA",
    "Nova York, EUA",
  ];

  // Carregar dados do shipment no formulário
  useEffect(() => {
    if (shipment) {
      setFormData({
        cliente: shipment.cliente || "",
        operador: shipment.operador || "",
        shipper: shipment.shipper || "",
        pol: shipment.pol || "",
        pod: shipment.pod || "",
        etdOrigem: shipment.etdOrigem || "",
        etaDestino: shipment.etaDestino || "",
        currentLocation: shipment.currentLocation || "",
        quantBox: shipment.quantBox || 1,
        status: shipment.status || "",
        numeroBl: shipment.numeroBl || "",
        armador: shipment.armador || "",
        booking: shipment.booking || "",
        invoice: shipment.invoice || "",
        observacoes: (shipment as any).observacoes || "",
      });
    }
  }, [shipment]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    console.log("Campo:", e.target.name, "Valor:", e.target.value);
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantBox" ? Number.parseInt(value) || 1 : value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cliente.trim()) {
      newErrors.cliente = "Cliente é obrigatório";
    }
    if (!formData.operador.trim()) {
      newErrors.operador = "Operador é obrigatório";
    }
    if (!formData.pol.trim()) {
      newErrors.pol = "Porto de origem é obrigatório";
    }
    if (!formData.pod.trim()) {
      newErrors.pod = "Porto de destino é obrigatório";
    }
    if (!formData.etdOrigem) {
      newErrors.etdOrigem = "Data de partida é obrigatória";
    }
    if (!formData.etaDestino) {
      newErrors.etaDestino = "Data de chegada é obrigatória";
    }
    if (!formData.numeroBl.trim()) {
      newErrors.numeroBl = "Número do BL é obrigatório";
    }
    if (!formData.booking.trim()) {
      newErrors.booking = "Número do booking é obrigatório";
    }
    if (!formData.invoice.trim()) {
      newErrors.invoice = "Número do invoice é obrigatório";
    }
    if (!formData.armador.trim()) {
      newErrors.armador = "Armador é obrigatório";
    }
    if (formData.quantBox < 1) {
      newErrors.quantBox = "Quantidade deve ser maior que 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      alert("Você não tem permissão para editar este envio.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const updatedShipment: Shipment = {
        ...shipment,
        cliente: formData.cliente,
        operador: formData.operador,
        shipper: formData.shipper,
        pol: formData.pol,
        pod: formData.pod,
        etdOrigem: formData.etdOrigem,
        etaDestino: formData.etaDestino,
        currentLocation: formData.currentLocation,
        quantBox: formData.quantBox,
        status: formData.status,
        numeroBl: formData.numeroBl,
        armador: formData.armador,
        booking: formData.booking,
        invoice: formData.invoice,
        observacoes: formData.observacoes,
        updatedAt: new Date(),
      };

      await onSave(updatedShipment);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar envio:", error);
      alert("Erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={handleOverlayClick}>
      <div className="edit-modal-content">
        <div className="edit-modal-header">
          <h2>
            <Ship size={24} />
            Editar Envio
          </h2>
          <button className="close-button" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="edit-modal-body">
          <form onSubmit={handleSubmit} className="edit-form">
            {/* Seção Cliente */}
            <div className="form-section">
              <div className="section-title">
                <User size={18} />
                <span>Informações do Cliente</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cliente">Cliente *</label>
                  <input
                    type="text"
                    id="cliente"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    placeholder="Nome do cliente"
                  />
                  {errors.cliente && (
                    <span className="error-message">{errors.cliente}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="operador">Operador *</label>
                  <input
                    type="text"
                    id="operador"
                    name="operador"
                    value={formData.operador}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    placeholder="Nome do operador"
                  />
                  {errors.operador && (
                    <span className="error-message">{errors.operador}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="shipper">Shipper</label>
                  <input
                    type="text"
                    id="shipper"
                    name="shipper"
                    value={formData.shipper}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    placeholder="Nome do shipper"
                  />
                </div>
              </div>
            </div>

            {/* Seção Rota */}
            <div className="form-section">
              <div className="section-title">
                <MapPin size={18} />
                <span>Rota e Cronograma</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pol">Porto de Origem (POL) *</label>
                  <select
                    id="pol"
                    name="pol"
                    value={formData.pol}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">Selecione o porto de origem</option>
                    {portos.map((porto) => (
                      <option key={porto} value={porto}>
                        {porto}
                      </option>
                    ))}
                  </select>
                  {errors.pol && (
                    <span className="error-message">{errors.pol}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="pod">Porto de Destino (POD) *</label>
                  <select
                    id="pod"
                    name="pod"
                    value={formData.pod}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">Selecione o porto de destino</option>
                    {portos.map((porto) => (
                      <option key={porto} value={porto}>
                        {porto}
                      </option>
                    ))}
                  </select>
                  {errors.pod && (
                    <span className="error-message">{errors.pod}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="etdOrigem">Data de Partida (ETD) *</label>
                  <input
                    type="date"
                    id="etdOrigem"
                    name="etdOrigem"
                    value={formData.etdOrigem}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                  {errors.etdOrigem && (
                    <span className="error-message">{errors.etdOrigem}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="etaDestino">Data de Chegada (ETA) *</label>
                  <input
                    type="date"
                    id="etaDestino"
                    name="etaDestino"
                    value={formData.etaDestino}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                  {errors.etaDestino && (
                    <span className="error-message">{errors.etaDestino}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="currentLocation">Local Atual</label>
                  <select
                    id="currentLocation"
                    name="currentLocation"
                    value={formData.currentLocation}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">Selecione o porto de destino</option>
                    {portos.map((porto) => (
                      <option key={porto} value={porto}>
                        {porto}
                      </option>
                    ))}
                  </select>
                  {errors.pod && (
                    <span className="error-message">{errors.pod}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Seção Operacional */}
            <div className="form-section">
              <div className="section-title">
                <Package size={18} />
                <span>Informações Operacionais</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantBox">Quantidade de Containers *</label>
                  <input
                    type="number"
                    id="quantBox"
                    name="quantBox"
                    value={formData.quantBox}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    min="1"
                    max="100"
                  />
                  {errors.quantBox && (
                    <span className="error-message">{errors.quantBox}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">Selecione o status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="armador">Armador *</label>
                  <select
                    id="armador"
                    name="armador"
                    value={formData.armador}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">Selecione um armador</option>
                    {armadores.map((armador) => (
                      <option key={armador} value={armador}>
                        {armador}
                      </option>
                    ))}
                  </select>
                  {errors.armador && (
                    <span className="error-message">{errors.armador}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Seção Documentação */}
            <div className="form-section">
              <div className="section-title">
                <FileText size={18} />
                <span>Documentação</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="numeroBl">Número do BL *</label>
                  <input
                    type="text"
                    id="numeroBl"
                    name="numeroBl"
                    value={formData.numeroBl}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    placeholder="Ex: BL123456789"
                  />
                  {errors.numeroBl && (
                    <span className="error-message">{errors.numeroBl}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="booking">Número do Booking *</label>
                  <input
                    type="text"
                    id="booking"
                    name="booking"
                    value={formData.booking}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    placeholder="Ex: BK987654321"
                  />
                  {errors.booking && (
                    <span className="error-message">{errors.booking}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="invoice">Número do Invoice *</label>
                  <input
                    type="text"
                    id="invoice"
                    name="invoice"
                    value={formData.invoice}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    placeholder="Ex: INV123456"
                  />
                  {errors.invoice && (
                    <span className="error-message">{errors.invoice}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="observacoes">Observações</label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    placeholder="Digite observações sobre o envio..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="edit-modal-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          {canEdit && (
            <button
              type="submit"
              className={`btn-save ${isLoading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              <Save size={16} />
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditShipmentModal;
