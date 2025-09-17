# 🔧 Guia Detalhado - Configuração Azure AD

## 🎯 **Objetivo**: Integrar sua planilha real do OneDrive

**Sua planilha**: https://1drv.ms/x/c/dc64d46ccb357759/Eb0wndv4GGtAgIEFGHnh_gUBDDd5t4pP_gURZsqvSjVGNw?e=HtD8Z8

## 📋 **Passo 1: Acessar Azure Portal**

1. **Abra**: [portal.azure.com](https://portal.azure.com)
2. **Faça login** com: `nicolastresoldi@gmail.com`
3. **Aguarde** o carregamento completo

## 📋 **Passo 2: Criar Nova Aplicação**

1. **No menu lateral**, clique em **"Azure Active Directory"**
2. **Clique em**: "App registrations" (Registros de aplicativo)
3. **Clique em**: "New registration" (Novo registro)

## 📋 **Passo 3: Configurar Aplicação**

### **Informações Básicas:**
- **Name**: `Sea Logistics Excel Integration`
- **Supported account types**: Selecione **"Personal Microsoft accounts only"**
- **Redirect URI**: 
  - Tipo: **Web**
  - URL: `http://localhost:3000/auth/callback`

### **Clique em**: "Register"

## 📋 **Passo 4: Copiar Client ID**

1. **Após criar**, você verá a página "Overview"
2. **Copie** o valor de **"Application (client) ID"**
3. **Formato**: `12345678-1234-1234-1234-123456789abc`

## 📋 **Passo 5: Configurar Permissões**

1. **No menu lateral**, clique em **"API permissions"**
2. **Clique em**: "Add a permission"
3. **Selecione**: "Microsoft Graph"
4. **Selecione**: "Delegated permissions"
5. **Adicione**:
   - `Files.ReadWrite` - Ler e escrever arquivos
   - `Sites.ReadWrite.All` - Acesso a sites e arquivos
   - `User.Read` - Informações básicas do usuário
6. **Clique em**: "Add permissions"

## 📋 **Passo 6: Conceder Permissões**

1. **Clique em**: "Grant admin consent for [seu nome]"
2. **Confirme** clicando em "Yes"

## 📋 **Passo 7: Atualizar Arquivo .env**

**Me envie o Client ID** que você copiou e eu atualizo o arquivo `.env` para você!

## 🎯 **Resultado Esperado:**

Após configurar, você poderá:
- ✅ **Conectar** com sua conta Microsoft
- ✅ **Acessar** sua planilha do OneDrive
- ✅ **Sincronizar** dados em tempo real
- ✅ **Mapear** campos automaticamente

## 🚨 **Problemas Comuns:**

### **"Não consigo acessar Azure Portal"**
- Use sua conta pessoal Microsoft (`nicolastresoldi@gmail.com`)
- Não use conta corporativa

### **"Não vejo App registrations"**
- Certifique-se de estar em "Azure Active Directory"
- Use conta pessoal, não corporativa

### **"Erro ao criar aplicação"**
- Verifique se está usando conta pessoal
- Tente em modo incógnito

## 📞 **Precisa de Ajuda?**

Se tiver qualquer dificuldade:
1. **Me envie** o Client ID quando conseguir
2. **Eu atualizo** o arquivo `.env`
3. **Testamos** a integração juntos

**O Client ID é o mais importante - me envie quando conseguir!** 🎯
