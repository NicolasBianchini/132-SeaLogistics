interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

// URL do servidor de email - usa variável de ambiente ou fallback para localhost
const API_URL = (import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3001').replace(/\/+$/, '');

// Função base para envio de emails
export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<boolean> => {
    try {
        console.log('=== INICIANDO ENVIO DE EMAIL ===');
        console.log('Configuração:', {
            url: API_URL,
            to,
            subject
        });

        const response = await fetch(`${API_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to,
                subject,
                html
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erro ao enviar email');
        }

        console.log('=== EMAIL ENVIADO COM SUCESSO ===');
        return true;
    } catch (error) {
        console.error('=== ERRO AO ENVIAR EMAIL ===');
        console.error('Detalhes do erro:', error);
        return false;
    }
};

// Função para enviar email de confirmação de novo envio
export const sendShipmentConfirmationEmail = async (
    to: string,
    shipmentDetails: any
): Promise<boolean> => {
    const subject = 'Confirmação de Novo Envio - Sea Logistics';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Confirmação de Novo Envio</h2>
            <p>Seu novo envio foi registrado com sucesso!</p>
            
            <h3>Detalhes do Envio:</h3>
            <ul>
                <li><strong>Número BL:</strong> ${shipmentDetails.blNumber}</li>
                <li><strong>Cliente:</strong> ${shipmentDetails.client}</li>
                <li><strong>Porto de Origem:</strong> ${shipmentDetails.originPort}</li>
                <li><strong>Porto de Destino:</strong> ${shipmentDetails.destinationPort}</li>
                <li><strong>Data Prevista:</strong> ${new Date(shipmentDetails.expectedDate).toLocaleDateString()}</li>
            </ul>
            
            <p>Você pode acompanhar o status do seu envio através do nosso sistema.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Sea Logistics</p>
        </div>
    `;

    return sendEmail({ to, subject, html });
};

// Função para enviar email de atualização de embarque marítimo
export const sendMaritimeShipmentUpdateEmail = async (
    to: string,
    clientName: string,
    shipmentDetails: any
): Promise<boolean> => {
    const subject = 'ATUALIZAÇÃO DE SEU EMBARQUE MARÍTIMO - Sea Logistics International';

    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Atualização de Embarque Marítimo</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 800px; margin: 0 auto; background-color: white; }
                .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; text-align: center; }
                .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                .logo-s { font-size: 36px; color: #60a5fa; }
                .subtitle { font-size: 16px; opacity: 0.9; margin-bottom: 20px; }
                .contact-info { font-size: 14px; opacity: 0.8; }
                .content { padding: 30px; }
                .greeting { font-size: 18px; margin-bottom: 20px; }
                .shipment-details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .shipment-details h3 { color: #1e3a8a; margin-top: 0; }
                .shipment-details ul { list-style: none; padding: 0; }
                .shipment-details li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
                .shipment-details li:last-child { border-bottom: none; }
                .shipment-details strong { color: #374151; }
                .tracking-section { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .tracking-section h3 { color: #1e3a8a; margin-top: 0; }
                .map-placeholder { background-color: #e5e7eb; height: 300px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; margin: 20px 0; }
                .whatsapp-section { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; }
                .whatsapp-section h3 { color: #166534; margin-top: 0; }
                .whatsapp-section ul { list-style: none; padding: 0; }
                .whatsapp-section li { padding: 5px 0; }
                .whatsapp-section li:before { content: "✔ "; color: #22c55e; font-weight: bold; }
                .cta-button { display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
                .footer { background-color: #1f2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="logo">SEA LOGISTICS <span class="logo-s">S</span> INTERNATIONAL</div>
                    <div class="subtitle">ATUALIZAÇÃO DE SEU EMBARQUE MARÍTIMO</div>
                    <div class="subtitle">Acompanhe detalhes atualizados de seu embarque.</div>
                    <div class="contact-info">
                        www.sealogistics.com.br | +55 11 95939-1837
                    </div>
                </div>

                <!-- Content -->
                <div class="content">
                    <div class="greeting">
                        Prezado Cliente <strong>${clientName}</strong>,
                    </div>
                    
                    <p>Segue principais informações sobre o status da sua carga ref ao booking <strong>${shipmentDetails.booking || 'N/A'}</strong>.</p>

                    <!-- Detalhes do Embarque -->
                    <div class="shipment-details">
                        <h3>📋 Detalhes do Embarque</h3>
                        <ul>
                            <li><strong>Navio:</strong> ${shipmentDetails.vessel || 'N/A'}</li>
                            <li><strong>Rota:</strong> [${shipmentDetails.originPort || 'N/A'}] → [${shipmentDetails.destinationPort || 'N/A'}]</li>
                            <li><strong>Booking:</strong> ${shipmentDetails.booking || 'N/A'}</li>
                            <li><strong>BL:</strong> ${shipmentDetails.blNumber || 'N/A'}</li>
                            <li><strong>ETD (Data de Partida):</strong> ${shipmentDetails.etd ? new Date(shipmentDetails.etd).toLocaleDateString('pt-BR') : 'N/A'}</li>
                            <li><strong>ETA (Data de Chegada):</strong> ${shipmentDetails.eta ? new Date(shipmentDetails.eta).toLocaleDateString('pt-BR') : 'N/A'}</li>
                            <li><strong>Localização Atual:</strong> ${shipmentDetails.currentLocation || 'O navio está em trânsito'}</li>
                        </ul>
                    </div>

                    <!-- Seção de Localização Atual Detalhada -->
                    <div class="tracking-section">
                        <h3>📍 Localização Atual</h3>
                        <p>${shipmentDetails.currentLocation || 'O navio está em trânsito'}</p>
                        
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <span style="font-size: 20px; margin-right: 10px;">🚢</span>
                                <div>
                                    <strong>${shipmentDetails.vessel || 'N/A'}</strong>
                                    <div style="font-size: 14px; color: #666;">Container Ship IMO: ${shipmentDetails.imo || '9735206'}</div>
                                </div>
                            </div>
                            
                            <!-- Tabs de Navegação -->
                            <div style="display: flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 15px;">
                                <div style="padding: 10px 15px; background: #3b82f6; color: white; border-radius: 6px 6px 0 0; font-weight: bold;">Overview</div>
                                <div style="padding: 10px 15px; color: #666; cursor: pointer;">Port call log</div>
                                <div style="padding: 10px 15px; color: #666; cursor: pointer;">Vessel characteristics</div>
                                <div style="padding: 10px 15px; color: #666; cursor: pointer;">Ownership</div>
                                <div style="padding: 10px 15px; color: #666; cursor: pointer;">Performance insight</div>
                            </div>
                            
                            <!-- Mapa Interativo -->
                            <div style="background: #e5e7eb; height: 250px; border-radius: 8px; position: relative; margin: 15px 0;">
                                <div style="position: absolute; top: 10px; right: 10px;">
                                    <button style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                        View on live map
                                    </button>
                                </div>
                                
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #6b7280;">
                                    <div style="font-size: 20px; margin-bottom: 10px;">🗺️</div>
                                    <div style="font-weight: bold; margin-bottom: 5px;">Mapa de Rastreamento</div>
                                    <div style="font-size: 12px; margin-bottom: 15px;">
                                        <strong>Rota:</strong> ${shipmentDetails.originPort || ''} → ${shipmentDetails.destinationPort || ''}
                                    </div>
                                    
                                    <!-- Timeline -->
                                    <div style="display: flex; align-items: center; justify-content: center; margin: 20px 0;">
                                        <div style="display: flex; align-items: center; margin-right: 20px;">
                                            <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; margin-right: 8px;"></div>
                                            <span style="font-size: 12px;">Departure from ${shipmentDetails.originPort || ''}</span>
                                        </div>
                                        <div style="width: 40px; height: 2px; background: #d1d5db; margin: 0 10px;"></div>
                                        <div style="display: flex; align-items: center;">
                                            <div style="width: 12px; height: 12px; background: #9ca3af; border-radius: 50%; margin-right: 8px;"></div>
                                            <span style="font-size: 12px;">Arrival at ${shipmentDetails.destinationPort || ''}</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Informações de Tempo -->
                                    <div style="font-size: 11px; color: #9ca3af;">
                                        <div><strong>Actual time of departure:</strong> ${shipmentDetails.actualDeparture || '2025-08-23 21:19 (UTC-5)'}</div>
                                        <div><strong>Reported ETA:</strong> ${shipmentDetails.reportedEta || '2025-09-03 12:00 (UTC-3)'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Seção WhatsApp -->
                    <div class="whatsapp-section">
                        <h3>💬 Rastreamento Automático via WhatsApp</h3>
                        <p>Pensando em facilitar ainda mais sua rotina logística, a SEA LOGISTICS oferece o rastreamento automático de cargas via WhatsApp!</p>
                        
                        <p><strong>✔ Basta enviar o número do seu booking para nosso WhatsApp!</strong></p>
                        
                        <p>Receba automaticamente:</p>
                        <ul>
                            <li>Status da carga</li>
                            <li>Localização do navio</li>
                            <li>Previsão de chegada</li>
                        </ul>
                        
                        <p><strong>Tudo isso sem login, sem complicações, 24h por dia.</strong></p>
                        
                        <p><strong>Clique aqui e teste agora:</strong></p>
                        <a href="https://wa.me/5511959391837?text=Olá! Gostaria de rastrear meu booking ${shipmentDetails.booking || ''}" class="cta-button">
                            📱 Rastrear via WhatsApp
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>© 2024 Sea Logistics International. Todos os direitos reservados.</p>
                    <p>Para suporte: contato@sealogistics.com.br</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to, subject, html });
};

// Função para enviar email de atualização de status (mantida para compatibilidade)
export const sendStatusUpdateEmail = async (
    to: string,
    shipmentDetails: any,
    oldStatus: string,
    newStatus: string
): Promise<boolean> => {
    const subject = 'Atualização de Status do Envio - Sea Logistics';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Atualização de Status do Envio</h2>
            <p>O status do seu envio foi atualizado!</p>
            
            <h3>Detalhes da Atualização:</h3>
            <ul>
                <li><strong>Número BL:</strong> ${shipmentDetails.blNumber}</li>
                <li><strong>Status Anterior:</strong> ${oldStatus}</li>
                <li><strong>Novo Status:</strong> ${newStatus}</li>
            </ul>
            
            <h3>Informações do Envio:</h3>
            <ul>
                <li><strong>Cliente:</strong> ${shipmentDetails.client}</li>
                <li><strong>Porto de Origem:</strong> ${shipmentDetails.originPort}</li>
                <li><strong>Porto de Destino:</strong> ${shipmentDetails.destinationPort}</li>
            </ul>
            
            <p>Para mais detalhes, acesse nosso sistema.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Sea Logistics</p>
        </div>
    `;

    return sendEmail({ to, subject, html });
};

// Função para verificar a conexão do email
export const verifyEmailConnection = async (): Promise<boolean> => {
    try {
        console.log('=== VERIFICANDO CONEXÃO DE EMAIL ===');

        const response = await fetch(`${API_URL}/api/verify-email`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erro ao verificar conexão');
        }

        console.log('=== CONEXÃO VERIFICADA COM SUCESSO ===');
        return true;
    } catch (error) {
        console.error('=== ERRO AO VERIFICAR CONEXÃO ===');
        console.error('Detalhes do erro:', error);
        return false;
    }
};

// Exemplo de uso da nova função:
/*
// Para enviar email de atualização de embarque marítimo:
await sendMaritimeShipmentUpdateEmail(
  'cliente@empresa.com',
  'Nome da Empresa',
  {
    vessel: 'MSC PALAK UX527A',
    originPort: 'TIANJIN',
    destinationPort: 'PARANAGUA',
    booking: '177LBBWYXTNN2723',
    blNumber: 'KDRX25060096',
    etd: '2025-07-10',
    eta: '2025-09-11',
    currentLocation: 'O navio de contêineres MSC PALAK está atualmente localizado na Costa Norte da América do Sul',
    status: 'Em trânsito',
    imo: '9735206',
    actualDeparture: '2025-08-23 21:19 (UTC-5)',
    reportedEta: '2025-09-03 12:00 (UTC-3)'
  }
);
*/ 