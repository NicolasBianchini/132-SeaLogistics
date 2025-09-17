# 🔧 Alterar Permissões de App Existente

## ✅ **Sim! Você pode usar sua aplicação existente!**

## 📋 **Passo 1: Encontrar Sua Aplicação**

1. **Acesse**: [portal.azure.com](https://portal.azure.com)
2. **Faça login** com: `nicolastresoldi@gmail.com`
3. **Vá para**: Azure Active Directory > App registrations
4. **Procure** sua aplicação existente (pode ter outro nome)

## 📋 **Passo 2: Adicionar Permissões**

1. **Clique** na sua aplicação
2. **No menu lateral**, clique em **"API permissions"**
3. **Clique em**: "Add a permission"
4. **Selecione**: "Microsoft Graph"
5. **Selecione**: "Delegated permissions"
6. **Adicione**:
   - `Files.ReadWrite` - Ler e escrever arquivos
   - `Sites.ReadWrite.All` - Acesso a sites e arquivos
   - `User.Read` - Informações básicas do usuário
7. **Clique em**: "Add permissions"

## 📋 **Passo 3: Conceder Permissões**

1. **Clique em**: "Grant admin consent for [seu nome]"
2. **Confirme** clicando em "Yes"

## 📋 **Passo 4: Verificar Redirect URI**

1. **No menu lateral**, clique em **"Authentication"**
2. **Verifique** se tem: `http://localhost:3000/auth/callback`
3. **Se não tiver**, adicione:
   - Tipo: **Web**
   - URL: `http://localhost:3000/auth/callback`
4. **Clique em**: "Save"

## 📋 **Passo 5: Copiar Client ID**

1. **Vá para**: "Overview"
2. **Copie** o **"Application (client) ID"**
3. **Me envie** o Client ID

## 🎯 **Vantagens de Usar App Existente:**

- ✅ **Mais rápido** - não precisa criar nova
- ✅ **Menos configuração** - só adicionar permissões
- ✅ **Mesmo resultado** - funciona igual

## 🔍 **Se Não Encontrar Sua App:**

### **Possíveis Nomes:**
- Sea Logistics
- Excel Integration
- Microsoft Graph App
- Qualquer nome que você tenha usado antes

### **Se Não Tiver Nenhuma:**
- Aí sim precisa criar nova (seguindo o guia anterior)

## 🚀 **Depois de Configurar:**

1. **Me envie** o Client ID
2. **Eu atualizo** o arquivo `.env`
3. **Testamos** a integração com sua planilha real

## 📞 **Precisa de Ajuda?**

Se não conseguir encontrar sua aplicação:
- **Me diga** o nome que você lembra
- **Ou crie** uma nova seguindo o guia anterior
- **O importante** é ter o Client ID correto

**Procure sua aplicação existente primeiro - é muito mais fácil!** 🎯
