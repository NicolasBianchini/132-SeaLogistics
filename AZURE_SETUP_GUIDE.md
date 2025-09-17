# 🚀 Guia Rápido - Configuração Azure AD para Excel Integration

## ✅ Problemas Resolvidos

1. **Servidor backend iniciado** na porta 3001 ✅
2. **Endpoints criados** (`/api/excel/token` e `/api/excel/webhook`) ✅
3. **Arquivo .env criado** com variáveis necessárias ✅
4. **Erro de sintaxe corrigido** no excel-callback.tsx ✅

## 🔧 Próximos Passos para Configurar Azure AD

### 1. Registrar Aplicação no Azure AD

1. Acesse [Azure Portal](https://portal.azure.com)
2. Vá para **Azure Active Directory** > **App registrations**
3. Clique em **New registration**
4. Configure:
   - **Name**: `Sea Logistics Excel Integration`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: `Web` - `http://localhost:3000/auth/callback`

### 2. Configurar Permissões

1. Na aplicação criada, vá para **API permissions**
2. Clique em **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Adicione as seguintes permissões:
   - `Files.ReadWrite` - Ler e escrever arquivos
   - `Sites.ReadWrite.All` - Acesso a sites e arquivos
   - `User.Read` - Informações básicas do usuário

### 3. Atualizar Arquivo .env

Edite o arquivo `.env` na raiz do projeto e substitua `YOUR_CLIENT_ID` pelo Client ID real:

```env
REACT_APP_AZURE_CLIENT_ID=seu_client_id_real_aqui
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 4. Testar a Integração

1. Reinicie o servidor frontend (se necessário)
2. Acesse a página de integração Excel
3. Clique em "Conectar Excel"
4. Faça login com sua conta Microsoft
5. Autorize as permissões

## 🎯 Status Atual

- ✅ Servidor backend rodando na porta 3001
- ✅ Endpoints `/api/excel/token` e `/api/excel/webhook` funcionando
- ✅ Arquivo `.env` criado
- ✅ Erro de sintaxe corrigido
- ⏳ Aguardando configuração do Azure AD

## 🔍 Como Verificar se Está Funcionando

1. **Backend**: http://localhost:3001/health
2. **Frontend**: http://localhost:3000/excel-integration
3. **Console do navegador**: Não deve mais mostrar erros de conexão

## 📞 Suporte

Se ainda houver problemas após configurar o Azure AD, verifique:
- Se o Client ID está correto no `.env`
- Se as permissões foram concedidas no Azure AD
- Se o Redirect URI está exatamente como configurado
- Se ambos os servidores estão rodando (frontend na 3000, backend na 3001)
