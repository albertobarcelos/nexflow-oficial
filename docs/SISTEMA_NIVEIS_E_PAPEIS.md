# Sistema de Níveis e Papéis de Time

## 📋 Visão Geral

Sistema configurável de níveis hierárquicos e papéis dentro dos times para cálculo de comissões diferenciadas por tipo de item (implantação vs mensalidade).

---

## 🏗️ Estrutura

### 1. Times (SQUADs)

Times são equipes que possuem:
- **Membros** com papéis específicos (EC, EV, SDR, EP)
- **Níveis hierárquicos** (Nível 1, 2, 3...)
- **Carteira de clientes** (clientes fechados e ativos)

**Exemplo:**
- SQUAD 01 - LORDS
  - Nível 1: 20% implantação, 8% mensalidade
  - Nível 2: 25% implantação, 10% mensalidade
  - Nível 3: 30% implantação, 12% mensalidade

---

### 2. Níveis Hierárquicos (`core_team_levels`)

Cada time pode ter múltiplos níveis hierárquicos. Cada nível define percentuais de comissão **diferentes** para:
- **Implantação** (`commission_implantation_percentage`)
- **Mensalidade** (`commission_recurring_percentage`)

**Campos:**
- `name`: Nome do nível (ex: "Nível 1", "Nível 2")
- `level_order`: Ordem hierárquica (1 = mais alto)
- `commission_implantation_percentage`: % sobre valor de implantação
- `commission_recurring_percentage`: % sobre valor de mensalidade
- `commission_percentage`: Percentual padrão (usado se os específicos forem NULL)

**Exemplo:**
```sql
-- Nível 1 do SQUAD 01
INSERT INTO core_team_levels (
  team_id, name, level_order,
  commission_implantation_percentage, -- 20%
  commission_recurring_percentage,    -- 8%
  client_id
) VALUES (
  'squad-01-id', 'Nível 1', 1,
  20.00, 8.00,
  'client-id'
);
```

---

### 3. Papéis dos Membros (`core_team_members.role`)

Cada membro do time tem um **papel** específico que define sua comissão:

**Papéis disponíveis:**
- `ec` - Executivo de Contas
- `ev` - Executivo de Vendas
- `sdr` - Sales Development Representative
- `ep` - Executivo de Parcerias
- `admin` - Administrador do time
- `leader` - Líder do time
- `member` - Membro genérico

**Exemplo:**
```sql
-- EC no SQUAD 01
INSERT INTO core_team_members (
  team_id, user_profile_id, role
) VALUES (
  'squad-01-id', 'user-ec-id', 'ec'
);
```

---

### 4. Comissões por Papel (`core_team_role_commissions`)

Define comissão específica para cada papel dentro de um time.

**Campos importantes:**

#### Comissão Recorrente (Mensalidade)
- `recurring_commission_type`: 
  - `'percentage'` - Percentual fixo (ex: 5%)
  - `'fixed'` - Valor fixo (ex: R$ 50)
  - `'team_percentage'` - Percentual da comissão do time (ex: EV = 50% da comissão do time)
- `recurring_commission_value`: Valor do percentual ou valor fixo
- `recurring_duration_months`: Duração em meses (NULL = enquanto cliente ativo)
- `recurring_while_active`: TRUE = enquanto cliente estiver ativo

#### Comissão de Implantação
- `implantation_commission_type`: Mesmo formato da recorrente
- `implantation_commission_value`: Valor do percentual ou valor fixo

**Exemplo - EC:**
```sql
-- EC: 5% de recorrência por 6 meses ou enquanto cliente ativo
INSERT INTO core_team_role_commissions (
  team_id, role,
  recurring_commission_type, recurring_commission_value,
  recurring_duration_months, recurring_while_active,
  client_id
) VALUES (
  'squad-01-id', 'ec',
  'percentage', 5.00,
  6, TRUE,
  'client-id'
);
```

**Exemplo - EV:**
```sql
-- EV: 50% da comissão da equipe
INSERT INTO core_team_role_commissions (
  team_id, role,
  recurring_commission_type, recurring_commission_value,
  implantation_commission_type, implantation_commission_value,
  client_id
) VALUES (
  'squad-01-id', 'ev',
  'team_percentage', 50.00,
  'team_percentage', 50.00,
  'client-id'
);
```

---

### 5. Carteira de Clientes (`core_team_client_portfolio`)

Rastreia quais clientes (cards completados) pertencem a cada time e seu status.

**Campos:**
- `team_id`: Time responsável
- `card_id`: Card completado (cliente fechado)
- `client_status`: `'active'`, `'canceled'`, `'suspended'`
- `closed_at`: Data que o card foi completado
- `activated_at`: Data de ativação
- `canceled_at`: Data de cancelamento
- `total_implantation_value`: Valor total de implantação
- `monthly_recurring_value`: Valor mensal recorrente

