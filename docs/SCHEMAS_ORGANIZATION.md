# Organização de Schemas no Banco de Dados

## 📋 Visão Geral

O sistema Nexflow utiliza uma arquitetura de múltiplos schemas para organizar as tabelas do banco de dados. Esta organização facilita a manutenção, escalabilidade e separação de responsabilidades.

## 🗂️ Schemas Utilizados

### 1. Schema `public` (Padrão)

**Propósito**: Tabelas do sistema base e módulo CRM.

**Tabelas Core (`core_*`)**:
- `core_clients` - Clientes do sistema (multi-tenant)
- `core_client_users` - Usuários do sistema
- `core_teams` - Times/equipes
- `core_team_members` - Membros dos times
- `core_licenses` - Licenças do sistema
- `core_client_license` - Licenças dos clientes
- `core_indications` - Indicações do módulo Hunters

**Tabelas Web/CRM (`web_*`)**:
- `web_companies` - Empresas cadastradas
- `web_people` - Pessoas/contatos
- `web_deals` - Negócios/oportunidades
- `web_products` - Produtos cadastrados
- `web_funnels` - Funis de vendas
- `web_funnel_stages` - Estágios dos funis
- `web_tasks` - Tarefas
- `web_flows` - Flows do sistema antigo (legado)

**Tabelas de Comissão (novas)**:
- `core_team_levels` - Níveis hierárquicos dos times
- `core_team_member_levels` - Vinculação membro-nível
- `core_team_commissions` - Configuração de comissões
- `web_deal_items` - Itens vendidos em negócios
- `core_commission_calculations` - Cálculos de comissão
- `core_commission_distributions` - Distribuição de comissões

### 2. Schema `nexflow`

**Propósito**: Tabelas do módulo Nexflow (sistema de flows moderno).

**Tabelas Principais**:
- `nexflow.flows` - Flows do sistema
- `nexflow.steps` - Etapas dos flows
- `nexflow.cards` - Cards dentro dos flows
- `nexflow.step_fields` - Campos das etapas
- `nexflow.step_child_card_automations` - Automações
- `nexflow.flow_team_access` - Acesso por time
- `nexflow.flow_user_exclusions` - Exclusões de usuários

**Tabelas de Notificações**:
- `nexflow.notifications` - Notificações do sistema
- `nexflow.user_notification_settings` - Configurações de notificação
- `nexflow.card_messages` - Mensagens nos cards
- `nexflow.card_message_attachments` - Anexos de mensagens
- `nexflow.card_attachments` - Anexos dos cards

**Tabelas de Integração**:
- `nexflow.opportunity_automations` - Automações de oportunidades
- `nexflow.card_step_actions` - Ações dos cards

## 🔗 Relacionamentos Entre Schemas

### Referências Cross-Schema

Quando uma tabela de um schema precisa referenciar uma tabela de outro schema, usa-se a sintaxe completa:

```sql
-- Exemplo: Tabela no schema nexflow referenciando tabela no schema public
CREATE TABLE nexflow.flow_team_access (
    team_id UUID NOT NULL REFERENCES public.core_teams(id) ON DELETE CASCADE
);
```

### Padrão de Nomenclatura

- **Tabelas no schema `public`**: Não precisam prefixo de schema (é o padrão)
- **Tabelas no schema `nexflow`**: Sempre usam prefixo `nexflow.`

## 📝 Convenções

### 1. Quando usar `public`?

Use o schema `public` para:
- Tabelas relacionadas ao sistema base (core)
- Tabelas do módulo CRM (web)
- Tabelas que referenciam `core_clients`, `core_client_users`, `core_teams`
- Tabelas relacionadas a negócios, produtos, empresas

### 2. Quando usar `nexflow`?

Use o schema `nexflow` para:
- Tabelas relacionadas ao módulo de flows
- Tabelas de notificações do sistema
- Tabelas que referenciam `nexflow.flows`, `nexflow.steps`, `nexflow.cards`
- Funcionalidades específicas do módulo Nexflow

### 3. Referências

- **Dentro do mesmo schema**: Não precisa prefixo
  ```sql
  CREATE TABLE public.core_team_levels (
      team_id UUID REFERENCES core_teams(id)  -- Sem prefixo
  );
  ```

- **Entre schemas diferentes**: Precisa prefixo completo
  ```sql
  CREATE TABLE nexflow.flow_team_access (
      team_id UUID REFERENCES public.core_teams(id)  -- Com prefixo
  );
  ```

## 🔍 Exemplos do Código

### Exemplo 1: Tabela no schema public
```sql
-- supabase/migrations/20250127_create_commission_system.sql
CREATE TABLE core_team_levels (
    team_id UUID NOT NULL REFERENCES core_teams(id)  -- Sem prefixo
);
```

### Exemplo 2: Tabela no schema nexflow
```sql
-- supabase/migrations/20250610_create_flow_visibility_tables.sql
CREATE TABLE IF NOT EXISTS nexflow.flow_team_access (
    team_id UUID NOT NULL REFERENCES public.core_teams(id)  -- Com prefixo
);
```

### Exemplo 3: Função usando ambos os schemas
```sql
CREATE OR REPLACE FUNCTION nexflow.notify_card_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- Usa tabelas do schema nexflow
    FROM nexflow.cards c
    JOIN nexflow.flows f ON c.flow_id = f.id
    
    -- Usa tabelas do schema public
    FROM public.core_client_users cu
    WHERE cu.id = NEW.assigned_to;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 Decisão para Sistema de Comissões

**Decisão**: Todas as tabelas de comissão foram criadas no schema `public` porque:

1. ✅ Referenciam tabelas do schema `public`:
   - `core_teams` (public)
   - `core_client_users` (public)
   - `web_deals` (public)
   - `web_products` (public)

2. ✅ Seguem o padrão das tabelas relacionadas:
   - `core_team_levels` segue o padrão de `core_teams`
   - `web_deal_items` segue o padrão de `web_deals`

3. ✅ Não são específicas do módulo Nexflow:
   - Comissões são uma funcionalidade do CRM, não do módulo de flows

## 📚 Referências no Código TypeScript

No arquivo `src/types/database.ts`, os schemas são organizados assim:

```typescript
export interface Database {
  public: {
    Tables: {
      core_clients: { ... },
      core_teams: { ... },
      web_deals: { ... },
      // ...
    }
  },
  nexflow: {
    Tables: {
      flows: { ... },
      steps: { ... },
      cards: { ... },
      // ...
    }
  }
}
```

## ✅ Checklist ao Criar Novas Tabelas

- [ ] Identificar qual schema usar (`public` ou `nexflow`)
- [ ] Verificar tabelas relacionadas (mesmo schema = sem prefixo)
- [ ] Verificar referências cross-schema (usar prefixo completo)
- [ ] Atualizar tipos TypeScript em `src/types/database.ts`
- [ ] Documentar a decisão de schema escolhido

---

**Última Atualização**: 2025-01-27  
**Versão**: 1.0
