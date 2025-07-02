import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar app Express
const app = express();

// Configuração básica
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Configurar CORS para permitir apenas as origens necessárias
const allowedOrigins = [
    'https://132-sealogistics.netlify.app',  // Seu domínio do Netlify
    'http://localhost:5173',                 // Desenvolvimento local Vite
    'http://localhost:3000',                 // Desenvolvimento local alternativo
    'http://localhost:3001'                  // Servidor de email local
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (como apps mobile)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Origem bloqueada pelo CORS:', origin);
            return callback(new Error('CORS não permitido para esta origem'), false);
        }
        console.log('Origem permitida pelo CORS:', origin);
        return callback(null, true);
    },
    credentials: true
}));

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

// Rota raiz
app.get('/', (req, res) => {
    res.json({ message: 'Sea Logistics Email Server' });
});

// Rota de healthcheck
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: port,
        host: host,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            hasEmailConfig: !!process.env.VITE_EMAIL_USER
        }
    });
});

// Rota para enviar email
app.post('/send-email', async (req, res) => {
    try {
        console.log('=== INICIANDO ENVIO DE EMAIL ===');
        console.log('Corpo da requisição:', req.body);
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

// Configuração da porta
const port = parseInt(process.env.PORT || '10000');
const host = '0.0.0.0';

// Verificar configuração
console.log('==================================');
console.log('Iniciando servidor com configurações:');
console.log('- PORT:', port);
console.log('- HOST:', host);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Process PID:', process.pid);
console.log('==================================');

// Iniciar o servidor
const server = app.listen(port, host, () => {
    console.log('==================================');
    console.log(`Servidor RODANDO em ${host}:${port}`);
    console.log('Configurações ativas:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Origens permitidas:', allowedOrigins);
    console.log('- Email configurado:', process.env.VITE_EMAIL_USER ? 'Sim' : 'Não');
    console.log('- Process PID:', process.pid);
    console.log('==================================');
}).on('error', (err) => {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
});

// Verificar se o servidor está escutando
if (server.listening) {
    console.log(`Servidor confirmado escutando na porta ${port}`);
} else {
    console.error('Servidor não está escutando!');
    process.exit(1);
}

// Tratamento de sinais de término
process.on('SIGTERM', () => {
    console.log('Recebido sinal SIGTERM, fechando servidor...');
    server.close(() => {
        console.log('Servidor fechado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Recebido sinal SIGINT, fechando servidor...');
    server.close(() => {
        console.log('Servidor fechado');
        process.exit(0);
    });
}); 