# 📊 Guia de Integração Excel - Sea Logistics

## 🎯 Objetivo
Este guia explica como conectar sua planilha Excel Online com a página de envios para sincronização automática em tempo real.

## 🚀 Como Funciona

### 1. **Seleção da Planilha**
- Acesse a página de **Envios**
- Clique em **"Mostrar Excel"** para exibir os controles de integração
- Clique em **"Começar Integração"**
- Faça login com sua conta Microsoft
- Selecione o arquivo Excel desejado
- Escolha a planilha específica
- Selecione a tabela com os dados de envios

### 2. **Mapeamento de Campos**
O sistema mapeia automaticamente as colunas do Excel com os campos do sistema:
- **Cliente** → Nome do cliente
- **Tipo** → Tipo de transporte (AÉREO, MARÍTIMO, etc.)
- **Shipper** → Remetente
- **POL** → Porto de Origem
- **POD** → Porto de Destino
- **ETD Origem** → Data de partida
- **ETA Destino** → Data de chegada
- **Quant Box** → Quantidade de caixas
- **N° BL** → Número do Bill of Lading
- **Armador** → Companhia de transporte
- **Booking** → Número de reserva

### 3. **Sincronização Automática**

#### 🔄 **Auto Sync**
- Ativa sincronização automática a cada 30 segundos
- Mantém os dados sempre atualizados
- Pode ser pausado a qualquer momento

#### 🔗 **Webhook**
- Recebe notificações em tempo real quando o Excel é modificado
- Sincronização instantânea
- Requer configuração inicial

#### 📡 **Busca Manual**
- Botão "Buscar do Servidor" para sincronização sob demanda
- Útil para verificar atualizações específicas

## 📋 Estrutura da Planilha Excel

### Formato Recomendado
```
| Cliente | Tipo | Shipper | POL | POD | ETD Origem | ETA Destino | Quant Box | N° BL | Armador | Booking |
|---------|------|---------|-----|-----|------------|-------------|-----------|-------|---------|---------|
| Empresa A | AÉREO | Shipper A | GRU | JFK | 14/08/2025 | 29/08/2025 | 1 | BL12345 | Maersk | BK1234 |
| Empresa B | MARÍTIMO | Shipper B | Santos | Rotterdam | 15/08/2025 | 30/08/2025 | 4 | BL12346 | CMA CGM | BK1235 |
```

### Requisitos
- ✅ Primeira linha deve conter cabeçalhos
- ✅ Dados organizados em tabela
- ✅ Datas no formato DD/MM/AAAA
- ✅ Arquivo salvo no OneDrive/SharePoint

## 🔧 Configuração Avançada

### Permissões Necessárias
- **Microsoft Graph**: Files.ReadWrite, Sites.ReadWrite.All, User.Read
- **OneDrive**: Acesso de leitura/escrita aos arquivos Excel
- **SharePoint**: Se a planilha estiver no SharePoint

### Troubleshooting

#### ❌ **Erro de Autenticação**
- Verifique se está logado com a conta Microsoft correta
- Confirme as permissões da aplicação
- Tente desconectar e reconectar

#### ❌ **Planilha Não Encontrada**
- Verifique se o arquivo está no OneDrive
- Confirme se tem permissão de acesso
- Teste com um arquivo de exemplo

#### ❌ **Sincronização Falha**
- Verifique a conexão com a internet
- Confirme se a planilha tem a estrutura correta
- Use "Verificar Conexão" para diagnosticar

## 📱 Interface da Página de Envios

### Controles Disponíveis
1. **Mostrar/Ocultar Excel**: Alterna a exibição dos controles
2. **Sincronizar Agora**: Força sincronização imediata
3. **Auto Sync**: Liga/desliga sincronização automática
4. **Verificar Conexão**: Testa conectividade
5. **Buscar do Servidor**: Obtém dados atualizados
6. **Configurar Webhook**: Ativa notificações em tempo real

### Status de Conexão
- 🟢 **Conectado**: Sincronização funcionando
- 🔴 **Desconectado**: Problema de conectividade
- ⏳ **Sincronizando**: Operação em andamento

## 🔄 Fluxo de Sincronização

```mermaid
graph TD
    A[Usuário modifica Excel] --> B[Webhook detecta mudança]
    B --> C[Servidor recebe notificação]
    C --> D[Dados são atualizados]
    D --> E[Página de envios reflete mudanças]
    
    F[Auto Sync ativo] --> G[Sincronização a cada 30s]
    G --> H[Verifica mudanças no Excel]
    H --> I[Atualiza página se necessário]
    
    J[Busca Manual] --> K[Usuário clica "Buscar do Servidor"]
    K --> L[Sincronização imediata]
```

## 🎯 Benefícios

### ✅ **Tempo Real**
- Mudanças no Excel aparecem instantaneamente na página
- Não precisa recarregar a página
- Dados sempre atualizados

### ✅ **Automatização**
- Sincronização automática
- Reduz trabalho manual
- Elimina erros de digitação

### ✅ **Flexibilidade**
- Use Excel como interface familiar
- Mantenha dados organizados
- Compartilhe facilmente com equipe

### ✅ **Confiabilidade**
- Múltiplos métodos de sincronização
- Fallback automático
- Logs detalhados para troubleshooting

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Teste com dados de exemplo
3. Confirme permissões da conta Microsoft
4. Entre em contato com o suporte técnico

---

**💡 Dica**: Comece com uma planilha de teste para familiarizar-se com o processo antes de usar dados reais.
