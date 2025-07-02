interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

// URL do servidor de email - usa variável de ambiente ou fallback para localhost
const API_URL = import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3001';

// Função base para envio de emails
export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<boolean> => {
    try {
        console.log('=== INICIANDO ENVIO DE EMAIL ===');
        console.log('Para:', to);
        console.log('Assunto:', subject);

        const response = await fetch(`${API_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                subject,
                html
            })
        });

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

// Função para enviar email de atualização de status
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