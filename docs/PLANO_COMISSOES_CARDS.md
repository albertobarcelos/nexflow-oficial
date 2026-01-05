# Plano de Implementação: Sistema de Comissões por Time (Baseado em Cards)

## 🎯 Objetivo

Implementar sistema completo de comissões por time onde:
- **Baseado em `nexflow.cards`** - Cards são o centro da operação do closer
- Comissão é calculada quando o **pagamento é recebido** (não quando o card é completado)
- Integração com Revalya para rastrear recebimentos
- Divisão interna da comissão por níveis hierárquicos
- Closer visualiza todas as oportunidades ganhas (cards completados) que realmente pagaram
- Suporte a itens (Produto/Serviço), Recorrente/Único, Parcelado

## 📊 Estrutura Atual de `nexflow.cards`

### Campos Existentes Relevantes:
- `id` (UUID) - Identificador único
- `client_id` (UUID) - Multi-tenant
- `flow_id` (UUID) - Flow ao qual pertence
- `step_id` (UUID) - Step atual
- `assigned_team_id` (UUID) - **Time responsável (JÁ EXISTE!)**
- `assigned_to` (UUID) - Usuário responsável
- `value` (NUMERIC) - Valor do negócio
- `product` (TEXT) - Produto (texto livre)
- `status` (TEXT) - Status: 'inprogress', 'completed', 'canceled'
- `card_type` (ENUM) - Tipo: 'finance', 'onboarding'
- `title` (TEXT) - Título do card

### Como Identificar Card Fechado:
- Card está em step com `step_type = 'finisher'` → Status automaticamente vira `'completed'`
- Card com `status = 'completed'` = Negócio ganho/fechado

---

## Fase 1: Estrutura Base de Banco de Dados

### 1.1 Criar Tabela de Itens

**Arquivo**: `supabase/migrations/20250127_create_items_table.sql` (novo)

```sql
CREATE TABLE IF NOT EXISTS web_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  item_code VARCHAR(100) UNIQUE, -- Código único (ex: "XPTO")
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product', 'service')),
  billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('one_time', 'recurring')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_client ON web_items(client_id);
CREATE INDEX idx_items_code ON web_items(item_code);
CREATE INDEX idx_items_type ON web_items(item_type);
```

### 1.2 Alterar Tabelas Existentes

**Arquivo**: `supabase/migrations/20250127_create_commission_system.sql` (ajustar)

- **`core_teams`**: Adicionar campos de comissão padrão
  - `default_commission_type` (VARCHAR: 'percentage' | 'fixed')
  - `default_commission_value` (DECIMAL)

- **`nexflow.cards`**: NÃO precisa adicionar `team_id` (já tem `assigned_team_id`!)

### 1.3 Criar Tabelas de Comissão

**Arquivo**: `supabase/migrations/20250127_create_commission_system.sql` (ajustar)

#### `core_team_levels`
Níveis hierárquicos dos times para distribuição de comissão.

```sql
CREATE TABLE IF NOT EXISTS core_team_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  level_order INTEGER NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `core_team_member_levels`
Vinculação de membros aos níveis (histórico de mudanças).

```sql
CREATE TABLE IF NOT EXISTS core_team_member_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID NOT NULL REFERENCES core_team_members(id) ON DELETE CASCADE,
  team_level_id UUID NOT NULL REFERENCES core_team_levels(id) ON DELETE CASCADE,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ, -- NULL = nível atual
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `core_team_commissions`
Configuração de comissões por time e item.

```sql
CREATE TABLE IF NOT EXISTS core_team_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  item_id UUID REFERENCES web_items(id) ON DELETE SET NULL,
  item_code VARCHAR(100), -- Código do item (ex: "XPTO")
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, item_id, item_code)
);
```

#### `nexflow.card_items` ⚠️ NOVO (não `web_deal_items`)
Itens vendidos em um card.

