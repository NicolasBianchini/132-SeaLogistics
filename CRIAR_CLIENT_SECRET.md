# 🔐 Como Criar Client Secret no Azure

## 📋 **Passo a Passo:**

### **1. Acesse o Azure Portal**
- Vá para: https://portal.azure.com
- Faça login com sua conta Microsoft

### **2. Navegue para App Registrations**
- No menu lateral, clique em "Azure Active Directory"
- Clique em "App registrations"
- Procure pela aplicação "Sea Logistics TESTE"

### **3. Acesse a Aplicação**
- Clique na aplicação "Sea Logistics TESTE"
- Você verá o Client ID: `21f52d49-5e17-4d39-b05c-8a3f355ecbc9`

### **4. Criar Client Secret**
- No menu lateral da aplicação, clique em "Certificates & secrets"
- Clique em "New client secret"
- Configure:
  - **Description**: "Excel Integration Secret"
  - **Expires**: "24 months" (recomendado)
- Clique em "Add"

### **5. Copiar o Secret**
- **IMPORTANTE**: Copie o **Value** do secret imediatamente
- Você só verá o valor uma vez!
- O valor será algo como: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

### **6. Atualizar o arquivo .env**
- Abra o arquivo `.env` na raiz do projeto
- Substitua a linha:
  ```
  AZURE_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI
  ```
- Por:
  ```
  AZURE_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
  ```
- (Use o valor real que você copiou)

### **7. Reiniciar o Servidor**
- Pare o servidor atual (Ctrl+C)
- Execute novamente:
  ```bash
  cd server && PORT=3002 node server.js
  ```

## ✅ **Verificação:**
- O servidor deve iniciar sem erros
- A autenticação deve funcionar corretamente
- Você deve conseguir conectar com Excel

## 🚨 **Importante:**
- **NUNCA** compartilhe o client_secret
- **NUNCA** commite o arquivo `.env` no Git
- O secret expira conforme configurado (24 meses)

## 🔧 **Se Der Erro:**
- Verifique se o secret foi copiado corretamente
- Verifique se o arquivo `.env` foi atualizado
- Reinicie o servidor após atualizar o `.env`
