import { useState } from "react";
import StatusPicker from "../../components/status-picker/status-picker";
import ShippingTable, { Shipment } from "../../components/shipping-table/shipping-table";
import "./status-demo.css";

const StatusDemo = () => {
    const [selectedStatus, setSelectedStatus] = useState("");

    const handleStatusChange = (newStatus: string) => {
        setSelectedStatus(newStatus);
        console.log("Status selecionado:", newStatus);
    };

    const handleShipmentUpdate = (updatedShipment: Shipment) => {
        console.log("Envio atualizado:", updatedShipment);
    };

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            "em-transito": "Em trânsito",
            "agendado": "Agendado",
            "documentacao": "Documentação",
            "concluido": "Concluído"
        };
        return statusMap[status] || "Nenhum status selecionado";
    };

    return (
        <div className="status-demo-container">
            <div className="demo-header">
                <h1>Demonstração do Sistema de Status</h1>
                <p>Teste os componentes de status abaixo:</p>
            </div>

            {/* StatusPicker Demo */}
            <div className="demo-section">
                <h2>StatusPicker - Seletor Vertical</h2>
                <div className="demo-content">
                    <div className="status-picker-wrapper">
                        <StatusPicker
                            title="Status"
                            currentStatus={selectedStatus}
                            onStatusChange={handleStatusChange}
                        />
                    </div>

                    <div className="demo-info">
                        <div className="selected-status-display">
                            <h3>Status Atual:</h3>
                            <p className="current-status">
                                {getStatusLabel(selectedStatus)}
                            </p>
                        </div>

                        <div className="demo-instructions">
                            <h3>Instruções:</h3>
                            <ul>
                                <li>Clique em qualquer opção de status para selecioná-la</li>
                                <li>O status selecionado será destacado com uma borda</li>
                                <li>O indicador ✓ mostra qual status está ativo</li>
                                <li>As cores correspondem aos status do sistema logístico</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* ShippingTable Demo */}
            <div className="demo-section">
                <h2>Tabela de Envios - StatusSelector</h2>
                <p>Clique nos status da tabela para alterá-los:</p>
                <ShippingTable
                    onShipmentUpdate={handleShipmentUpdate}
                />
            </div>

            {/* Status Legend */}
            <div className="demo-section">
                <div className="status-meanings">
                    <h3>Significado dos Status:</h3>
                    <div className="status-legend">
                        <div className="legend-item">
                            <div className="legend-color" style={{ backgroundColor: "#ffd166" }}></div>
                            <span><strong>Em trânsito:</strong> Mercadoria em transporte</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ backgroundColor: "#118ab2" }}></div>
                            <span><strong>Agendado:</strong> Entrega programada</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ backgroundColor: "#073b4c" }}></div>
                            <span><strong>Documentação:</strong> Processando documentos</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ backgroundColor: "#06d6a0" }}></div>
                            <span><strong>Concluído:</strong> Processo finalizado</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusDemo; 