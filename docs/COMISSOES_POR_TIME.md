# Análise e Documentação: Sistema de Comissões por Time

## 📋 Sumário Executivo

Este documento apresenta uma análise completa do código atual do sistema Nexflow e propõe a arquitetura para implementação de um sistema de comissões por time com as seguintes características:

- **Comissão por Time**: Cada time pode ter comissão definida por % ou valor fixo
- **Divisão Interna**: A comissão do time é distribuída internamente por percentuais
- **Níveis Hierárquicos**: Times possuem níveis e cada nível tem seu percentual de comissão
- **Vinculação a Produtos**: Cada cliente fechado com item específico (XPTO) tem comissão definida pelo time e distribuída internamente

---

## 🔍 Análise do Código Atual

### 0. Organização de Schemas

O sistema utiliza dois schemas principais:

- **Schema `public`**: 
  - Tabelas core: `core_clients`, `core_teams`, `core_client_users`, `core_team_members`
  - Tabelas web (CRM): `web_deals`, `web_products`, `web_companies`, `web_people`
  - Tabelas relacionadas ao sistema base e CRM

- **Schema `nexflow`**:
  - Tabelas do módulo de flows: `nexflow.flows`, `nexflow.steps`, `nexflow.cards`
  - Tabelas de notificações: `nexflow.notifications`, `nexflow.card_messages`
  - Tabelas relacionadas ao módulo Nexflow

**Decisão de Arquitetura**: As tabelas de comissão serão criadas no schema `public`, pois estão relacionadas a:
- `core_teams` (public)
- `core_client_users` (public)
- `web_deals` (public)
- `web_products` (public)

> 📖 **Para mais detalhes sobre a organização de schemas, consulte**: [`docs/SCHEMAS_ORGANIZATION.md`](./SCHEMAS_ORGANIZATION.md)

### 1. Estrutura de Times Existente

#### 1.1 Tabelas Identificadas

O sistema já possui uma estrutura básica de times:

- **`core_teams`**: Tabela principal de times
  - Schema: `public`
  - Campos identificados: `id`, `name`, `description`, `client_id`, `is_active`
  - Localização: Referenciada em `src/hooks/useOrganizationTeams.ts` e `src/components/admin/users/CreateTeamDialog.tsx`
  - Portal Admin: Gerenciada em `src/components/admin/users/TeamsTab.tsx`

- **`core_team_members`**: Tabela de membros dos times
  - Schema: `public`
  - Campos identificados: `team_id`, `user_profile_id`, `role`
  - Relacionamento: Vincula usuários (`core_client_users`) aos times
  - Roles: `'leader'`, `'admin'` (específicos do time)
  
> 📖 **Para detalhes completos sobre a estrutura de times no portal admin, consulte**: [`docs/ESTRUTURA_TIMES_ADMIN.md`](./ESTRUTURA_TIMES_ADMIN.md)

#### 1.2 Componentes Relacionados

- `src/components/crm/settings/TeamSettings.tsx`: Visualização de times do usuário
- `src/hooks/useOrganizationTeams.ts`: Hook para buscar times da organização
- `src/hooks/useTeamMembers.ts`: Hook para gerenciar membros de times
- `src/components/admin/users/CreateTeamDialog.tsx`: Criação/edição de times

#### 1.3 Limitações Atuais

- Não há sistema de níveis hierárquicos dentro dos times
- Não há vinculação de comissões aos times
- Não há sistema de distribuição de comissões

### 2. Estrutura de Negócios/Oportunidades

#### 2.1 Tabelas Identificadas

- **`web_deals`**: Tabela principal de negócios/oportunidades
  - Campos relevantes:
    - `id`: Identificador único
    - `client_id`: Cliente (multi-tenant)
    - `title`: Título do negócio
    - `value`: Valor do negócio
    - `company_id`: Empresa relacionada
    - `person_id`: Pessoa relacionada
    - `responsible_id`: Responsável pelo negócio
    - `stage_id`: Estágio do funil
    - `funnel_id`: Funil relacionado
    - `status`: Status do negócio (implícito pelo estágio)

