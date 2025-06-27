# Sistema de Gerenciamento de Usuários - SeaLogistics

## Visão Geral

O SeaLogistics agora suporta dois tipos de usuários distintos:

1. **Administradores** - Controle total do sistema
2. **Usuários de Empresa** - Acesso limitado aos dados da própria empresa

## ⚠️ Resolução de Problemas

### Erro: "Unsupported field value: undefined"

Se você encontrar este erro durante o registro de usuários:

```
FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined (found in field companyId)
```

**Solução:**

1. **Limpe os dados problemáticos:**
   ```bash
   node cleanup-test-data.js
   ```

2. **Recrie os dados de teste:**
   ```bash
   node create-test-data.js
   ```

3. **O problema foi corrigido:** O sistema agora não salva campos `undefined` no Firestore

### Verificação de Integridade

Para verificar se seus dados estão corretos:
- Admins não devem ter campos `companyId` ou `companyName`
- Usuários de empresa devem ter ambos os campos preenchidos
- Nenhum documento deve conter valores `undefined`

## Tipos de Usuários

### 1. Administradores (`admin`)
- **Permissões**: Acesso completo ao sistema
- **Funcionalidades**:
  - Visualizar todos os shipments de todas as empresas
  - **Criar novos shipments** (exclusivo para admins)
  - Atribuir shipments às empresas
  - Gerenciar usuários (ativar/desativar/excluir)
  - Gerenciar empresas (ativar/desativar)
  - Acessar painel administrativo completo

### 2. Usuários de Empresa (`company_user`)
- **Permissões**: Acesso limitado aos dados da própria empresa
- **Funcionalidades**:
  - Visualizar apenas shipments da própria empresa
  - Editar shipments da própria empresa
  - Gerenciar configurações pessoais
  - **Não podem criar novos shipments** (apenas admins)

## Estrutura de Dados

### Usuários (`users` collection)
```typescript
// Para Administradores
interface AdminUser {
  uid: string;                    // ID único do usuário
  email: string;                  // Email de login
  displayName?: string;           // Nome para exibição
  role: 'admin';                  // Role de administrador
  isActive: boolean;              // Status ativo/inativo
  createdAt: Date;               // Data de criação
  lastLogin?: Date;              // Último login
  // Nota: Admins NÃO têm companyId ou companyName
}

// Para Usuários de Empresa
interface CompanyUser {
  uid: string;                    // ID único do usuário
  email: string;                  // Email de login
  displayName?: string;           // Nome para exibição
  role: 'company_user';           // Role de usuário de empresa
  companyId: string;              // ID da empresa (obrigatório)
  companyName: string;            // Nome da empresa (cache)
  isActive: boolean;              // Status ativo/inativo
  createdAt: Date;               // Data de criação
  lastLogin?: Date;              // Último login
}
```

### Empresas (`companies` collection)
```typescript
interface Company {
  id: string;                     // ID único da empresa
  name: string;                   // Nome da empresa
  code: string;                   // Código único (ex: LOG001)
  contactEmail: string;           // Email de contato
  phone?: string;                 // Telefone
  address?: string;               // Endereço
  createdAt: Date;               // Data de criação
  isActive: boolean;              // Status ativo/inativo
}
```

### Shipments (`shipments` collection)
```typescript
interface Shipment {
  // ... campos existentes ...
  companyId?: string;             // ID da empresa dona do shipment
  updatedAt?: Date;              // Data da última atualização
}
```

## Componentes Implementados

### 1. AuthContext (`src/context/auth-context.tsx`)
- Gerencia autenticação e autorização
- Carrega dados do usuário e empresa
- Fornece funções de verificação de permissões

### 2. ShipmentsContext (atualizado)
- Filtra shipments por empresa para usuários de empresa
- **Restringe criação de shipments apenas para admins**
- Verifica permissões antes de editar shipments
- Função `canCreateShipment()` retorna true apenas para admins

### 3. AdminPanel (`src/components/admin-panel/`)
- Interface para administradores gerenciarem usuários, empresas e shipments
- **Nova aba "Shipments"** para atribuir shipments às empresas
- Tabelas com informações detalhadas
- Ações para ativar/desativar/excluir

