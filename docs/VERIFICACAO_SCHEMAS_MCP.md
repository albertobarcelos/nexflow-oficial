# Verificação de Schemas via MCP Supabase

## 📋 Resumo Executivo

Este documento apresenta os resultados da verificação dos schemas `public` e `nexflow` no banco de dados usando o MCP (Model Context Protocol) do Supabase.

**Data da Verificação**: 2025-01-27  
**Método**: MCP Supabase (`mcp_supabase_list_tables` e `mcp_supabase_execute_sql`)

---

## ✅ Estruturas Confirmadas

### Schema `public`

#### 1. `core_teams` ✅
- **Status**: Existe e está funcional
- **Campos**: `id`, `client_id`, `name`, `description`, `created_at`, `updated_at`, `is_active`
- **Relacionamentos**: 
  - Referenciado por `core_team_members`
  - Referenciado por `nexflow.flow_team_access`
  - Referenciado por `nexflow.step_team_access`
  - Referenciado por `nexflow.cards` (assigned_team_id)
  - Referenciado por `nexflow.opportunities` (assigned_team_id)
  - Referenciado por `nexflow.steps` (responsible_team_id)

#### 2. `core_team_members` ✅
- **Status**: Existe e está funcional
- **Campos**: `id`, `team_id`, `user_profile_id`, `role`, `added_at`, `added_by`
- **Tipo `role`**: ENUM `team_role_type` com valores: `'admin'`, `'leader'`, `'member'`
- **Relacionamentos**:
  - `team_id` → `core_teams.id`
  - `user_profile_id` → `core_client_users.id`

#### 3. `web_deals` ✅
- **Status**: Existe e está funcional
- **Campos Relevantes**: `id`, `client_id`, `title`, `value`, `responsible_id`, `company_id`, `person_id`, `stage_id`, `flow_id`
- **Faltando**: Campo `team_id` (precisa ser adicionado)

#### 4. `web_products` ❌
- **Status**: **NÃO EXISTE** no banco de dados
- **Ação**: Precisa ser criada conforme `scripts/migration_simplificacao.sql`

### Schema `nexflow`

#### 1. `flow_team_access` ✅
- **Status**: Existe
- **Função**: Controla acesso de times a flows específicos
- **Relacionamento Cross-Schema**: `team_id` → `public.core_teams.id`

#### 2. `step_team_access` ✅
- **Status**: Existe
- **Função**: Controla acesso de times a steps específicos
- **Relacionamento Cross-Schema**: `team_id` → `public.core_teams.id`

---

## 🔍 Descobertas Importantes

### 1. Sistema de Roles Duplo

O sistema possui **dois níveis de roles**:

**Global (`core_client_users.role`)**:
- `'administrator'`
- `'closer'`
- `'partnership_director'`
- `'partner'`

**Por Time (`core_team_members.role`)**:
- `'admin'` - Administrador do time
- `'leader'` - Líder do time
- `'member'` - Membro do time

**Implicação**: Um usuário pode ter diferentes roles em diferentes times, independente do role global.

### 2. Integração com Nexflow

Os times estão bem integrados com o módulo Nexflow:
- Times podem ter acesso a flows (`flow_team_access`)
- Times podem ter acesso a steps (`step_team_access`)
- Cards podem ser atribuídos a times (`cards.assigned_team_id`)
- Oportunidades podem ser atribuídas a times (`opportunities.assigned_team_id`)
- Steps podem ter times responsáveis (`steps.responsible_team_id`)

### 3. Relacionamentos Cross-Schema

O sistema usa corretamente referências cross-schema:
```sql
-- Exemplo: nexflow.flow_team_access referenciando public.core_teams
team_id UUID NOT NULL REFERENCES public.core_teams(id) ON DELETE CASCADE
```

---

## ⚠️ Itens Faltando para Sistema de Comissões

### Tabelas que Precisam ser Criadas:

1. ❌ `web_products` - Tabela de produtos
2. ❌ `core_team_levels` - Níveis hierárquicos dos times
3. ❌ `core_team_member_levels` - Vinculação membro-nível
4. ❌ `core_team_commissions` - Configuração de comissões
5. ❌ `web_deal_items` - Itens vendidos em negócios
6. ❌ `core_commission_calculations` - Cálculos de comissão
7. ❌ `core_commission_distributions` - Distribuição de comissões

### Campos que Precisam ser Adicionados:

1. ❌ `web_deals.team_id` - Vincular negócio ao time
2. ❌ `web_products.product_code` - Código do produto (ex: "XPTO")
3. ❌ `core_teams.default_commission_type` - Tipo de comissão padrão
4. ❌ `core_teams.default_commission_value` - Valor de comissão padrão

---

## 📊 Estrutura de Relacionamentos Confirmada

```
public.core_clients
    │
    ├── public.core_teams
    │   ├── public.core_team_members → public.core_client_users
    │   │
    │   └── nexflow.flow_team_access
    │   └── nexflow.step_team_access
    │   └── nexflow.cards (assigned_team_id)
    │   └── nexflow.opportunities (assigned_team_id)
    │   └── nexflow.steps (responsible_team_id)
    │
    ├── public.web_deals
    │   └── public.core_client_users (responsible_id)
    │   └── [FALTANDO: team_id]
    │
    └── [FALTANDO: web_products]
```

---

## ✅ Validações Realizadas

- [x] Verificar existência de `core_teams`
- [x] Verificar existência de `core_team_members`
- [x] Verificar estrutura de `web_deals`
- [x] Verificar relacionamentos cross-schema
- [x] Verificar integração com módulo Nexflow
- [x] Identificar campos faltando
- [x] Identificar tabelas faltando

---

## 🎯 Próximos Passos

1. **Criar tabela `web_products`** (se não existir)
2. **Adicionar campo `team_id` em `web_deals`**
3. **Executar migração de comissões** (`20250127_create_commission_system.sql`)
4. **Validar relacionamentos** após criação das tabelas
5. **Testar integração** com sistema existente

---

## 📝 Notas Técnicas

### Uso de Schemas

- **Schema `public`**: Tabelas core e CRM (padrão, sem prefixo)
- **Schema `nexflow`**: Tabelas do módulo Nexflow (com prefixo `nexflow.`)
- **Referências Cross-Schema**: Sempre usar prefixo completo (`public.core_teams`)

### Convenções Identificadas

- Tabelas core: `core_*` no schema `public`
- Tabelas web/CRM: `web_*` no schema `public`
- Tabelas Nexflow: `*` no schema `nexflow`
- Multi-tenancy: Todas as tabelas têm `client_id`

---

**Verificação Completa**: ✅  
**Pronto para Implementação**: ⚠️ (Aguardando criação de `web_products`)
