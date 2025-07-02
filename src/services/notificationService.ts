import { Shipment } from '../context/shipments-context';
import { sendEmail } from './emailService';

export const sendShipmentCreatedEmail = async (shipment: Shipment, clientEmail: string): Promise<boolean> => {
    const subject = `Novo envio criado - ${shipment.numeroBl}`;
    const html = `
        <h2>Novo envio criado</h2>
        <p>Olá,</p>
        <p>Um novo envio foi criado com os seguintes detalhes:</p>
        <ul>
            <li><strong>Número BL:</strong> ${shipment.numeroBl}</li>
            <li><strong>Cliente:</strong> ${shipment.cliente}</li>
            <li><strong>Operador:</strong> ${shipment.operador}</li>
            <li><strong>Porto de Origem:</strong> ${shipment.pol}</li>
            <li><strong>Porto de Destino:</strong> ${shipment.pod}</li>
            <li><strong>ETD Origem:</strong> ${shipment.etdOrigem}</li>
            <li><strong>ETA Destino:</strong> ${shipment.etaDestino}</li>
            <li><strong>Quantidade de Containers:</strong> ${shipment.quantBox}</li>
            <li><strong>Status:</strong> ${shipment.status}</li>
            <li><strong>Armador:</strong> ${shipment.armador}</li>
            <li><strong>Booking:</strong> ${shipment.booking}</li>
        </ul>
        <p>Atenciosamente,<br>Sea Logistics</p>
    `;

    return sendEmail({
        to: clientEmail,
        subject,
        html
    });
};

export const sendStatusUpdateEmail = async (shipment: Shipment, clientEmail: string, oldStatus: string): Promise<boolean> => {
    const subject = `Status do envio atualizado - ${shipment.numeroBl}`;
    const html = `
        <h2>Status do envio atualizado</h2>
        <p>Olá,</p>
        <p>O status do seu envio foi atualizado:</p>
        <ul>
            <li><strong>Número BL:</strong> ${shipment.numeroBl}</li>
            <li><strong>Status Anterior:</strong> ${oldStatus}</li>
            <li><strong>Novo Status:</strong> ${shipment.status}</li>
            <li><strong>Cliente:</strong> ${shipment.cliente}</li>
            <li><strong>Porto de Origem:</strong> ${shipment.pol}</li>
            <li><strong>Porto de Destino:</strong> ${shipment.pod}</li>
        </ul>
        <p>Atenciosamente,<br>Sea Logistics</p>
    `;

    return sendEmail({
        to: clientEmail,
        subject,
        html
    });
}; 