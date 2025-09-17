# 🔧 Resolver Problema de Consentimento

## 🚨 **Problema**: Não consegue alterar o consentimento

## 🎯 **Soluções:**

### **Opção 1: Usar "Aplicativos Empresariais"**

1. **Clique no link** "Aplicativos Empresariais" (azul, na parte inferior)
2. **Procure** sua aplicação na lista
3. **Clique** na aplicação
4. **Vá para**: "Permissões"
5. **Clique em**: "Conceder consentimento do administrador"

### **Opção 2: Tentar Novamente**

1. **Volte** para "API permissions"
2. **Clique** nos três pontos (...) ao lado de cada permissão
3. **Selecione**: "Conceder consentimento do administrador"
4. **Confirme** com "Yes"

### **Opção 3: Remover e Adicionar Novamente**

1. **Remova** as permissões atuais (botão "Remove permission")
2. **Adicione** novamente:
   - `Files.ReadWrite`
   - `Sites.ReadWrite.All`
   - `User.Read`
3. **Tente** conceder consentimento novamente

### **Opção 4: Usar Conta Administrador**

Se você tem acesso a uma conta administrador:
1. **Faça logout** da conta atual
2. **Faça login** com conta administrador
3. **Tente** conceder consentimento

## 🔍 **Verificar Status Atual:**

### **O que você vê:**
- ✅ **Status**: "Concedido para Diretório..."
- ❌ **Consentimento**: "Não"

### **O que precisa:**
- ✅ **Status**: "Concedido para Diretório..."
- ✅ **Consentimento**: "Sim"

## 🚀 **Alternativa: Testar Sem Consentimento**

Se não conseguir alterar o consentimento, podemos testar assim:

1. **Copie** o Client ID da aplicação
2. **Me envie** o Client ID
3. **Eu atualizo** o arquivo `.env`
4. **Testamos** a integração
5. **Se der erro**, tentamos outras soluções

## 📋 **Informações que Preciso:**

Para te ajudar melhor, me diga:

1. **Qual o nome** da sua aplicação?
2. **Qual o Client ID** (Application ID)?
3. **Que tipo de conta** você está usando? (Pessoal/Corporativa)
4. **Você é administrador** do tenant?

## 🎯 **Próximo Passo:**

**Me envie o Client ID da sua aplicação e eu atualizo o arquivo `.env` para testarmos!**

Mesmo sem o consentimento perfeito, podemos tentar a integração e ver o que acontece.

## 📞 **Se Ainda Não Funcionar:**

Podemos:
- Criar uma nova aplicação
- Usar uma conta diferente
- Configurar de outra forma

**O importante é ter o Client ID para começarmos a testar!** 🎯
