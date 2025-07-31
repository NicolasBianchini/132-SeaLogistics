"use client";

import type React from "react";

import { collection, getDocs, query, where } from "firebase/firestore";
import { FileText, MapPin, Package, Ship, User } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { NavbarContext } from "../../components/navbar/navbar-context";
import { useAuth } from "../../context/auth-context";
import { LanguageProvider } from "../../context/language-context";
import { useShipments } from "../../context/shipments-context";
import { db } from "../../lib/firebaseConfig";
import "./novo-envio.css";

interface Cliente {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  companyId?: string;
}

interface Operador {
  id: string;
  nome: string;
  email: string;
}

interface NovoEnvio {
  clienteId: string;
  operador: string;
  pol: string;
  pod: string;
  etdOrigem: string;
  etaDestino: string;
  quantBox: number;
  status: string;
  numeroBl: string;
  armador: string;
  booking: string;
  invoice: string;
  tipo: "Aéreo" | "Marítimo" | "Rodoviário" | "";
}

const NovoEnvioPage = () => {
  const navigate = useNavigate();
  const { addShipment } = useShipments();
  const { isAdmin } = useAuth();
  const { isCollapsed } = useContext(NavbarContext);

  // Verificar permissões ao carregar a página
  useEffect(() => {
    if (!isAdmin()) {
      alert(
        "Acesso negado. Apenas administradores podem criar novos shipments."
      );
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  const [formData, setFormData] = useState<NovoEnvio>({
    clienteId: "",
    operador: "",
    pol: "",
    pod: "",
    etdOrigem: "",
    etaDestino: "",
    quantBox: 1,
    status: "Agendado",
    numeroBl: "",
    armador: "",
    booking: "",
    invoice: "",
    tipo: "",
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingOperadores, setLoadingOperadores] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar clientes reais do Firestore (apenas usuários não-admin)
  useEffect(() => {
    const fetchClientes = async () => {
      setLoadingClientes(true);
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("role", "!=", "admin")
        );
        const snapshot = await getDocs(usersQuery);
        const clientesData: Cliente[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nome: data.displayName || data.name || "Usuário",
            empresa: data.companyName || "-",
            email: data.email || "-",
            companyId: data.companyId || undefined,
          };
        });
        setClientes(clientesData);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setClientes([]);
      } finally {
        setLoadingClientes(false);
      }
    };
    fetchClientes();
  }, []);

  // Buscar operadores admins do Firestore
  useEffect(() => {
    const fetchOperadores = async () => {
      setLoadingOperadores(true);
      try {
        const adminsQuery = query(
          collection(db, "users"),
          where("role", "==", "admin"),
          where("isActive", "==", true)
        );
        const snapshot = await getDocs(adminsQuery);
        const operadoresData: Operador[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nome: data.displayName || data.name || "Admin",
            email: data.email || "",
          };
        });
        setOperadores(operadoresData);
      } catch (error) {
        console.error("Erro ao buscar operadores:", error);
        setOperadores([]);
      } finally {
        setLoadingOperadores(false);
      }
    };
    fetchOperadores();
  }, []);

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

  const statusOptions = ["A Embarcar", "Embarcado", "Concluído"];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantBox" ? Number.parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin()) {
      alert("Erro: Você não tem permissão para criar shipments.");
      return;
    }

    setIsSubmitting(true);

    try {
      const clienteSelecionado = clientes.find(
        (c) => c.id === formData.clienteId
      );

      if (!clienteSelecionado) {
        alert("Por favor, selecione um cliente válido.");
        return;
      }

      const shipmentData = {
        cliente: clienteSelecionado.empresa,
        operador: formData.operador,
        pol: formData.pol,
        pod: formData.pod,
        etdOrigem: formData.etdOrigem,
        etaDestino: formData.etaDestino,
        quantBox: formData.quantBox,
        status: formData.status,
        numeroBl: formData.numeroBl,
        armador: formData.armador,
        booking: formData.booking,
        companyId: clienteSelecionado.companyId,
        invoice: formData.invoice,
        shipper: "",
      };

      await addShipment(shipmentData);

      alert("Envio registrado com sucesso!");

      setFormData({
        clienteId: "",
        operador: "",
        pol: "",
        pod: "",
        etdOrigem: "",
        etaDestino: "",
        quantBox: 1,
        status: "Agendado",
        numeroBl: "",
        armador: "",
        booking: "",
        invoice: "",
        tipo: "",
      });

      navigate("/home");
    } catch (error) {
      console.error("Erro ao criar envio:", error);
      alert("Erro ao registrar envio. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clienteSelecionado = clientes.find((c) => c.id === formData.clienteId);

  if (!isAdmin()) {
    return (
      <LanguageProvider>
        <main className="novo-envio-main">
          <Navbar />
          <div
            className={`novo-envio-content ${
              isCollapsed ? "navbar-collapsed" : ""
            }`}
          >
            <div className="novo-envio-container">
              <div className="access-denied">
                <h2>Acesso Negado</h2>
                <p>Apenas administradores podem criar novos shipments.</p>
              </div>
            </div>
          </div>
        </main>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <main className="novo-envio-main">
        <Navbar />
        <div
          className={`novo-envio-content ${
            isCollapsed ? "navbar-collapsed" : ""
          }`}
        >
          <div className="novo-envio-container">
            <div className="novo-envio-header">
              <div className="header-icon">
                <Ship size={32} />
              </div>
              <div className="header-content">
                <h1>Novo Envio</h1>
                <p>Registre um novo envio marítimo no sistema</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="novo-envio-form">
              {/* Seção Cliente */}
              <div className="form-section">
                <div className="section-header">
                  <User size={20} />
                  <h2>Informações do Cliente</h2>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clienteId">Cliente *</label>
                    <select
                      id="clienteId"
                      name="clienteId"
                      value={formData.clienteId}
                      onChange={handleInputChange}
                      required
                      disabled={loadingClientes}
                    >
                      <option value="">
                        {loadingClientes
                          ? "Carregando clientes..."
                          : "Selecione um cliente"}
                      </option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome} - {cliente.empresa}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {clienteSelecionado && (
                  <div className="cliente-info">
                    <div className="cliente-card">
                      <h3>{clienteSelecionado.nome}</h3>
                      <p>
                        <strong>Empresa:</strong> {clienteSelecionado.empresa}
                      </p>
                      <p>
                        <strong>Email:</strong> {clienteSelecionado.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seção Operacional */}
              <div className="form-section">
                <div className="section-header">
                  <Package size={20} />
                  <h2>Informações Operacionais</h2>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="operador">Operador Responsável *</label>
                    <select
                      id="operador"
                      name="operador"
                      value={formData.operador}
                      onChange={handleInputChange}
                      required
                      disabled={loadingOperadores}
                    >
                      <option value="">
                        {loadingOperadores
                          ? "Carregando operadores..."
                          : "Selecione um operador"}
                      </option>
                      {operadores.map((op) => (
                        <option key={op.id} value={op.nome}>
                          {op.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status Inicial</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
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
                    <label htmlFor="tipo">Tipo de Transporte *</label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione o tipo de transporte</option>
                      <option value="Aéreo">Aéreo</option>
                      <option value="Marítimo">Marítimo</option>
                      <option value="Rodoviário">Rodoviário</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="armador">Armador *</label>
                    <select
                      id="armador"
                      name="armador"
                      value={formData.armador}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione um armador</option>
                      {armadores.map((arm) => (
                        <option key={arm} value={arm}>
                          {arm}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantBox">Quantidade de Containers *</label>
                    <input
                      type="number"
                      id="quantBox"
                      name="quantBox"
                      value={formData.quantBox}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Seção Portos e Datas */}
              <div className="form-section">
                <div className="section-header">
                  <MapPin size={20} />
                  <h2>Rota e Cronograma</h2>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pol">Porto de Origem (POL) *</label>
                    <select
                      id="pol"
                      name="pol"
                      value={formData.pol}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione o porto de origem</option>
                      {portos.map((porto) => (
                        <option key={porto} value={porto}>
                          {porto}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pod">Porto de Destino (POD) *</label>
                    <select
                      id="pod"
                      name="pod"
                      value={formData.pod}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione o porto de destino</option>
                      {portos.map((porto) => (
                        <option key={porto} value={porto}>
                          {porto}
                        </option>
                      ))}
                    </select>
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
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="etaDestino">
                      Data Prevista Chegada (ETA) *
                    </label>
                    <input
                      type="date"
                      id="etaDestino"
                      name="etaDestino"
                      value={formData.etaDestino}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Seção Documentação */}
              <div className="form-section">
                <div className="section-header">
                  <FileText size={20} />
                  <h2>Documentação</h2>
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
                      placeholder="Ex: BL123456789"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking">Número do Booking *</label>
                    <input
                      type="text"
                      id="booking"
                      name="booking"
                      value={formData.booking}
                      onChange={handleInputChange}
                      placeholder="Ex: BK987654321"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="invoice">Número do Invoice *</label>
                    <input
                      type="text"
                      id="invoice"
                      name="invoice"
                      value={formData.invoice}
                      onChange={handleInputChange}
                      placeholder="Ex: BK987654321"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => window.history.back()}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registrando..." : "Registrar Envio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </LanguageProvider>
  );
};

export default NovoEnvioPage;
