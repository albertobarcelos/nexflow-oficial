# Estrutura de Comissões Melhorada - Configurável por Item

## 🎯 Visão Geral

Sistema de comissões **totalmente configurável por item**, permitindo:
- Configuração **por time** (distribuição da comissão do time entre membros)
- Configuração **individual** (comissão direta por membro/papel)
- Controle de prazo para itens recorrentes (meses máximos ou até cancelamento)

---

## 📊 Estrutura Proposta

### 1. Itens (`web_items`)

Os itens já definem o tipo de cobrança:
- `billing_type`: `'one_time'` (implantação) ou `'recurring'` (mensalidade)
- `item_type`: `'product'` ou `'service'`

**Não precisamos hardcodar "implantação" e "mensalidade"** - isso vem do `billing_type` do item!

---

### 2. Comissões por Time e Item (`core_team_commissions`)

**Estrutura atual precisa ser ajustada:**

```sql
CREATE TABLE core_team_commissions (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL,
  item_id UUID, -- Item específico (NULL = todos os itens)
  item_code VARCHAR(100), -- Código do item (ex: "XPTO")
  
  -- Tipo de distribuição
  distribution_type VARCHAR(20) NOT NULL CHECK (distribution_type IN ('team_based', 'individual')),
  
  -- Comissão do time (usado quando distribution_type = 'team_based')
  team_commission_type VARCHAR(20) NOT NULL CHECK (team_commission_type IN ('percentage', 'fixed')),
  team_commission_value DECIMAL(10,2) NOT NULL,
  
  -- Para itens recorrentes
  recurring_max_months INTEGER, -- NULL = até cancelamento
  recurring_until_cancellation BOOLEAN DEFAULT TRUE,
  
  -- Configuração de distribuição (JSONB para flexibilidade)
  distribution_config JSONB DEFAULT '{}',
  /*
  Exemplo quando distribution_type = 'team_based':
  {
    "ev": 50,      // EV recebe 50% da comissão do time
    "ec": 30,      // EC recebe 30% da comissão do time
    "sdr": 20      // SDR recebe 20% da comissão do time
  }
  
  Exemplo quando distribution_type = 'individual':
  {
    "ev": {
      "type": "percentage",
      "value": 5
    },
    "ec": {
      "type": "percentage",
      "value": 3
    }
  }
  */
  
  is_active BOOLEAN DEFAULT TRUE,
  client_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. Níveis do Time (`core_team_levels`)

Níveis definem a **comissão base do time** por tipo de item:

```sql
ALTER TABLE core_team_levels
ADD COLUMN commission_one_time_percentage DECIMAL(5,2), -- Para billing_type = 'one_time'
ADD COLUMN commission_recurring_percentage DECIMAL(5,2); -- Para billing_type = 'recurring'
```

**Lógica:**
- Quando item tem `billing_type = 'one_time'` → usa `commission_one_time_percentage`
- Quando item tem `billing_type = 'recurring'` → usa `commission_recurring_percentage`

---

## 🔄 Fluxo de Cálculo

### Cenário 1: Comissão por Time (`distribution_type = 'team_based'`)

**Exemplo:**
- Item: "XPTO" (billing_type: `recurring`, valor: R$ 310)
- Time: SQUAD 01 - Nível 1 (8% de recorrência)
- Configuração: EV = 50%, EC = 30%, SDR = 20%

**Cálculo:**
1. Comissão do time: R$ 310 × 8% = **R$ 24,80**
2. Distribuição:
   - EV: R$ 24,80 × 50% = **R$ 12,40**
   - EC: R$ 24,80 × 30% = **R$ 7,44**
   - SDR: R$ 24,80 × 20% = **R$ 4,96**

---

### Cenário 2: Comissão Individual (`distribution_type = 'individual'`)

**Exemplo:**
- Item: "XPTO" (billing_type: `recurring`, valor: R$ 310)
- Configuração:
  - EV: 5% direto sobre valor
  - EC: 3% direto sobre valor

**Cálculo:**
1. EV: R$ 310 × 5% = **R$ 15,50**
2. EC: R$ 310 × 3% = **R$ 9,30**

---

### Cenário 3: Item Recorrente com Prazo

**Exemplo:**
- Item: "XPTO" (billing_type: `recurring`)
- Configuração: `recurring_max_months = 6`, `recurring_until_cancellation = TRUE`

**Lógica:**
- EC recebe comissão por **6 meses** OU **enquanto cliente estiver ativo** (o que durar mais)
- Se cliente cancelar no mês 3 → para de receber
- Se cliente estiver ativo após 6 meses → para de receber no mês 6

---

## 📝 Estrutura de `distribution_config` (JSONB)

### Para `distribution_type = 'team_based'`:

```json
{
  "ev": 50,    // Percentual da comissão do time
  "ec": 30,
  "sdr": 20
}
```

### Para `distribution_type = 'individual'`:

```json
{
  "ev": {
    "type": "percentage",
    "value": 5
  },
  "ec": {
    "type": "percentage",
    "value": 3,
    "recurring_max_months": 6,
    "recurring_until_cancellation": true
  },
  "sdr": {
    "type": "fixed",
    "value": 50
  }
}
```

---

## ✅ Vantagens desta Abordagem

1. **Flexível**: Cada item pode ter configuração diferente
2. **Configurável**: Não hardcoded, tudo configurável
3. **Escalável**: Fácil adicionar novos tipos de distribuição
4. **Claro**: Separação entre comissão do time e distribuição individual

---

## 🔧 Migração Necessária

Precisamos ajustar `core_team_commissions` para incluir:
- `distribution_type` (team_based ou individual)
- `distribution_config` (JSONB com configuração)
- `recurring_max_months` e `recurring_until_cancellation`

E ajustar `core_team_levels` para usar `billing_type` do item ao invés de campos hardcoded.

---

**O que você acha desta abordagem?**
