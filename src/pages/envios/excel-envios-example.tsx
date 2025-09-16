import React, { useState } from 'react';
import ExcelIntegration from '../../components/excel-integration/excel-integration';

// Exemplo de como integrar o Excel na página de envios
const ExcelEnviosExample: React.FC = () => {
    const [shipments, setShipments] = useState([
        {
            id: '1',
            shipmentNumber: 'SH001',
            origin: 'Santos',
            destination: 'Rotterdam',
            status: 'Em Trânsito',
            company: 'ABC Corp',
            date: '2024-01-15'
        },
        {
            id: '2',
            shipmentNumber: 'SH002',
            origin: 'Hamburg',
            destination: 'Santos',
            status: 'Entregue',
            company: 'XYZ Ltd',
            date: '2024-01-16'
        }
    ]);

    const handleShipmentsUpdate = (updatedShipments: any[]) => {
        setShipments(updatedShipments);
        console.log('Shipments atualizados via Excel:', updatedShipments);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Integração Excel Online - Exemplo</h1>

            {/* Componente de integração Excel */}
            <ExcelIntegration
                shipments={shipments}
                onShipmentsUpdate={handleShipmentsUpdate}
            />

            {/* Lista de envios atual */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb'
            }}>
                <h2>Envios Atuais ({shipments.length})</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: '16px'
                    }}>
                        <thead>
                            <tr style={{
                                background: '#f9fafb',
                                borderBottom: '2px solid #e5e7eb'
                            }}>
                                <th style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>Número</th>
                                <th style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>Origem</th>
                                <th style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>Destino</th>
                                <th style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>Status</th>
                                <th style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>Empresa</th>
                                <th style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.map((shipment) => (
                                <tr key={shipment.id} style={{
                                    borderBottom: '1px solid #e5e7eb'
                                }}>
                                    <td style={{
                                        padding: '12px',
                                        color: '#1f2937',
                                        fontWeight: '500'
                                    }}>{shipment.shipmentNumber}</td>
                                    <td style={{
                                        padding: '12px',
                                        color: '#374151'
                                    }}>{shipment.origin}</td>
                                    <td style={{
                                        padding: '12px',
                                        color: '#374151'
                                    }}>{shipment.destination}</td>
                                    <td style={{
                                        padding: '12px'
                                    }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: shipment.status === 'Entregue' ? '#dcfce7' : '#fef3c7',
                                            color: shipment.status === 'Entregue' ? '#166534' : '#92400e'
                                        }}>
                                            {shipment.status}
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: '12px',
                                        color: '#374151'
                                    }}>{shipment.company}</td>
                                    <td style={{
                                        padding: '12px',
                                        color: '#6b7280',
                                        fontSize: '14px'
                                    }}>{shipment.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Instruções */}
            <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '20px'
            }}>
                <h3 style={{
                    margin: '0 0 12px 0',
                    color: '#0c4a6e'
                }}>Como usar:</h3>
                <ol style={{
                    margin: '0',
                    paddingLeft: '20px',
                    color: '#0c4a6e',
                    lineHeight: '1.6'
                }}>
                    <li>Clique em <strong>"Conectar Excel"</strong> para configurar a integração</li>
                    <li>Faça login com sua conta Microsoft</li>
                    <li>Selecione sua planilha Excel Online</li>
                    <li>Configure o mapeamento de campos</li>
                    <li>Ative a sincronização automática</li>
                    <li>Os dados serão atualizados em tempo real!</li>
                </ol>
            </div>
        </div>
    );
};

export default ExcelEnviosExample;
