const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');

// Configurar dotenv - carrega o .env da pasta pai
dotenv.config({ path: '../.env' });

// Criar app Express
const app = express();

// Configuração básica
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Lista de origens permitidas
const allowedOrigins = [
    'https://132-sealogistics.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

// Configurar CORS
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (como Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Origem bloqueada:', origin);
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware para adicionar headers CORS em todas as respostas
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Configuração otimizada do transporter do Nodemailer
const transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    rateDelta: 1000,
    rateLimit: 3,
    service: 'gmail',
    auth: {
        user: process.env.VITE_EMAIL_USER,
        pass: process.env.VITE_EMAIL_APP_PASSWORD
    }
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        message: 'Sea Logistics Email Server',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Rota de healthcheck
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
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

// Rota para trocar código de autorização por token (Excel Integration)
app.post('/api/excel/token', async (req, res) => {
    try {
        console.log('=== TROCANDO CÓDIGO POR TOKEN ===');
        const { code, code_verifier } = req.body;

        // Debug: verificar se o client_secret está sendo carregado
        const debugClientSecret = process.env.AZURE_CLIENT_SECRET || 'TEMPORARY_SECRET_FOR_TESTING';
        console.log('Client Secret carregado:', debugClientSecret ? 'SIM' : 'NÃO');
        console.log('Client Secret (primeiros 10 chars):', debugClientSecret.substring(0, 10) + '...');

        if (!code) {
            return res.status(400).json({ success: false, error: 'Código de autorização não fornecido' });
        }

        if (!code_verifier) {
            return res.status(400).json({ success: false, error: 'Code verifier não fornecido' });
        }

        // Troca real do código por token usando Microsoft Graph API
        const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const clientId = process.env.REACT_APP_AZURE_CLIENT_ID || '21f52d49-5e17-4d39-b05c-8a3f355ecbc9';
        const clientSecret = process.env.AZURE_CLIENT_SECRET || 'TEMPORARY_SECRET_FOR_TESTING';
        const redirectUri = 'http://localhost:3000/auth/callback';
        // Debug: Log das configurações
        console.log('=== DEBUG REDIRECT URI ===');
        console.log('Client ID:', clientId);
        console.log('Redirect URI no backend:', redirectUri);
        console.log('Código recebido:', code ? 'SIM' : 'NÃO');
        console.log('Code verifier recebido:', code_verifier ? 'SIM' : 'NÃO');
        console.log('Code verifier (primeiros 10 chars):', code_verifier ? code_verifier.substring(0, 10) + '...' : 'N/A');

        const tokenData = {
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            scope: 'https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Sites.ReadWrite.All https://graph.microsoft.com/User.Read',
            code_verifier: code_verifier
        };

        console.log('Enviando requisição para Microsoft Graph...');
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(tokenData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Erro na resposta do Microsoft Graph:', response.status, errorData);
            return res.status(400).json({
                success: false,
                error: `Erro na autenticação: ${response.status} - ${errorData}`
            });
        }

        const tokenResponse = await response.json();
        console.log('=== TOKEN REAL OBTIDO COM SUCESSO ===');
        console.log('Token type:', tokenResponse.token_type);
        console.log('Expires in:', tokenResponse.expires_in);

        res.json(tokenResponse);
    } catch (error) {
        console.error('=== ERRO AO TROCAR CÓDIGO POR TOKEN ===');
        console.error('Detalhes do erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para webhook do Excel (receber notificações de mudanças)
app.post('/api/excel/webhook', async (req, res) => {
    try {
        console.log('=== WEBHOOK EXCEL RECEBIDO ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);

        // Validação básica do webhook
        const { validationToken, resource, changeType } = req.body;

        // Se for uma validação de webhook, retorna o token
        if (validationToken) {
            console.log('Validação de webhook recebida');
            return res.status(200).send(validationToken);
        }

        // Processa notificação de mudança
        if (resource && changeType === 'updated') {
            console.log('Mudança detectada no Excel:', resource);

            // Aqui você pode implementar lógica para:
            // 1. Notificar clientes conectados via WebSocket
            // 2. Atualizar cache de dados
            // 3. Disparar sincronização automática

            // Por enquanto, apenas logamos
            console.log('Excel foi atualizado - sincronização necessária');
        }

        res.json({
            success: true,
            message: 'Webhook processado com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('=== ERRO AO PROCESSAR WEBHOOK ===');
        console.error('Detalhes do erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para obter dados atualizados do Excel
app.get('/api/excel/data/:workbookId/:worksheetId/:tableId', async (req, res) => {
    try {
        console.log('=== SOLICITAÇÃO DE DADOS DO EXCEL ===');
        const { workbookId, worksheetId, tableId } = req.params;

        console.log('Parâmetros:', { workbookId, worksheetId, tableId });

        // Aqui você implementaria a lógica para buscar dados do Excel
        // Por enquanto, retorna dados mock
        const mockData = [
            {
                id: '1',
                cliente: 'Nova Empresa',
                tipo: 'AÉREO',
                shipper: 'teste',
                pol: 'Guarulhos (GRU), Brasil',
                pod: 'JFK (JFK), Nova York, EUA',
                etdOrigem: '2025-08-14',
                etaDestino: '2025-08-29',
                quantBox: '1',
                numeroBl: 'BL12345',
                armador: 'Maersk',
                booking: 'BK1234 INV1234'
            }
        ];

        res.json({
            success: true,
            data: mockData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('=== ERRO AO OBTER DADOS DO EXCEL ===');
        console.error('Detalhes do erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Configuração da porta
const port = process.env.PORT || 3001;

// Iniciar o servidor
app.listen(port, '0.0.0.0', () => {
    console.log('==================================');
    console.log(`Servidor rodando na porta ${port}`);
    console.log('Origens permitidas:', allowedOrigins);
    console.log('==================================');
}); 