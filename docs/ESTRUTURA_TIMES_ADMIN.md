# Estrutura de Times no Portal Admin

## 📋 Visão Geral

Este documento descreve a estrutura real de times no banco de dados, verificada através do MCP Supabase.

## 🗂️ Estrutura de Tabelas

### Schema `public`

#### `core_teams`
Tabela principal de times/equipes.

**Campos:**
- `id` (UUID, PK) - Identificador único
- `client_id` (UUID, NOT NULL) - Cliente (multi-tenant)
- `name` (TEXT, NOT NULL) - Nome do time
- `description` (TEXT, NULLABLE) - Descrição do time
- `created_at` (TIMESTAMPTZ) - Data de criação
- `updated_at` (TIMESTAMPTZ) - Data de atualização
- `is_active` (BOOLEAN, DEFAULT true) - Status ativo/inativo

**Relacionamentos:**
- `core_team_members` → `core_teams` (team_id)
- `nexflow.flow_team_access` → `core_teams` (team_id)
- `nexflow.step_team_access` → `core_teams` (team_id)
- `nexflow.opportunities` → `core_teams` (assigned_team_id)
- `nexflow.steps` → `core_teams` (responsible_team_id)
- `nexflow.cards` → `core_teams` (assigned_team_id)

#### `core_team_members`
Tabela de membros dos times.

**Campos:**
- `id` (UUID, PK) - Identificador único
- `team_id` (UUID, NOT NULL) - Referência ao time
- `user_profile_id` (UUID, NOT NULL) - Referência ao usuário (`core_client_users.id`)
- `role` (team_role_type, NOT NULL, DEFAULT 'member') - Papel no time
  - Valores possíveis: `'admin'`, `'leader'`, `'member'`
- `added_at` (TIMESTAMPTZ) - Data de adição ao time
- `added_by` (UUID, NULLABLE) - Usuário que adicionou o membro

**Relacionamentos:**
- `core_team_members.team_id` → `core_teams.id`
- `core_team_members.user_profile_id` → `core_client_users.id`

**Observações Importantes:**
- O campo `role` é específico do time (não confundir com `core_client_users.role`)
- Um usuário pode ter diferentes roles em diferentes times
- O tipo `team_role_type` é um ENUM definido no banco

### Schema `nexflow`

#### `flow_team_access`
Acesso de times a flows específicos.

**Campos:**
- `id` (UUID, PK)
- `flow_id` (UUID, NOT NULL) - Referência ao flow
- `team_id` (UUID, NOT NULL) - Referência ao time (`public.core_teams`)
- `created_at` (TIMESTAMPTZ)

**Relacionamento Cross-Schema:**
```sql
team_id UUID NOT NULL REFERENCES public.core_teams(id) ON DELETE CASCADE
```

#### `step_team_access`
Acesso de times a steps específicos.

**Campos:**
- `id` (UUID, PK)
- `step_id` (UUID, NOT NULL) - Referência ao step
- `team_id` (UUID, NOT NULL) - Referência ao time (`public.core_teams`)
- `created_at` (TIMESTAMPTZ)

**Relacionamento Cross-Schema:**
```sql
team_id UUID NOT NULL REFERENCES public.core_teams(id) ON DELETE CASCADE
```

## 🔍 Análise dos Dados Reais

### Estrutura Atual

1. **Times (`core_teams`)**:
   - ✅ Existe no schema `public`
   - ✅ Tem campo `is_active` para controle
   - ✅ Multi-tenant via `client_id`
   - ❌ Não tem campos de comissão padrão (será adicionado)

2. **Membros (`core_team_members`)**:
   - ✅ Existe no schema `public`
   - ✅ Tem sistema de roles específicos do time (`admin`, `leader`, `member`)
   - ✅ Vincula usuários aos times
   - ❌ Não tem sistema de níveis hierárquicos (será adicionado)

3. **Integração com Nexflow**:
   - ✅ Times podem ter acesso a flows (`flow_team_access`)
   - ✅ Times podem ter acesso a steps (`step_team_access`)
   - ✅ Cards podem ser atribuídos a times (`cards.assigned_team_id`)
   - ✅ Oportunidades podem ser atribuídas a times (`opportunities.assigned_team_id`)

## 📊 Diferenças entre Roles

### `core_client_users.role` (Global)
Roles globais do sistema:
- `'administrator'` - Administrador do cliente
- `'closer'` - Closer/Vendedor
- `'partnership_director'` - Diretor de Parcerias
- `'partner'` - Parceiro

### `core_team_members.role` (Específico do Time)
Roles dentro de um time específico:
- `'admin'` - Administrador do time
- `'leader'` - Líder do time
- `'member'` - Membro do time