### 4. Registro de Usuários (atualizado)
- Seletor de tipo de usuário (Admin ou Empresa)
- Campos específicos para empresas
- Criação automática de empresas quando necessário
- **Correção**: Não salva campos undefined no Firestore

## Segurança (Firestore Rules)

```javascript
// Shipments: Apenas admins podem criar
match /shipments/{shipmentId} {
  allow read, write: if isAdmin();
  
  // Usuários de empresa podem apenas ler e atualizar da própria empresa
  allow read, update: if isAuthenticated() && 
    resource.data.companyId == getUserCompanyId();
  
  // Apenas admins podem criar novos shipments
  allow create: if isAdmin();
}
```

## Como Usar

### 1. Registro de Novo Usuário

1. Acesse a página de registro
2. Selecione o tipo de usuário:
   - **Usuário de Empresa**: Preencha dados da empresa
   - **Administrador**: Apenas dados pessoais
3. Complete o formulário e envie

### 2. Login

1. Use qualquer email dos usuários de teste
2. A senha é simulada (qualquer valor funciona)
3. O sistema carregará as permissões automaticamente

### 3. Painel Administrativo

**Apenas para Admins:**
1. Faça login como administrador
2. Acesse o painel através do menu/navbar
3. Gerencie usuários, empresas e shipments nas abas correspondentes

### 4. Gestão de Shipments (Admin)

**Apenas admins podem:**
- Criar novos shipments
- Atribuir shipments existentes às empresas
- Visualizar todos os shipments do sistema

**Na aba "Shipments" do painel admin:**
- Veja todos os shipments
- Atribua cada shipment a uma empresa específica
- Ou deixe como "Não atribuído" se necessário

## Dados de Teste

Execute o script para criar dados de teste:

```bash
node create-test-data.js
```

Se houver problemas com dados existentes, primeiro execute:

```bash
node cleanup-test-data.js
```

### Credenciais de Teste:

**Admin:**
- Email: `admin@sealogistics.com`

**Usuários de Empresa:**
- Email: `carlos@logisticsexpress.com` (Logistics Express)
- Email: `maria@logisticsexpress.com` (Logistics Express)
- Email: `joao@maritimacargo.com` (MarítimaCargo)

## Funcionalidades por Tipo de Usuário

| Funcionalidade | Admin | Usuário Empresa |
|---|:---:|:---:|
| Ver todos os shipments | ✅ | ❌ |
| Ver shipments da própria empresa | ✅ | ✅ |
| **Criar shipments** | ✅ | ❌ |
| Editar qualquer shipment | ✅ | ❌ |
| Editar shipments da própria empresa | ✅ | ✅ |
| Atribuir shipments às empresas | ✅ | ❌ |
| Gerenciar usuários | ✅ | ❌ |
| Gerenciar empresas | ✅ | ❌ |
| Acessar painel administrativo | ✅ | ❌ |

## Fluxo de Trabalho Recomendado

1. **Admin cria novos shipments** (página "Novo Envio")
2. **Admin atribui shipments às empresas** (painel administrativo)
3. **Usuários de empresa visualizam e editam** apenas os shipments atribuídos à sua empresa
4. **Admin monitora todas as atividades** através do painel administrativo

## Próximos Passos

1. **Implementar Firebase Auth real** (atualmente simulado)
2. **Adicionar mais campos de empresa** (CNPJ, inscrição estadual, etc.)
3. **Implementar notificações** quando shipments são atribuídos às empresas
4. **Adicionar filtros avançados** no painel administrativo
5. **Implementar logs de auditoria** (quem criou/editou cada shipment)
6. **Adicionar dashboard específico** para cada tipo de usuário
7. **Implementar sistema de convites** (admins convidam usuários de empresa)

## Considerações de Produção

⚠️ **Importante**: Este sistema usa autenticação simulada para desenvolvimento. Para produção:

1. Implementar Firebase Authentication
2. Adicionar validação de senha forte
3. Implementar recuperação de senha
4. Adicionar autenticação de dois fatores
5. Configurar limites de rate limiting
6. Implementar logs de auditoria detalhados
7. Configurar backup automático dos dados
8. **Implementar notificações** quando shipments são atribuídos às empresas 