**Exemplo:**
```sql
-- Cliente fechado pelo SQUAD 01
INSERT INTO core_team_client_portfolio (
  team_id, card_id,
  client_status, closed_at,
  total_implantation_value, monthly_recurring_value,
  client_id
) VALUES (
  'squad-01-id', 'card-completed-id',
  'active', NOW(),
  600.00, 310.00,
  'client-id'
);
```

---

## 💰 Exemplo Prático de Cálculo

### Cenário:
- **SQUAD 01 - LORDS**
- **Venda:** R$ 600 (implantação) + R$ 310 (mensalidade)
- **Nível 1:** 20% implantação, 8% mensalidade
- **Membros:**
  - EC: 5% de recorrência por 6 meses ou enquanto ativo
  - EV: 50% da comissão da equipe

### Cálculo:

#### 1. Comissão do Time (Nível 1)
- **Implantação:** R$ 600 × 20% = **R$ 120**
- **Mensalidade:** R$ 310 × 8% = **R$ 24,80**

#### 2. Distribuição para EV (50% da comissão do time)
- **Implantação:** R$ 120 × 50% = **R$ 60**
- **Mensalidade:** R$ 24,80 × 50% = **R$ 12,40**

#### 3. Distribuição para EC (5% de recorrência)
- **Mensalidade:** R$ 310 × 5% = **R$ 15,50** (por 6 meses ou enquanto ativo)

#### 4. Restante da comissão
- **Implantação restante:** R$ 120 - R$ 60 = **R$ 60** (distribuído entre outros membros)
- **Mensalidade restante:** R$ 24,80 - R$ 12,40 - R$ 15,50 = **R$ -3,10** (ajustar distribuição)

---

## 🔧 Configuração

### Passo 1: Criar Níveis do Time

```typescript
// useTeamLevels.ts
const createLevel = async (teamId: string, level: {
  name: string;
  level_order: number;
  commission_implantation_percentage: number;
  commission_recurring_percentage: number;
}) => {
  // Criar nível
};
```

### Passo 2: Configurar Comissões por Papel

```typescript
// useTeamRoleCommissions.ts
const configureRoleCommission = async (teamId: string, role: 'ec' | 'ev' | 'sdr' | 'ep', commission: {
  recurring_commission_type: 'percentage' | 'fixed' | 'team_percentage';
  recurring_commission_value: number;
  recurring_duration_months?: number;
  recurring_while_active: boolean;
  implantation_commission_type?: 'percentage' | 'fixed' | 'team_percentage';
  implantation_commission_value?: number;
}) => {
  // Configurar comissão do papel
};
```

### Passo 3: Adicionar Cliente à Carteira

```typescript
// useTeamPortfolio.ts
const addClientToPortfolio = async (teamId: string, cardId: string, values: {
  total_implantation_value: number;
  monthly_recurring_value: number;
}) => {
  // Adicionar à carteira quando card for completado
};
```

---

## 📊 Fluxo de Cálculo de Comissão

```
Card Completo → Adicionar à Carteira → Calcular Comissão do Time (por nível)
  ↓
Para cada item (implantação/mensalidade):
  ↓
1. Buscar comissão do nível do time
  - commission_implantation_percentage (se implantação)
  - commission_recurring_percentage (se mensalidade)
  ↓
2. Calcular comissão total do time
  - Implantação: valor × %
  - Mensalidade: valor × %
  ↓
3. Distribuir entre membros (por papel)
  - EV: team_percentage da comissão do time
  - EC: percentage fixo sobre valor recorrente
  - SDR/EP: conforme configurado
  ↓
4. Registrar distribuições
  - core_commission_distributions
  - member_role, item_type, recurring_month_number
```

---

## 🎯 Regras Importantes

### 1. Comissão Recorrente
- **EC:** Recebe enquanto cliente estiver ativo OU por X meses (o que durar mais)
- **EV:** Recebe percentual da comissão do time
- **SDR/EP:** Conforme configuração específica

### 2. Comissão de Implantação
- Calculada **uma vez** quando cliente é fechado
- Distribuída conforme papéis configurados

### 3. Níveis do Time
- Níveis superiores têm percentuais maiores
- Cada nível pode ter percentuais diferentes para implantação e mensalidade

### 4. Carteira de Clientes
- Cliente é adicionado quando card é completado
- Status pode ser atualizado (ativo → cancelado)
- Filtros permitem ver apenas clientes ativos

---

## 📝 Próximos Passos

1. ✅ Estrutura de banco criada
2. ⏳ Criar hooks:
   - `useTeamLevels.ts` - Gerenciar níveis
   - `useTeamRoleCommissions.ts` - Configurar comissões por papel
   - `useTeamPortfolio.ts` - Gerenciar carteira de clientes
3. ⏳ Criar componentes:
   - `TeamLevelsManager.tsx` - Interface para níveis
   - `TeamRoleCommissionsManager.tsx` - Interface para comissões por papel
   - `TeamPortfolioView.tsx` - Visualizar carteira

---

**Última atualização:** 2025-01-27
