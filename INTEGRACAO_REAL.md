# 🔗 Integração com Planilha Real do OneDrive

## 📊 **Sua Planilha:**
- **Link**: https://1drv.ms/x/c/dc64d46ccb357759/Eb0wndv4GGtAgIEFGHnh_gUBDDd5t4pP_gURZsqvSjVGNw?e=HtD8Z8
- **Tipo**: OneDrive Excel Online
- **Status**: Pronta para integração

## 🎯 **Para Integrar com Dados Reais:**

### **1. Configure o Azure AD (Obrigatório)**

Você precisa registrar uma aplicação no Azure AD para acessar sua planilha:

1. **Acesse**: [Azure Portal](https://portal.azure.com)
2. **Faça login** com sua conta Microsoft (`nicolastresoldi@gmail.com`)
3. **Vá para**: Azure Active Directory > App registrations
4. **Clique em**: New registration
5. **Configure**:
   - **Name**: `Sea Logistics Excel Integration`
   - **Supported account types**: `Personal Microsoft accounts only`
   - **Redirect URI**: `Web` - `http://localhost:3000/auth/callback`

### **2. Obtenha o Client ID**

1. **Após criar**, copie o **Application (client) ID**
2. **Vá para**: API permissions
3. **Adicione**:
   - Microsoft Graph > Delegated permissions:
     * `Files.ReadWrite`
     * `Sites.ReadWrite.All`
     * `User.Read`

### **3. Atualize o Arquivo .env**

Substitua no arquivo `.env`:
```env
REACT_APP_AZURE_CLIENT_ID=seu_client_id_real_aqui
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### **4. Teste a Integração**

1. **Acesse**: http://localhost:3000/excel-integration
2. **Clique em**: "🔗 Modo Real"
3. **Clique em**: "Conectar Excel"
4. **Faça login** com sua conta Microsoft
5. **Selecione** sua planilha do OneDrive
6. **Configure** o mapeamento de campos

## 🔧 **Estrutura Esperada da Planilha:**

Para melhor integração, sua planilha deve ter:
- **Tabelas estruturadas** (não apenas células soltas)
- **Cabeçalhos claros** na primeira linha
- **Dados consistentes** em cada coluna

## 📋 **Campos Recomendados:**

- Número do Envio
- Cliente
- Origem
- Destino
- Status
- Data
- BL Number
- Booking
- Armador

## 🚀 **Próximos Passos:**

1. **Configure o Azure AD** (passo mais importante)
2. **Me envie o Client ID** que você obteve
3. **Eu atualizo o arquivo .env** para você
4. **Testamos a integração** com sua planilha real

## 📞 **Precisa de Ajuda?**

Se tiver dificuldades com o Azure AD, posso:
- Criar um guia passo-a-passo detalhado
- Ajudar com screenshots específicos
- Configurar tudo para você

**Me envie o Client ID quando conseguir e eu finalizo a configuração!** 🎯