- **`web_opportunities`**: Tabela de oportunidades (alternativa)
  - Campos: `id`, `client_id`, `pipeline_id`, `stage_id`, `name`, `value`, `status`

#### 2.2 Status de Fechamento

O sistema utiliza estágios de funil (`web_funnel_stages`) para determinar o status:
- Estágios finais podem ser marcados como `won` (ganho) ou `lost` (perdido)
- Não há campo explícito de "fechado" na tabela `web_deals`

### 3. Estrutura de Produtos

#### 3.1 Tabelas Identificadas

- **`web_products`**: ⚠️ **Tabela NÃO EXISTE no banco de dados atual**
  - Referenciada em `scripts/migration_simplificacao.sql` (migração pendente)
  - Campos planejados: `id`, `name`, `description`, `price`, `category`, `metadata`, `client_id`
  - Categorias: `'course'`, `'product'`, `'real_estate'`, `'other'`
  - **Ação necessária**: Criar tabela antes de implementar sistema de comissões

#### 3.2 Limitações Atuais

- ⚠️ **Tabela `web_products` não existe** - precisa ser criada
- **Não há vinculação entre produtos e negócios fechados**
- Não há tabela de itens de venda (line items) para um negócio
- Não há identificação de produtos específicos (como "XPTO") em negócios
- `web_deals` não tem campo `team_id` - precisa ser adicionado

### 4. Estrutura de Usuários

#### 4.1 Tabelas Identificadas

- **`core_client_users`**: Tabela principal de usuários
  - Campos relevantes:
    - `id`: Identificador único
    - `client_id`: Cliente (multi-tenant)
    - `email`: Email do usuário
    - `role`: Papel do usuário (`'administrator' | 'closer' | 'partnership_director' | 'partner'`)
    - `name`, `surname`: Nome completo
    - `is_active`: Status ativo/inativo

#### 4.2 Níveis e Hierarquia

- **Não há sistema de níveis hierárquicos** dentro dos times
- Apenas roles globais existem (`administrator`, `closer`, etc.)
- Não há percentuais de comissão por nível

---

## 🏗️ Proposta de Arquitetura

### 1. Estrutura de Banco de Dados

#### 1.1 Novas Tabelas Necessárias

##### `core_team_levels`
Armazena os níveis hierárquicos dentro de um time.

```sql
CREATE TABLE core_team_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Líder", "Sênior", "Pleno", "Júnior"
  level_order INTEGER NOT NULL, -- Ordem hierárquica (1 = mais alto)
  commission_percentage DECIMAL(5,2) NOT NULL, -- Percentual de comissão deste nível
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, level_order)
);

CREATE INDEX idx_team_levels_team_id ON core_team_levels(team_id);
CREATE INDEX idx_team_levels_client_id ON core_team_levels(client_id);
```

##### `core_team_member_levels`
Vincula membros do time aos seus níveis.

```sql
CREATE TABLE core_team_member_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID NOT NULL, -- Referência a core_team_members
  level_id UUID NOT NULL REFERENCES core_team_levels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core_client_users(id) ON DELETE CASCADE,
  effective_from TIMESTAMPTZ DEFAULT NOW(), -- Data de início do nível
  effective_to TIMESTAMPTZ, -- Data de término (NULL = ativo)
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_member_levels_member ON core_team_member_levels(team_member_id);
CREATE INDEX idx_team_member_levels_user ON core_team_member_levels(user_id);
CREATE INDEX idx_team_member_levels_level ON core_team_member_levels(level_id);
```

##### `core_team_commissions`
Define as comissões por time e produto.

