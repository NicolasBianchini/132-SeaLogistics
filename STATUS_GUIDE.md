# Guia de Status de Envio - Sea Logistics

## Visão Geral
Este documento descreve todos os status disponíveis para acompanhamento de envios, organizados por modalidade de transporte (Marítimo, Aéreo e Terrestre).

## Status Disponíveis

### 📋 **Status Inicial - Documentação**
- **Valor**: `documentacao`
- **Label**: "Documentação"
- **Cor**: Cinza (#6c757d)
- **Descrição**: Fase inicial onde documentos estão sendo preparados e verificados
- **Aplicável**: Todas as modalidades

### 📅 **Status de Planejamento**
- **Valor**: `agendado`
- **Label**: "Agendado"
- **Cor**: Azul claro (#17a2b8)
- **Descrição**: Envio foi agendado e está na fila para processamento
- **Aplicável**: Todas as modalidades

### 🚢 **Status de Preparação**
- **Valor**: `a-embarcar`
- **Label**: "A Embarcar"
- **Cor**: Amarelo (#ffd166)
- **Descrição**: Carga está pronta e aguardando embarque
- **Aplicável**: Todas as modalidades

### ⬆️ **Status de Embarque**
- **Valor**: `embarcando`
- **Label**: "Embarcando"
- **Cor**: Laranja (#fd7e14)
- **Descrição**: Carga está sendo carregada no veículo/embarcação
- **Aplicável**: Todas as modalidades

### 🚛 **Status de Trânsito**
- **Valor**: `em-transito`
- **Label**: "Em Trânsito"
- **Cor**: Azul (#118ab2)
- **Descrição**: Carga está em movimento entre origem e destino
- **Aplicável**: Todas as modalidades

### ⬇️ **Status de Desembarque**
- **Valor**: `desembarcando`
- **Label**: "Desembarcando"
- **Cor**: Roxo (#6f42c1)
- **Descrição**: Carga está sendo descarregada no destino
- **Aplicável**: Todas as modalidades

### 🚚 **Status de Entrega**
- **Valor**: `em-entrega`
- **Label**: "Em Entrega"
- **Cor**: Verde claro (#20c997)
- **Descrição**: Carga está sendo entregue ao destinatário final
- **Aplicável**: Todas as modalidades

### ✅ **Status Final**
- **Valor**: `concluido`
- **Label**: "Concluído"
- **Cor**: Azul escuro (#073b4c)
- **Descrição**: Envio foi entregue com sucesso
- **Aplicável**: Todas as modalidades

### ⚠️ **Status de Problemas**
- **Valor**: `atrasado`
- **Label**: "Atrasado"
- **Cor**: Vermelho (#dc3545)
- **Descrição**: Envio está atrasado em relação ao cronograma
- **Aplicável**: Todas as modalidades

- **Valor**: `cancelado`
- **Label**: "Cancelado"
- **Cor**: Cinza (#6c757d)
- **Descrição**: Envio foi cancelado
- **Aplicável**: Todas as modalidades

- **Valor**: `suspenso`
- **Label**: "Suspenso"
- **Cor**: Amarelo (#ffc107)
- **Descrição**: Envio foi temporariamente suspenso
- **Aplicável**: Todas as modalidades

## Aplicação por Modalidade

### 🚢 **Envio Marítimo**
**Status Recomendados**:
1. `documentacao` → Preparação de documentos marítimos
2. `agendado` → Agendamento no porto
3. `a-embarcar` → Carga no terminal portuário
4. `embarcando` → Carregamento no navio
5. `em-transito` → Navegação
6. `desembarcando` → Descarga no porto de destino
7. `em-entrega` → Entrega ao destinatário
8. `concluido` → Entrega finalizada

### ✈️ **Envio Aéreo**
**Status Recomendados**:
1. `documentacao` → Preparação de documentos aéreos
2. `agendado` → Agendamento no aeroporto
3. `a-embarcar` → Carga no terminal aéreo
4. `embarcando` → Carregamento no avião
5. `em-transito` → Voo
6. `desembarcando` → Descarga no aeroporto de destino
7. `em-entrega` → Entrega ao destinatário
8. `concluido` → Entrega finalizada

### 🚛 **Envio Terrestre**
**Status Recomendados**:
1. `documentacao` → Preparação de documentos rodoviários
2. `agendado` → Agendamento da coleta
3. `a-embarcar` → Carga pronta para coleta
4. `embarcando` → Carregamento no caminhão
5. `em-transito` → Viagem rodoviária
6. `desembarcando` → Descarga no destino
7. `em-entrega` → Entrega ao destinatário
8. `concluido` → Entrega finalizada

## Fluxo de Status Recomendado

```
documentacao → agendado → a-embarcar → embarcando → em-transito → desembarcando → em-entrega → concluido
```

## Status de Problemas
Os status de problemas (`atrasado`, `cancelado`, `suspenso`) podem ser aplicados em qualquer ponto do fluxo principal quando necessário.

## Notas de Implementação
- Todos os status são case-sensitive e devem ser usados exatamente como definidos
- As cores são consistentes em toda a aplicação
- O sistema suporta transições entre status não sequenciais
- Cada status pode ter notificações automáticas configuradas
