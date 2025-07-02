// @ts-check
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Configurar o ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: '.env.local' });

import { sendShipmentConfirmationEmail, sendStatusUpdateEmail, verifyEmailConnection } from './src/services/emailService.js';

// Teste de conexão
console.log('Testando conexão com o servidor de email...');
const testConnection = async () => {
    const isConnected = await verifyEmailConnection();
    console.log('Conexão com servidor de email:', isConnected ? 'OK' : 'FALHOU');
};

// Teste de envio de confirmação de envio
const testShipmentConfirmation = async () => {
    console.log('\nTestando envio de confirmação de envio...');
    const testDetails = {
        blNumber: 'TEST-BL-123',
        client: 'Cliente Teste',
        originPort: 'Porto de Santos',
        destinationPort: 'Porto de Rotterdam',
        expectedDate: new Date()
    };

    const sent = await sendShipmentConfirmationEmail('sistemasealogistics@gmail.com', testDetails);
    console.log('Email de confirmação:', sent ? 'ENVIADO' : 'FALHOU');
};

// Teste de atualização de status
const testStatusUpdate = async () => {
    console.log('\nTestando envio de atualização de status...');
    const testDetails = {
        blNumber: 'TEST-BL-123',
        client: 'Cliente Teste',
        originPort: 'Porto de Santos',
        destinationPort: 'Porto de Rotterdam'
    };

    const sent = await sendStatusUpdateEmail(
        'sistemasealogistics@gmail.com',
        testDetails,
        'Em Trânsito',
        'Entregue'
    );
    console.log('Email de atualização:', sent ? 'ENVIADO' : 'FALHOU');
};

// Executar todos os testes
const runAllTests = async () => {
    await testConnection();
    await testShipmentConfirmation();
    await testStatusUpdate();
};

runAllTests().catch(console.error); 