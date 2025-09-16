// Configuração do Azure AD para Microsoft Graph API
export const azureConfig = {
    // Substitua pelo seu Client ID do Azure AD
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID',

    // URL de redirecionamento (deve estar registrada no Azure AD)
    redirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI || `${window.location.origin}/auth/callback`,

    // Escopos necessários para acessar Excel
    scopes: [
        'https://graph.microsoft.com/Files.ReadWrite',
        'https://graph.microsoft.com/Sites.ReadWrite.All',
        'https://graph.microsoft.com/User.Read'
    ],

    // URL base do Microsoft Graph
    graphApiUrl: 'https://graph.microsoft.com/v1.0',

    // URL de autorização do Azure AD
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',

    // URL para trocar código por token (deve ser implementada no backend)
    tokenUrl: '/api/excel/token',

    // URL para webhook (deve ser implementada no backend)
    webhookUrl: '/api/excel/webhook'
};

// Instruções para configuração:
/*
1. Acesse o Azure Portal (https://portal.azure.com)
2. Vá para "Azure Active Directory" > "App registrations"
3. Clique em "New registration"
4. Configure:
   - Name: "Sea Logistics Excel Integration"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web - http://localhost:3000/auth/callback (para desenvolvimento)
5. Após criar, anote o "Application (client) ID"
6. Vá para "API permissions" e adicione:
   - Microsoft Graph > Delegated permissions:
     * Files.ReadWrite
     * Sites.ReadWrite.All
     * User.Read
7. Vá para "Certificates & secrets" e crie um "Client secret" se necessário
8. Configure as variáveis de ambiente:
   REACT_APP_AZURE_CLIENT_ID=seu_client_id_aqui
   REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000/auth/callback
*/
