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
  tipo: string;
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
    tipo: "",
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

  const aeroportos = [
    // Aeroportos Internacionais
    "Guarulhos (GRU), São Paulo, Brasil",
    "Galeão (GIG), Rio de Janeiro, Brasil",
    "Brasília (BSB), Brasil",
    "Miami (MIA), EUA",
    "JFK (JFK), Nova York, EUA",
    "Heathrow (LHR), Londres, Reino Unido",
    "Charles de Gaulle (CDG), Paris, França",
    "Frankfurt (FRA), Alemanha",
    "Dubai (DXB), Emirados Árabes",
    "Hong Kong (HKG), China",
    "Narita (NRT), Tóquio, Japão",
  ];

  const locaisTerrestres = [
    // Locais Terrestres
    "São Paulo, Brasil",
    "Rio de Janeiro, Brasil",
    "Brasília, Brasil",
    "Curitiba, Brasil",
    "Porto Alegre, Brasil",
    "Belo Horizonte, Brasil",
    "Salvador, Brasil",
    "Recife, Brasil",
    "Fortaleza, Brasil",
    "Manaus, Brasil",
    "Miami, EUA",
    "Nova York, EUA",
    "Los Angeles, EUA",
    "Londres, Reino Unido",
    "Paris, França",
    "Berlim, Alemanha",
    "Madri, Espanha",
    "Roma, Itália",
    "Amsterdã, Holanda",
    "Bruxelas, Bélgica",
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
        tipo: (shipment as any).tipo || "",
      });
    }
  }, [shipment]);

  // Limpar campos de origem e destino quando o tipo de transporte for alterado
  useEffect(() => {
    if (formData.tipo) {
      setFormData(prev => ({
        ...prev,
        pol: "",
        pod: "",
        currentLocation: ""
      }));
    }
  }, [formData.tipo]);

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
    if (!formData.tipo.trim()) {
      newErrors.tipo = "Tipo de transporte é obrigatório";
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
        tipo: formData.tipo,
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
                  <label htmlFor="tipo">
                    <Package size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Tipo de Transporte *
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    required
                  >
                    <option value="">Selecione o tipo de transporte</option>
                    <option value="Marítimo">Marítimo</option>
                    <option value="Aéreo">Aéreo</option>
                    <option value="Terrestre">Terrestre</option>
                  </select>
                  {errors.tipo && (
                    <span className="error-message">{errors.tipo}</span>
                  )}
                </div>
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
                  <label htmlFor="pol">
                    {formData.tipo === "Aéreo" ? "Aeroporto de Origem" :
                      formData.tipo === "Terrestre" ? "Local de Origem" :
                        "Porto de Origem"} (POL) *
                  </label>
                  <select
                    id="pol"
                    name="pol"
                    value={formData.pol}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">
                      {formData.tipo === "Aéreo" ? "Selecione o aeroporto de origem" :
                        formData.tipo === "Terrestre" ? "Selecione o local de origem" :
                          "Selecione o porto de origem"}
                    </option>
                    {formData.tipo === "Aéreo" ?
                      aeroportos.map((aeroporto) => (
                        <option key={aeroporto} value={aeroporto}>
                          {aeroporto}
                        </option>
                      )) :
                      formData.tipo === "Terrestre" ?
                        locaisTerrestres.map((local) => (
                          <option key={local} value={local}>
                            {local}
                          </option>
                        )) :
                        portos.map((porto) => (
                          <option key={porto} value={porto}>
                            {porto}
                          </option>
                        ))
                    }
                  </select>
                  {errors.pol && (
                    <span className="error-message">{errors.pol}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="pod">
                    {formData.tipo === "Aéreo" ? "Aeroporto de Destino" :
                      formData.tipo === "Terrestre" ? "Local de Destino" :
                        "Porto de Destino"} (POD) *
                  </label>
                  <select
                    id="pod"
                    name="pod"
                    value={formData.pod}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">
                      {formData.tipo === "Aéreo" ? "Selecione o aeroporto de destino" :
                        formData.tipo === "Terrestre" ? "Selecione o local de destino" :
                          "Selecione o porto de destino"}
                    </option>
                    {formData.tipo === "Aéreo" ?
                      aeroportos.map((aeroporto) => (
                        <option key={aeroporto} value={aeroporto}>
                          {aeroporto}
                        </option>
                      )) :
                      formData.tipo === "Terrestre" ?
                        locaisTerrestres.map((local) => (
                          <option key={local} value={local}>
                            {local}
                          </option>
                        )) :
                        portos.map((porto) => (
                          <option key={porto} value={porto}>
                            {porto}
                          </option>
                        ))
                    }
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
                  <label htmlFor="currentLocation">
                    {formData.tipo === "Aéreo" ? "Aeroporto Atual" :
                      formData.tipo === "Terrestre" ? "Local Atual" :
                        "Porto Atual"}
                  </label>
                  <select
                    id="currentLocation"
                    name="currentLocation"
                    value={formData.currentLocation}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  >
                    <option value="">
                      {formData.tipo === "Aéreo" ? "Selecione o aeroporto atual" :
                        formData.tipo === "Terrestre" ? "Selecione o local atual" :
                          "Selecione o porto atual"}
                    </option>
                    {formData.tipo === "Aéreo" ?
                      aeroportos.map((aeroporto) => (
                        <option key={aeroporto} value={aeroporto}>
                          {aeroporto}
                        </option>
                      )) :
                      formData.tipo === "Terrestre" ?
                        locaisTerrestres.map((local) => (
                          <option key={local} value={local}>
                            {local}
                          </option>
                        )) :
                        portos.map((porto) => (
                          <option key={porto} value={porto}>
                            {porto}
                          </option>
                        ))
                    }
                  </select>
                  {errors.currentLocation && (
                    <span className="error-message">{errors.currentLocation}</span>
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