```sql
CREATE TABLE core_team_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  product_id UUID REFERENCES web_products(id) ON DELETE SET NULL, -- NULL = todos os produtos
  product_code VARCHAR(100), -- Código do produto (ex: "XPTO") para busca rápida
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('percentage', 'fixed')), -- % ou valor fixo
  commission_value DECIMAL(10,2) NOT NULL, -- Valor da comissão (% ou R$)
  is_active BOOLEAN DEFAULT TRUE,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, product_id, product_code)
);

CREATE INDEX idx_team_commissions_team ON core_team_commissions(team_id);
CREATE INDEX idx_team_commissions_product ON core_team_commissions(product_id);
CREATE INDEX idx_team_commissions_code ON core_team_commissions(product_code);
```

##### `web_deal_items`
Itens vendidos em um negócio (produtos/serviços).

```sql
CREATE TABLE web_deal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES web_deals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES web_products(id) ON DELETE SET NULL,
  product_code VARCHAR(100), -- Código do produto (ex: "XPTO")
  product_name VARCHAR(255) NOT NULL, -- Nome do produto (snapshot)
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL, -- quantity * unit_price
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_items_deal ON web_deal_items(deal_id);
CREATE INDEX idx_deal_items_product ON web_deal_items(product_id);
CREATE INDEX idx_deal_items_code ON web_deal_items(product_code);
```

##### `core_commission_calculations`
Registra os cálculos de comissão realizados.

```sql
CREATE TABLE core_commission_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES web_deals(id) ON DELETE CASCADE,
  deal_item_id UUID REFERENCES web_deal_items(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  product_code VARCHAR(100), -- Código do produto (ex: "XPTO")
  
  -- Comissão do time
  team_commission_type VARCHAR(20) NOT NULL, -- 'percentage' ou 'fixed'
  team_commission_value DECIMAL(10,2) NOT NULL,
  team_commission_amount DECIMAL(10,2) NOT NULL, -- Valor calculado da comissão do time
  
  -- Distribuição interna
  total_distributed_percentage DECIMAL(5,2) NOT NULL, -- Soma dos % distribuídos
  total_distributed_amount DECIMAL(10,2) NOT NULL, -- Soma dos valores distribuídos
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES core_client_users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commission_calc_deal ON core_commission_calculations(deal_id);
CREATE INDEX idx_commission_calc_team ON core_commission_calculations(team_id);
CREATE INDEX idx_commission_calc_status ON core_commission_calculations(status);
```

##### `core_commission_distributions`
Distribuição da comissão entre os membros do time.

```sql
CREATE TABLE core_commission_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES core_commission_calculations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core_client_users(id) ON DELETE CASCADE,
  level_id UUID REFERENCES core_team_levels(id) ON DELETE SET NULL,
  
  -- Distribuição
  distribution_percentage DECIMAL(5,2) NOT NULL, -- % que este usuário recebe
  distribution_amount DECIMAL(10,2) NOT NULL, -- Valor que este usuário recebe
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commission_dist_calc ON core_commission_distributions(calculation_id);
CREATE INDEX idx_commission_dist_user ON core_commission_distributions(user_id);
CREATE INDEX idx_commission_dist_status ON core_commission_distributions(status);
```

#### 1.2 Alterações em Tabelas Existentes

##### `core_teams`
Adicionar campos para configuração de comissão padrão:

```sql
ALTER TABLE core_teams
ADD COLUMN default_commission_type VARCHAR(20) CHECK (default_commission_type IN ('percentage', 'fixed')),
ADD COLUMN default_commission_value DECIMAL(10,2);
```

##### `web_deals`
Adicionar campo para identificar time responsável:

```sql
ALTER TABLE web_deals
ADD COLUMN team_id UUID REFERENCES core_teams(id) ON DELETE SET NULL;

CREATE INDEX idx_deals_team ON web_deals(team_id);
```

##### `web_products`
Adicionar campo de código do produto:

```sql
ALTER TABLE web_products
ADD COLUMN product_code VARCHAR(100) UNIQUE;

CREATE INDEX idx_products_code ON web_products(product_code);
```

### 2. Lógica de Negócio

#### 2.1 Fluxo de Cálculo de Comissão