```sql
CREATE TABLE IF NOT EXISTS nexflow.card_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE,
  item_id UUID REFERENCES web_items(id) ON DELETE SET NULL,
  item_code VARCHAR(100), -- Código do item (ex: "XPTO")
  item_name VARCHAR(255) NOT NULL, -- Snapshot no momento da venda
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  installment_number INTEGER, -- Número da parcela (NULL se não parcelado)
  total_installments INTEGER, -- Total de parcelas (NULL se não parcelado)
  description TEXT,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_card_items_card ON nexflow.card_items(card_id);
CREATE INDEX idx_card_items_item ON nexflow.card_items(item_id);
CREATE INDEX idx_card_items_code ON nexflow.card_items(item_code);
```

#### `core_commission_calculations`
Cálculos de comissão vinculados a pagamentos.

```sql
CREATE TABLE IF NOT EXISTS core_commission_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE,
  card_item_id UUID REFERENCES nexflow.card_items(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES web_payments(id) ON DELETE SET NULL, -- VINCULADO AO PAGAMENTO
  payment_amount DECIMAL(10,2), -- Valor do pagamento que gerou a comissão
  payment_date DATE, -- Data do recebimento
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  item_code VARCHAR(100),
  team_commission_type VARCHAR(20) NOT NULL,
  team_commission_value DECIMAL(10,2) NOT NULL,
  team_commission_amount DECIMAL(10,2) NOT NULL CHECK (team_commission_amount >= 0),
  total_distributed_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_distributed_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES core_client_users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `core_commission_distributions`
Distribuição entre membros do time.

```sql
CREATE TABLE IF NOT EXISTS core_commission_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES core_commission_calculations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core_client_users(id) ON DELETE CASCADE,
  level_id UUID REFERENCES core_team_levels(id) ON DELETE SET NULL,
  distribution_percentage DECIMAL(5,2) NOT NULL,
  distribution_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.4 Criar Tabelas de Pagamento

**Arquivo**: `supabase/migrations/20250127_create_payment_system.sql` (novo)

#### `web_payments`
Pagamentos recebidos do Revalya vinculados a cards.

```sql
CREATE TABLE IF NOT EXISTS web_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE, -- VINCULADO AO CARD
  payment_reference VARCHAR(255),
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL CHECK (payment_amount > 0),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  revalya_payment_id VARCHAR(255) UNIQUE,
  revalya_sync_at TIMESTAMPTZ,
  revalya_sync_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (revalya_sync_status IN ('pending', 'synced', 'error')),
  revalya_metadata JSONB DEFAULT '{}',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES core_client_users(id),
  notes TEXT,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_card ON web_payments(card_id);
CREATE INDEX idx_payments_revalya_id ON web_payments(revalya_payment_id);
CREATE INDEX idx_payments_status ON web_payments(payment_status);
CREATE INDEX idx_payments_date ON web_payments(payment_date);
```

#### `revalya_integration_log`
Log de sincronizações com Revalya.

