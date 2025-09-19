const express = require('express');
const app = express();

app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota para Excel token
app.post('/api/excel/token', async (req, res) => {
    try {
        console.log('=== TROCANDO CÓDIGO POR TOKEN ===');
        const { code, code_verifier } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Código de autorização não fornecido' });
        }

        if (!code_verifier) {
            return res.status(400).json({ success: false, error: 'Code verifier não fornecido' });
        }

        // Troca real do código por token usando Microsoft Graph API
        const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const clientId = '21f52d49-5e17-4d39-b05c-8a3f355ecbc9';
        const clientSecret = 'TEMPORARY_SECRET_FOR_TESTING';
        const redirectUri = 'http://localhost:3000/auth/callback';

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

const port = 3002;

app.listen(port, () => {
    console.log('==================================');
    console.log(`Servidor rodando na porta ${port}`);
    console.log('==================================');
});