```
1. Cliente fecha negócio (deal) com status "won"
   ↓
2. Sistema identifica itens do negócio (web_deal_items)
   ↓
3. Para cada item com código "XPTO" (ou outro código configurado):
   ↓
4. Sistema identifica o time responsável pelo negócio (web_deals.team_id)
   ↓
5. Sistema busca comissão do time para aquele produto (core_team_commissions)
   ↓
6. Calcula comissão do time:
   - Se commission_type = 'percentage': team_commission = total_price * (commission_value / 100)
   - Se commission_type = 'fixed': team_commission = commission_value
   ↓
7. Cria registro em core_commission_calculations
   ↓
8. Busca membros ativos do time e seus níveis
   ↓
9. Distribui comissão internamente:
   - Para cada membro, busca seu nível e percentual
   - Calcula: member_commission = team_commission * (level.commission_percentage / 100)
   ↓
10. Cria registros em core_commission_distributions
    ↓
11. Valida que soma dos percentuais não excede 100%
```

#### 2.2 Regras de Negócio

1. **Comissão por Time**:
   - Pode ser definida por produto específico (via `product_id` ou `product_code`)
   - Pode ser definida como padrão para todos os produtos (sem `product_id` e sem `product_code`)
   - Prioridade: produto específico > código específico > padrão do time

2. **Divisão Interna**:
   - Cada membro do time tem um nível atribuído
   - Cada nível tem um percentual de comissão
   - A soma dos percentuais dos membros ativos não deve exceder 100%
   - Se exceder, o sistema deve alertar ou normalizar

3. **Validações**:
   - Negócio deve estar fechado (status "won")
   - Time deve estar ativo
   - Produto deve existir (se especificado)
   - Membros devem estar ativos no time
   - Níveis devem estar ativos

### 3. Estrutura de Código

#### 3.1 Novos Hooks Necessários

##### `useTeamCommissions.ts`
```typescript
// Gerenciar comissões de times
- getTeamCommissions(teamId)
- createTeamCommission(data)
- updateTeamCommission(id, data)
- deleteTeamCommission(id)
```

##### `useTeamLevels.ts`
```typescript
// Gerenciar níveis de times
- getTeamLevels(teamId)
- createTeamLevel(data)
- updateTeamLevel(id, data)
- deleteTeamLevel(id)
- assignLevelToMember(memberId, levelId)
```

##### `useCommissionCalculations.ts`
```typescript
// Calcular e gerenciar comissões
- calculateCommission(dealId)
- getCommissionCalculations(filters)
- approveCommission(calculationId)
- payCommission(calculationId)
```

##### `useDealItems.ts`
```typescript
// Gerenciar itens de negócios
- getDealItems(dealId)
- addDealItem(dealId, item)
- updateDealItem(id, item)
- removeDealItem(id)
```

#### 3.2 Novos Componentes Necessários

##### `TeamCommissionSettings.tsx`
- Configurar comissões por time e produto
- Listar comissões existentes
- Criar/editar/excluir comissões

##### `TeamLevelsManager.tsx`
- Gerenciar níveis hierárquicos do time
- Definir percentuais por nível
- Atribuir níveis aos membros

##### `DealItemsManager.tsx`
- Adicionar/editar itens em um negócio
- Selecionar produtos
- Definir quantidades e preços

##### `CommissionCalculator.tsx`
- Visualizar cálculo de comissão
- Aprovar comissões
- Marcar como pago

##### `CommissionReport.tsx`
- Relatório de comissões por time
- Relatório de comissões por usuário
- Filtros por período, time, status

#### 3.3 Novas Edge Functions

##### `calculate-commission`
```typescript
// Função para calcular comissão quando um negócio é fechado
// Trigger: Quando web_deals.status muda para "won"
// Ações:
// 1. Buscar itens do negócio
// 2. Identificar time responsável
// 3. Calcular comissão do time
// 4. Distribuir entre membros
// 5. Criar registros de cálculo e distribuição
```

##### `validate-commission-distribution`
```typescript
// Validar que a distribuição de comissão não excede 100%
// Chamado antes de salvar distribuições
```