```sql
CREATE TABLE IF NOT EXISTS revalya_integration_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type VARCHAR(50) NOT NULL,
  revalya_payment_id VARCHAR(255) NOT NULL,
  card_id UUID REFERENCES nexflow.cards(id),
  payment_id UUID REFERENCES web_payments(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,
  revalya_data JSONB DEFAULT '{}',
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Fase 2: Integração com Revalya

### 2.1 Edge Function: Webhook do Revalya

**Arquivo**: `supabase/functions/revalya-webhook/index.ts` (novo)

- Receber notificações de pagamento do Revalya
- Validar autenticação via `REVALYA_WEBHOOK_SECRET`
- Criar/atualizar registros em `web_payments` vinculados a `card_id`
- Disparar cálculo de comissão quando `payment_status = 'confirmed'`
- Suportar múltiplos pagamentos (parcelas) do mesmo card

**Estrutura esperada do webhook:**
```typescript
{
  event: "payment.received",
  payment_id: "xxx",
  card_id: "card_123", // ID do card no sistema
  amount: 10000.00,
  payment_date: "2025-01-27",
  payment_method: "pix",
  status: "confirmed"
}
```

### 2.2 Edge Function: Cálculo de Comissão

**Arquivo**: `supabase/functions/calculate-commission/index.ts` (novo)

- Função para calcular comissão quando pagamento é confirmado
- Buscar itens do card (`nexflow.card_items`)
- Verificar se card está completo (`status = 'completed'` e em step `finisher`)
- Buscar comissão configurada do time (`core_team_commissions`) por `item_code` ou `item_id`
- Calcular comissão sobre valor do pagamento (não sobre valor total do card)
- Distribuir entre membros do time conforme níveis (`core_team_levels`)
- Suportar itens recorrentes (comissão a cada pagamento)

---

## Fase 3: Backend - Hooks e Lógica

### 3.1 Hooks de Configuração

**Arquivos novos**:
- `src/hooks/useItems.ts` - CRUD de itens (produtos/serviços)
- `src/hooks/useTeamLevels.ts` - CRUD de níveis hierárquicos
- `src/hooks/useTeamCommissions.ts` - CRUD de comissões por time/item
- `src/hooks/useCardItems.ts` - Gerenciar itens de cards (suportar parcelamento)
- `src/hooks/usePayments.ts` - Gerenciar pagamentos recebidos

### 3.2 Hooks de Visualização

**Arquivos novos**:
- `src/hooks/useCloserCommissions.ts` - Comissões do closer (cards completados que pagaram)
- `src/hooks/useCommissionCalculations.ts` - Cálculos e aprovações
- `src/hooks/useCommissionReports.ts` - Relatórios de comissões

### 3.3 Atualizar Hooks Existentes

**Arquivos a atualizar**:
- `src/hooks/useNexflowCards.ts` - Verificar compatibilidade
- Verificar se há hooks relacionados a cards que precisam ajustes

---

## Fase 4: Frontend - Componentes de Configuração

### 4.1 Gerenciamento de Itens

**Arquivo**: `src/components/crm/settings/ItemsManager.tsx` (novo)

- Listar itens (produtos/serviços)
- Criar/editar/excluir itens
- Definir tipo (Produto/Serviço)
- Definir recorrência (Recorrente/Único)
- Definir código do item (`item_code`)

### 4.2 Gerenciamento de Níveis

**Arquivo**: `src/components/crm/settings/TeamLevelsManager.tsx` (novo)

- Listar níveis do time
- Criar/editar/excluir níveis
- Definir percentuais de comissão por nível
- Atribuir níveis aos membros

### 4.3 Configuração de Comissões

**Arquivo**: `src/components/crm/settings/TeamCommissionSettings.tsx` (novo)

- Configurar comissões por time e item
- Tipo: percentual ou valor fixo
- Listar comissões existentes
- Criar/editar/excluir comissões
- Buscar por `item_code` ou selecionar item

### 4.4 Gerenciamento de Itens de Card

**Arquivo**: `src/components/crm/flows/CardItemsManager.tsx` (novo)

- Adicionar/editar itens em um card
- Selecionar itens (produtos/serviços)
- Definir quantidades e preços
- Suportar parcelamento (número de parcelas)
- Integrar com visualização/edição de cards

---

## Fase 5: Frontend - Visualização do Closer

### 5.1 Dashboard de Comissões

**Arquivo**: `src/components/crm/commissions/CloserCommissionsView.tsx` (novo)

- Visualizar todas as oportunidades ganhas (cards completados) que pagaram
- Filtrar por status (pendente, aprovado, pago)
- Ver cards completados mas ainda não pagos
- Cards de resumo (total pendente, aprovado, pago)
- Filtrar por tipo de item (produto/serviço)
- Filtrar por recorrência (recorrente/único)

### 5.2 Lista de Comissões

**Arquivo**: `src/components/crm/commissions/CommissionList.tsx` (novo)

- Listar comissões com detalhes
- Mostrar: card, item vendido, valor pago, data do pagamento, comissão calculada
- Indicar se é parcela (mostrar "Parcela X de Y")
- Filtros e ordenação

### 5.3 Detalhes da Comissão

**Arquivo**: `src/components/crm/commissions/CommissionDetails.tsx` (novo)

- Detalhes completos de uma comissão
- Histórico de pagamentos (todas as parcelas)
- Distribuição entre membros do time
- Informações do item (tipo, recorrência)
- Link para o card original

---

## Fase 6: Frontend - Administração

### 6.1 Aprovação de Comissões

**Arquivo**: `src/components/crm/commissions/CommissionApproval.tsx` (novo)

- Listar comissões pendentes de aprovação
- Aprovar/rejeitar comissões
- Marcar como pago
- Visualizar histórico de aprovações

### 6.2 Relatórios

**Arquivo**: `src/components/crm/commissions/CommissionReport.tsx` (novo)

- Relatório de comissões por time
- Relatório de comissões por usuário
- Relatório por tipo de item (produto/serviço)
- Relatório por recorrência
- Filtros por período, status, time
- Exportação de dados

---

## Fase 7: Integração e Testes

### 7.1 Testes de Integração

- Testar webhook do Revalya
- Testar cálculo de comissão quando card completa
- Testar distribuição entre membros
- Testar múltiplos pagamentos (parcelas)
- Testar itens recorrentes (comissão a cada pagamento)
- Testar estorno de pagamento
- Testar itens do tipo Produto e Serviço
- Validar que comissão só é calculada quando pagamento confirmado

### 7.2 Validações

- Validar que soma de percentuais não excede 100%
- Validar que comissão só é calculada quando pagamento confirmado
- Validar RLS policies
- Validar multi-tenancy
- Validar parcelamento (número de parcelas vs total)
- Validar que card precisa estar `status = 'completed'` e em step `finisher`

---

## Fase 8: Documentação e Deploy

### 8.1 Documentação

- Atualizar `docs/COMISSOES_POR_TIME.md` com informações finais
- Criar `docs/COMISSOES_POR_RECEBIMENTO.md`
- Documentar API do Revalya
- Documentar estrutura de `web_items` (tipos, recorrência, parcelamento)
- Documentar integração com `nexflow.cards`
- Guia de uso para administradores
- Guia de uso para closers

### 8.2 Deploy

- Executar migrações em ambiente de desenvolvimento
- Testar em ambiente de staging
- Deploy em produção
- Monitorar logs e erros

---

## 🔄 Fluxo Completo: Do Card ao Pagamento da Comissão

```
1. CLOSER TRABALHA NO CARD
   ↓ nexflow.cards (assigned_team_id já existe)
   
