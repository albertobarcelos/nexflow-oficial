# 🏗️ Arquitetura CORE + WEB - Sistema Backstage

## 📋 Visão Geral

O sistema Backstage foi reestruturado seguindo uma arquitetura **CORE + WEB** que separa claramente as responsabilidades entre o sistema base (CORE) e os módulos específicos (WEB).

### 🎯 Princípios da Arquitetura

- **CORE**: Sistema base responsável por tenants, usuários, licenças e configurações globais
- **WEB**: Módulos específicos como CRM, com suas próprias entidades e funcionalidades
- **Multi-tenant**: Cada cliente (tenant) tem seus dados isolados
- **Escalável**: Facilita adição de novos módulos (WEB_VENDAS, WEB_ESTOQUE, etc.)

---

## 🗄️ Estrutura do Banco de Dados

### 📊 CORE Tables (Sistema Base)

#### `core_clients` (Tenants/Clientes)
```sql
- id: UUID (PK)
- name: VARCHAR(255) -- Nome do cliente
- company_name: VARCHAR(255) -- Razão social
- tenant_name: VARCHAR(100) -- Nome do tenant
- subdomain: VARCHAR(50) -- Subdomínio único
- email: VARCHAR(255)
- phone: VARCHAR(20)
- tax_id: VARCHAR(20) -- CNPJ/CPF
- address, city, state, postal_code, country
- plan: ENUM('free', 'premium')
- status: ENUM('active', 'inactive')
- settings: JSONB -- Configurações do tenant
- is_active: BOOLEAN
- created_at, updated_at
```

#### `core_licenses` (Planos Disponíveis)
```sql
- id: UUID (PK)
- name: VARCHAR(100) -- Nome do plano
- description: TEXT
- price_monthly: DECIMAL(10,2)
- price_yearly: DECIMAL(10,2)
- max_users: INTEGER
- max_companies: INTEGER
- max_contacts: INTEGER
- max_opportunities: INTEGER
- features: JSONB -- Recursos disponíveis
- is_active: BOOLEAN
- created_at, updated_at
```

#### `core_client_users` (Usuários do Tenant)
```sql
- id: UUID (PK)
- auth_user_id: UUID (FK -> auth.users)
- core_client_id: UUID (FK -> core_clients)
- name: VARCHAR(255)
- email: VARCHAR(255)
- user_role: VARCHAR(50)
- role: ENUM('administrator', 'closer', 'partnership_director', 'partner')
- permissions: JSONB
- license_id: UUID
- is_active: BOOLEAN
- last_login_at: TIMESTAMP
- last_access_at: TIMESTAMP
- created_at, updated_at
```

#### `core_client_license` (Licença do Cliente)
```sql
- id: UUID (PK)
- core_client_id: UUID (FK -> core_clients)
- core_license_id: UUID (FK -> core_licenses)
- type: ENUM('free', 'premium')
- status: ENUM('active', 'suspended', 'expired')
- start_date: TIMESTAMP
- expiration_date: TIMESTAMP
- user_limit: INTEGER
- auto_renew: BOOLEAN
- price: DECIMAL(10,2)
- currency: VARCHAR(3)
- subscription_id: VARCHAR(255)
- payment_status: VARCHAR(50)
- created_at, updated_at
```

### 🌐 WEB Tables (Módulo CRM)

#### `web_cities` (Cidades)
```sql
- id: UUID (PK)
- core_client_id: UUID (FK -> core_clients)
- name: VARCHAR(100)
- state: VARCHAR(2)
- country: VARCHAR(3)
- ibge_code: VARCHAR(10)
- created_at, updated_at
```

#### `web_companies` (Empresas)
```sql
- id: UUID (PK)
- core_client_id: UUID (FK -> core_clients)
- web_city_id: UUID (FK -> web_cities)
- name: VARCHAR(255)
- razao_social: VARCHAR(255)
- cnpj: VARCHAR(14)
- email: VARCHAR(255)
- telefone, celular, whatsapp: VARCHAR(20)
- website: VARCHAR(255)
- company_size: VARCHAR(20)
- industry: VARCHAR(100)
- status: VARCHAR(50)
- description: TEXT
- endereco completo (estado, cidade, cep, rua, numero, bairro, complemento)
- social_media: JSONB
- created_at, updated_at
```

#### `web_contacts` (Contatos/Pessoas)
```sql
- id: UUID (PK)
- core_client_id: UUID (FK -> core_clients)
- web_company_id: UUID (FK -> web_companies)
- name: VARCHAR(255)
- email: VARCHAR(255)
- phone, mobile, whatsapp: VARCHAR(20)
- position: VARCHAR(100) -- Cargo
- department: VARCHAR(100) -- Departamento
- notes: TEXT
- tags: JSONB
- custom_fields: JSONB
- is_primary_contact: BOOLEAN
- created_at, updated_at
```