### 4. Políticas RLS (Row Level Security)

Todas as novas tabelas devem ter políticas RLS para garantir isolamento multi-tenant:

```sql
-- Exemplo para core_team_commissions
ALTER TABLE core_team_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team commissions of their client"
  ON core_team_commissions FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Administrators can manage team commissions"
  ON core_team_commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = core_team_commissions.client_id
    )
  );
```

---

## 📊 Diagrama de Relacionamentos

```
core_clients
    │
    ├── core_teams
    │   ├── core_team_members
    │   │   └── core_team_member_levels ── core_team_levels
    │   └── core_team_commissions
    │
    ├── web_deals
    │   ├── web_deal_items ── web_products
    │   └── core_commission_calculations
    │       └── core_commission_distributions ── core_client_users
    │
    └── core_client_users
```

---

## 🚀 Plano de Implementação

### Fase 1: Estrutura Base (Sprint 1)
- [ ] Criar migrações para novas tabelas
- [ ] Implementar políticas RLS
- [ ] Atualizar tipos TypeScript
- [ ] Criar hooks básicos de leitura

### Fase 2: Gestão de Configuração (Sprint 2)
- [ ] Implementar `TeamCommissionSettings`
- [ ] Implementar `TeamLevelsManager`
- [ ] Criar hooks de CRUD para comissões e níveis
- [ ] Testes unitários

### Fase 3: Itens de Negócio (Sprint 3)
- [ ] Implementar `DealItemsManager`
- [ ] Criar hook `useDealItems`
- [ ] Integrar com formulário de negócios
- [ ] Validações de negócio

### Fase 4: Cálculo de Comissões (Sprint 4)
- [ ] Implementar edge function `calculate-commission`
- [ ] Criar trigger para negócios fechados
- [ ] Implementar `CommissionCalculator`
- [ ] Testes de cálculo

### Fase 5: Distribuição e Aprovação (Sprint 5)
- [ ] Implementar lógica de distribuição
- [ ] Criar validações de percentual
- [ ] Implementar aprovação de comissões
- [ ] Notificações de comissão

### Fase 6: Relatórios (Sprint 6)
- [ ] Implementar `CommissionReport`
- [ ] Criar queries de agregação
- [ ] Exportação de dados
- [ ] Dashboard de comissões

---

## 🔒 Considerações de Segurança

1. **Multi-tenancy**: Todas as tabelas devem ter `client_id` e políticas RLS
2. **Permissões**: Apenas administradores podem configurar comissões
3. **Auditoria**: Registrar quem aprovou/pagou comissões
4. **Validação**: Validar cálculos antes de aprovar
5. **Histórico**: Manter histórico de alterações de níveis e comissões

---

## 📝 Notas Adicionais

1. **Produto "XPTO"**: O sistema deve suportar identificação de produtos por código (ex: "XPTO") além de ID, para facilitar configuração

2. **Flexibilidade**: O sistema deve permitir:
   - Comissão por produto específico
   - Comissão padrão do time
   - Múltiplas comissões por time (diferentes produtos)

3. **Performance**: Considerar índices em:
   - `web_deals.team_id`
   - `web_deal_items.product_code`
   - `core_commission_calculations.status`

4. **Migração de Dados**: Se houver dados históricos, considerar:
   - Script de migração para calcular comissões retroativas
   - Validação de integridade dos dados

---

## ✅ Checklist de Validação

Antes de considerar a implementação completa, validar:

- [ ] Todos os campos necessários estão nas tabelas
- [ ] Relacionamentos estão corretos
- [ ] Políticas RLS estão implementadas
- [ ] Triggers estão funcionando
- [ ] Cálculos estão corretos
- [ ] Validações estão implementadas
- [ ] Interface está completa
- [ ] Testes estão passando
- [ ] Documentação está atualizada

---

**Data da Análise**: 2025-01-27  
**Versão do Documento**: 1.0  
**Autor**: Análise Automatizada do Código