2. CARD É COMPLETADO
   ↓ Card movido para step com step_type = 'finisher'
   ↓ Status automaticamente vira 'completed'
   ↓ NÃO calcula comissão ainda
   
3. ITENS SÃO ADICIONADOS AO CARD
   ↓ nexflow.card_items (produtos/serviços vendidos)
   ↓ Pode ter múltiplos itens
   ↓ Pode ter parcelamento
   
4. AGUARDA PAGAMENTO
   ↓ Closer vê card completo, mas comissão = 0
   
5. REVALYA RECEBE PAGAMENTO
   ↓ Webhook do Revalya → Edge Function
   ↓ Cria registro em web_payments (vinculado a card_id)
   ↓ payment_status = 'confirmed'
   
6. SISTEMA CALCULA COMISSÃO (AGORA SIM!)
   ↓ Busca itens do card (nexflow.card_items)
   ↓ Verifica se card está completo (status = 'completed')
   ↓ Para cada item:
     * Busca comissão do time (core_team_commissions)
     * Calcula: comissão = payment_amount × (percentual / 100)
   ↓ Distribui entre membros do time conforme níveis
   
7. CLOSER VÊ COMISSÃO DISPONÍVEL
   ↓ Visualiza todas as oportunidades ganhas (cards completados) que pagaram
   ↓ Vê valor da comissão calculada
   ↓ Status: "pending" (aguardando aprovação)
   
8. APROVAÇÃO E PAGAMENTO
   ↓ Administrador aprova comissão
   ↓ Marca como "paid"
   ↓ Closer recebe comissão
