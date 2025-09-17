# 🔍 Como Encontrar Seu Client ID Real

## 🎯 **Para usar sua conta pessoal (`nicolastresoldi@gmail.com`)**

### 1. **Acesse o Azure Portal**
- Vá para [portal.azure.com](https://portal.azure.com)
- **IMPORTANTE**: Faça login com sua conta pessoal (`nicolastresoldi@gmail.com`)

### 2. **Encontre sua aplicação**
- Vá para **Azure Active Directory** > **App registrations**
- Procure por uma aplicação chamada algo como:
  - "Sea Logistics Excel Integration"
  - "Excel Integration"
  - Ou qualquer app que você tenha criado

### 3. **Copie o Client ID**
- Clique na aplicação
- Copie o **Application (client) ID** (parece com: `12345678-1234-1234-1234-123456789abc`)

### 4. **Atualize o arquivo .env**
Substitua no arquivo `.env`:
```env
REACT_APP_AZURE_CLIENT_ID=seu_client_id_real_aqui
```

## 🚨 **Se não encontrar a aplicação:**

### **Opção A: Criar nova aplicação**
1. No Azure Portal, vá para **App registrations**
2. Clique em **New registration**
3. Configure:
   - **Name**: `Sea Logistics Excel Integration`
   - **Supported account types**: `Personal Microsoft accounts only`
   - **Redirect URI**: `Web` - `http://localhost:3000/auth/callback`
4. Após criar, copie o Client ID

### **Opção B: Usar modo teste**
- Continue usando o **Modo Teste** que já está funcionando
- Não precisa configurar Azure AD

## 🔧 **Configuração Atual:**

- ✅ **Endpoint corrigido** para contas pessoais (`/consumers/`)
- ✅ **Servidor backend rodando** na porta 3001
- ✅ **Modo teste funcionando** sem Azure AD

## 🎯 **Próximo passo:**

1. Encontre seu Client ID real no Azure Portal
2. Atualize o arquivo `.env`
3. Teste o **Modo Real** com sua conta pessoal

## 📞 **Se precisar de ajuda:**

Me envie o Client ID que você encontrou e eu atualizo o arquivo `.env` para você!