#### `web_opportunities` (Oportunidades)
```sql
- id: UUID (PK)
- core_client_id: UUID (FK -> core_clients)
- web_company_id: UUID (FK -> web_companies)
- web_contact_id: UUID (FK -> web_contacts)
- title: VARCHAR(255)
- status: VARCHAR(50)
- value: DECIMAL(15,2)
- probability: INTEGER (0-100)
- expected_close_date: DATE
- closed_at: TIMESTAMP
- closed_by: UUID
- assigned_to: UUID
- source: VARCHAR(50)
- notes: TEXT
- tags: JSONB
- metadata: JSONB
- history: JSONB
- created_at, updated_at
```

#### `web_tasks` (Tarefas)
```sql
- id: UUID (PK)
- core_client_id: UUID (FK -> core_clients)
- web_company_id: UUID (FK -> web_companies)
- web_contact_id: UUID (FK -> web_contacts)
- web_opportunity_id: UUID (FK -> web_opportunities)
- title: VARCHAR(255)
- description: TEXT
- status: ENUM('todo', 'doing', 'done')
- priority: ENUM('low', 'medium', 'high')
- due_date: DATE
- completed_at: TIMESTAMP
- assigned_to: UUID
- created_by: UUID
- created_at, updated_at
```

---

## 🔐 Segurança (RLS - Row Level Security)

### Políticas Implementadas

Todas as tabelas WEB têm políticas RLS que garantem que:

1. **Isolamento por Tenant**: Usuários só veem dados do seu `core_client_id`
2. **Autenticação**: Apenas usuários autenticados podem acessar
3. **Permissões**: Baseadas no role do usuário

### Exemplo de Política RLS
```sql
CREATE POLICY "Usuários podem ver empresas do seu tenant" 
ON web_companies FOR SELECT 
USING (core_client_id IN (
  SELECT core_client_id 
  FROM core_client_users 
  WHERE auth_user_id = auth.uid()
));
```

---

## 🚀 Como Usar

### 1. Tipos TypeScript

```typescript
import { 
  CoreClient, 
  WebCompany, 
  WebContact,
  supabase 
} from '@/lib/supabase';

// Buscar empresas do tenant atual
const { data: companies } = await supabase
  .from('web_companies')
  .select('*');
```

### 2. Funções Auxiliares

```typescript
import { 
  getCurrentClientId,
  getCurrentUserWithClient,
  checkUserPermission 
} from '@/lib/supabase';

// Obter ID do cliente atual
const clientId = await getCurrentClientId();

// Obter dados completos do usuário
const userWithClient = await getCurrentUserWithClient();

// Verificar permissão
const canEdit = await checkUserPermission('edit_companies');
```

### 3. Queries Comuns

```typescript
// Buscar empresas com contatos
const { data } = await supabase
  .from('web_companies')
  .select(`
    *,
    web_contacts (*)
  `);

// Buscar oportunidades com empresa e contato
const { data } = await supabase
  .from('web_opportunities')
  .select(`
    *,
    web_companies (*),
    web_contacts (*)
  `);
```

---

## 📈 Vantagens da Arquitetura

### ✅ **Escalabilidade**
- Fácil adição de novos módulos (WEB_VENDAS, WEB_ESTOQUE)
- Separação clara de responsabilidades
- Estrutura modular

### ✅ **Multi-tenancy**
- Isolamento completo entre clientes
- Segurança por RLS
- Performance otimizada

### ✅ **Manutenibilidade**
- Código organizado por domínio
- Tipos TypeScript bem definidos
- Documentação clara

### ✅ **Flexibilidade**
- Configurações por tenant
- Permissões granulares
- Campos customizáveis (JSONB)

---

## 🔄 Migração

Para aplicar a nova estrutura:

1. **Execute a migração**:
   ```bash
   # Aplicar no Supabase
   psql -f migrations/019_restructure_core_web_architecture.sql
   ```

2. **Atualize o código**:
   - Use os novos tipos TypeScript
   - Atualize queries para usar novos nomes de tabela
   - Implemente funções auxiliares

3. **Teste a aplicação**:
   - Verifique se RLS está funcionando
   - Teste isolamento entre tenants
   - Valide permissões

---

## 🎯 Próximos Passos

1. **Implementar autenticação** com nova estrutura
2. **Migrar componentes** para usar novos tipos
3. **Adicionar novos módulos** (WEB_VENDAS, WEB_ESTOQUE)
4. **Implementar dashboard** multi-tenant
5. **Criar sistema de billing** baseado em licenças

---

## 📞 Suporte

Para dúvidas sobre a arquitetura:
- Consulte este documento
- Verifique os tipos TypeScript em `/src/types/database.ts`
- Analise as migrações em `/migrations/` 