```

---

## 📋 Decisões Importantes

### 1. Baseado em Cards, não em Deals
- ✅ Usar `nexflow.cards` como entidade central
- ✅ Cards já têm `assigned_team_id` (não precisa adicionar)
- ✅ Cards têm `value` e `product` (texto)
- ✅ Cards completados = `status = 'completed'` em step `finisher`

### 2. Tabela de Itens
- ✅ Criar `web_items` (não `web_products`)
- ✅ Suporta Produto e Serviço
- ✅ Suporta Recorrente e Único

### 3. Itens de Card
- ✅ Criar `nexflow.card_items` (não `web_deal_items`)
- ✅ Vinculado a `nexflow.cards`
- ✅ Suporta parcelamento

### 4. Pagamentos
- ✅ Criar `web_payments` vinculado a `card_id` (não `deal_id`)
- ✅ Comissão calculada quando `payment_status = 'confirmed'`

### 5. Integração Revalya
- ✅ Webhook recomendado
- ✅ Vincular pagamento a card via `card_id` no metadata do Revalya

---

## 📁 Arquivos Principais a Criar/Modificar

### Migrações SQL
- `supabase/migrations/20250127_create_items_table.sql` (novo)
- `supabase/migrations/20250127_create_commission_system.sql` (ajustar - usar cards)
- `supabase/migrations/20250127_create_payment_system.sql` (novo - vincular a cards)

### Edge Functions
- `supabase/functions/revalya-webhook/index.ts` (novo)
- `supabase/functions/calculate-commission/index.ts` (novo)

### Hooks
- `src/hooks/useItems.ts` (novo)
- `src/hooks/useTeamLevels.ts` (novo)
- `src/hooks/useTeamCommissions.ts` (novo)
- `src/hooks/useCardItems.ts` (novo)
- `src/hooks/usePayments.ts` (novo)
- `src/hooks/useCloserCommissions.ts` (novo)
- `src/hooks/useCommissionCalculations.ts` (novo)

### Componentes
- `src/components/crm/settings/ItemsManager.tsx` (novo)
- `src/components/crm/settings/TeamLevelsManager.tsx` (novo)
- `src/components/crm/settings/TeamCommissionSettings.tsx` (novo)
- `src/components/crm/flows/CardItemsManager.tsx` (novo)
- `src/components/crm/commissions/CloserCommissionsView.tsx` (novo)
- `src/components/crm/commissions/CommissionList.tsx` (novo)
- `src/components/crm/commissions/CommissionDetails.tsx` (novo)
- `src/components/crm/commissions/CommissionApproval.tsx` (novo)
- `src/components/crm/commissions/CommissionReport.tsx` (novo)

### Tipos TypeScript
- Atualizar `src/types/database.ts` com novas tabelas
- Criar `src/types/commission.ts` (novo)
- Criar `src/types/payment.ts` (novo)
- Criar `src/types/item.ts` (novo)

---

## ✅ Checklist de Implementação

### Fase 1: Estrutura Base
- [ ] Criar tabela `web_items`
- [ ] Adicionar campos de comissão em `core_teams`
- [ ] Criar tabela `core_team_levels`
- [ ] Criar tabela `core_team_member_levels`
- [ ] Criar tabela `core_team_commissions`
- [ ] Criar tabela `nexflow.card_items`
- [ ] Criar tabela `core_commission_calculations` (ajustar para cards)
- [ ] Criar tabela `core_commission_distributions`
- [ ] Criar tabela `web_payments` (vincular a cards)
- [ ] Criar tabela `revalya_integration_log`

### Fase 2: Integração Revalya
- [ ] Implementar webhook `revalya-webhook`
- [ ] Implementar função `calculate-commission`
- [ ] Configurar variáveis de ambiente

### Fase 3-8: Backend, Frontend, Testes, Deploy
- [ ] (Ver plano completo acima)

---

**Data**: 2025-01-27  
**Versão**: 2.0 (Baseado em Cards)  
**Status**: Plano Completo ✅
