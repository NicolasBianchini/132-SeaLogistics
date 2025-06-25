import { useState } from "react";
import { Ship, User, MapPin, Package, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { LanguageProvider } from "../../context/language-context";
import { useShipments } from "../../context/shipments-context";
import "./novo-envio.css";

interface Cliente {
    id: number;
    nome: string;
    empresa: string;
    email: string;
}

interface NovoEnvio {
    clienteId: number;
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
}

const NovoEnvioPage = () => {
    const navigate = useNavigate();
    const { addShipment } = useShipments();

    const [formData, setFormData] = useState<NovoEnvio>({
        clienteId: 0,
        operador: "",
        pol: "",
        pod: "",
        etdOrigem: "",
        etaDestino: "",
        quantBox: 1,
        status: "Agendado",
        numeroBl: "",
        armador: "",
        booking: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lista de clientes mockada
    const clientes: Cliente[] = [
        { id: 1, nome: "João Silva", empresa: "Empresa ABC", email: "joao@empresa-abc.com" },
        { id: 2, nome: "Maria Oliveira", empresa: "Indústria XYZ", email: "maria@industria-xyz.com" },
        { id: 3, nome: "Carlos Mendes", empresa: "Comércio Global", email: "carlos@comercio-global.com" },
        { id: 4, nome: "Ana Pereira", empresa: "Exportadora Sul", email: "ana@exportadora-sul.com" },
        { id: 5, nome: "Roberto Costa", empresa: "Importações Norte", email: "roberto@imp-norte.com" },
    ];

    const operadores = [
        "João Silva",
        "Maria Oliveira",
        "Carlos Mendes",
        "Ana Pereira",
        "Roberto Santos",
        "Fernanda Lima"
    ];

    const armadores = [
        "MSC",
        "Maersk",
        "CMA CGM",
        "Hapag-Lloyd",
        "COSCO",
        "Evergreen"
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
        "Nova York, EUA"
    ];

    const statusOptions = [
        "Agendado",
        "Em trânsito",
        "Documentação",
        "Concluído"
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'clienteId' || name === 'quantBox' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const clienteSelecionado = clientes.find(c => c.id === formData.clienteId);

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
                booking: formData.booking
            };

            await addShipment(shipmentData);

            alert("Envio registrado com sucesso!");

            // Reset form
            setFormData({
                clienteId: 0,
                operador: "",
                pol: "",
                pod: "",
                etdOrigem: "",
                etaDestino: "",
                quantBox: 1,
                status: "Agendado",
                numeroBl: "",
                armador: "",
                booking: ""
            });

            // Redirect to home to see the new shipment
            navigate("/home");
        } catch (error) {
            console.error("Erro ao criar envio:", error);
            alert("Erro ao registrar envio. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const clienteSelecionado = clientes.find(c => c.id === formData.clienteId);

    return (
        <LanguageProvider>
            <main className="novo-envio-main">
                <Navbar />
                <div className="novo-envio-content">
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

                                <div className="form-group">
                                    <label htmlFor="clienteId">Cliente *</label>
                                    <select
                                        id="clienteId"
                                        name="clienteId"
                                        value={formData.clienteId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value={0}>Selecione um cliente</option>
                                        {clientes.map(cliente => (
                                            <option key={cliente.id} value={cliente.id}>
                                                {cliente.empresa} - {cliente.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {clienteSelecionado && (
                                    <div className="cliente-info">
                                        <div className="cliente-card">
                                            <h3>{clienteSelecionado.empresa}</h3>
                                            <p><strong>Contato:</strong> {clienteSelecionado.nome}</p>
                                            <p><strong>Email:</strong> {clienteSelecionado.email}</p>
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
                                        >
                                            <option value="">Selecione um operador</option>
                                            {operadores.map(op => (
                                                <option key={op} value={op}>{op}</option>
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
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
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
                                            required
                                        >
                                            <option value="">Selecione um armador</option>
                                            {armadores.map(arm => (
                                                <option key={arm} value={arm}>{arm}</option>
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
                                    <h2>Portos e Cronograma</h2>
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
                                            {portos.map(porto => (
                                                <option key={porto} value={porto}>{porto}</option>
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
                                            {portos.map(porto => (
                                                <option key={porto} value={porto}>{porto}</option>
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
                                        <label htmlFor="etaDestino">Data Prevista Chegada (ETA) *</label>
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
                                </div>
                            </div>

                            {/* Botões */}
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => window.history.back()}>
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