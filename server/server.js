import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Configurar CORS para permitir apenas as origens necessárias
const allowedOrigins = [
    'https://sealogistics-4f899.web.app',  // Seu domínio do Firebase
    'http://localhost:5173',               // Desenvolvimento local Vite
    'http://localhost:3000',               // Desenvolvimento local alternativo
    'http://localhost:3001'                // Servidor de email local
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (como apps mobile)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS não permitido para esta origem'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());

// Configuração otimizada do transporter do Nodemailer
const transporter = nodemailer.createTransport({
    pool: true, // Usar pool de conexões
    maxConnections: 1, // Limitar a uma conexão
    maxMessages: 3, // Máximo de 3 mensagens por conexão
    rateDelta: 1000, // Intervalo de 1 segundo entre mensagens
    rateLimit: 3, // Limite de 3 mensagens por segundo
    service: 'gmail',
    auth: {
        user: process.env.VITE_EMAIL_USER,
        pass: process.env.VITE_EMAIL_APP_PASSWORD
    }
});

// Rota para enviar email
app.post('/send-email', async (req, res) => {
    try {
        console.log('=== INICIANDO ENVIO DE EMAIL ===');
        const { to, subject, html } = req.body;

        const mailOptions = {
            from: {
                name: 'Sea Logistics',
                address: process.env.VITE_EMAIL_USER
            },
            to,
            subject,
            html,
            headers: {
                'Precedence': 'bulk',
                'X-Auto-Response-Suppress': 'All',
                'Auto-Submitted': 'auto-generated'
            }
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado com sucesso:', info.messageId);
        console.log('=== EMAIL ENVIADO COM SUCESSO ===');

        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('=== ERRO AO ENVIAR EMAIL ===');
        console.error('Detalhes do erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para verificar conexão
app.get('/api/verify-email', async (req, res) => {
    try {
        console.log('=== VERIFICANDO CONEXÃO DE EMAIL ===');
        await transporter.verify();
        console.log('=== CONEXÃO VERIFICADA COM SUCESSO ===');
        res.json({ success: true });
    } catch (error) {
        console.error('=== ERRO AO VERIFICAR CONEXÃO ===');
        console.error('Detalhes do erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota de healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Configurações de email carregadas:');
    console.log('- Pool de conexões ativo');
    console.log('- Máximo de 1 conexão');
    console.log('- Máximo de 3 mensagens por conexão');
    console.log('- Taxa de envio: 3 mensagens/segundo');
    console.log('- Intervalo entre mensagens: 1 segundo');
}); 