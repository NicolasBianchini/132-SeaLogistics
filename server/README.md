# Sea Logistics Email Server

Servidor de email para o Sea Logistics, responsável pelo envio de notificações por email.

## Configuração Local

1. Instale as dependências:
```bash
npm install
```

2. Crie um arquivo `.env` com as seguintes variáveis:
```
VITE_EMAIL_USER=seu-email@gmail.com
VITE_EMAIL_APP_PASSWORD=sua-senha-de-app
PORT=3001
```

3. Execute o servidor:
```bash
npm start
```

## Deploy no Render

1. Crie uma conta no [Render](https://render.com)

2. Crie um novo Web Service:
   - Conecte seu repositório GitHub
   - Configure:
     - Nome: `sealogistics-email-server`
     - Runtime: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plano: Free

3. Configure as variáveis de ambiente no Render:
   - `VITE_EMAIL_USER`: seu email do Gmail
   - `VITE_EMAIL_APP_PASSWORD`: senha de aplicativo do Gmail
   - `PORT`: 3000 (o Render usa esta porta por padrão)

4. O Render irá fazer o deploy automaticamente

## Notas de Segurança

- Use sempre uma senha de aplicativo do Gmail, nunca sua senha principal
- As origens CORS estão configuradas para permitir apenas:
  - https://sealogistics-4f899.web.app
  - http://localhost:5173
  - http://localhost:3000

## Endpoints

- `POST /send-email`: Envia um email
- `GET /api/verify-email`: Verifica a conexão com o Gmail
- `GET /health`: Healthcheck do servidor 