**Importante**: Um usuário pode ser `'closer'` globalmente, mas `'leader'` em um time específico.

## 🎯 Implicações para Sistema de Comissões

### O que já existe:
- ✅ Estrutura de times funcional
- ✅ Sistema de membros com roles
- ✅ Integração com negócios (via `nexflow.cards.assigned_team_id`)

### O que precisa ser adicionado:
- ❌ Níveis hierárquicos dentro dos times (`core_team_levels`)
- ❌ Vinculação de membros a níveis (`core_team_member_levels`)
- ❌ Configuração de comissões por time (`core_team_commissions`)
- ❌ Campo `team_id` em `web_deals` (para vincular negócios a times)

### Decisões de Arquitetura:

1. **Níveis vs Roles**:
   - **Roles** (`core_team_members.role`): Papéis funcionais (admin, leader, member)
   - **Níveis** (`core_team_levels`): Níveis hierárquicos para comissão (Líder, Sênior, Pleno, Júnior)
   - Um membro pode ter um role E um nível

2. **Vinculação de Negócios a Times**:
   - Opção 1: Adicionar `team_id` em `web_deals` (recomendado)
   - Opção 2: Usar `responsible_id` e buscar time do responsável
   - Opção 3: Usar `nexflow.cards.assigned_team_id` quando o negócio vier de um card

3. **Produtos**:
   - Tabela `web_products` existe no schema `public`
   - Precisa adicionar campo `product_code` para identificação rápida

## 📝 Queries Úteis

### Buscar times de um cliente
```sql
SELECT * FROM core_teams 
WHERE client_id = '...' 
AND is_active = true;
```

### Buscar membros de um time
```sql
SELECT 
    ctm.*,
    ccu.name,
    ccu.email,
    ccu.role as global_role
FROM core_team_members ctm
JOIN core_client_users ccu ON ctm.user_profile_id = ccu.id
WHERE ctm.team_id = '...';
```

### Buscar times com acesso a um flow
```sql
SELECT 
    ct.*,
    fta.flow_id
FROM core_teams ct
JOIN nexflow.flow_team_access fta ON ct.id = fta.team_id
WHERE fta.flow_id = '...';
```

## 📊 Estrutura de `web_deals`

**Campos Relevantes Verificados:**
- `id` (UUID, PK)
- `client_id` (UUID) - Multi-tenant
- `title` (TEXT) - Título do negócio
- `value` (NUMERIC) - Valor do negócio
- `responsible_id` (UUID) - Referência a `core_client_users.id`
- `company_id` (UUID) - Referência a `web_companies.id`
- `person_id` (UUID) - Referência a `web_people.id`
- `stage_id` (UUID) - Referência a `web_flow_stages.id`
- `flow_id` (UUID) - Referência a `web_flows.id`

**Campos Faltando:**
- ❌ `team_id` - Precisa ser adicionado para vincular negócio ao time

**Observação:**
- Atualmente, o negócio está vinculado apenas ao `responsible_id` (usuário)
- Para o sistema de comissões, precisamos vincular também ao time

## 📦 Estrutura de Produtos

**Status:** ⚠️ A tabela `web_products` **NÃO EXISTE** no banco de dados atual.

**Ação Necessária:**
- ✅ Criar tabela `web_products` conforme `scripts/migration_simplificacao.sql`
- ✅ Adicionar campo `product_code` para identificação rápida (ex: "XPTO")
- ✅ Campos sugeridos:
  - `id` (UUID, PK)
  - `client_id` (UUID) - Multi-tenant
  - `name` (TEXT) - Nome do produto
  - `description` (TEXT) - Descrição
  - `price` (DECIMAL) - Preço
  - `category` (VARCHAR) - Categoria ('course', 'product', 'real_estate', 'other')
  - `product_code` (VARCHAR) - Código único do produto
  - `metadata` (JSONB) - Dados adicionais

## ✅ Checklist para Implementação

- [x] Verificar estrutura existente de times
- [x] Identificar relacionamentos com outros módulos
- [x] Verificar estrutura de `web_deals`
- [ ] Verificar/criar tabela `web_products`
- [ ] Adicionar campo `team_id` em `web_deals`
- [ ] Criar tabela `core_team_levels`
- [ ] Criar tabela `core_team_member_levels`
- [ ] Criar tabela `core_team_commissions`
- [ ] Adicionar campo `product_code` em `web_products`
- [ ] Criar tabela `web_deal_items`
- [ ] Criar tabelas de cálculo e distribuição de comissões

---

**Data da Verificação**: 2025-01-27  
**Método**: MCP Supabase  
**Status**: Estrutura Base Confirmada ✅
