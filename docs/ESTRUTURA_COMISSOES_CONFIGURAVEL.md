# Sistema de Comissões Configurável por Item

## 🎯 Visão Geral

Sistema **totalmente configurável por item**, sem hardcodar tipos. Cada item define como sua comissão será calculada e distribuída.

---

## 📊 Princípios

1. ✅ **Usar `billing_type` do item** - Não hardcodar "implantação" e "mensalidade"
2. ✅ **Configuração por item** - Cada item pode ter regra diferente
3. ✅ **Distribuição flexível** - Por time ou individual
4. ✅ **Controle de prazo** - Para recorrentes (meses ou até cancelamento)

---

## 🏗️ Estrutura

### 1. Itens (`web_items`)

Define o tipo de cobrança:
- `billing_type`: `'one_time'` ou `'recurring'`
- `item_code`: Código único (ex: "XPTO")

**Exemplo:**
```sql
-- Item de implantação
INSERT INTO web_items (name, item_code, billing_type, item_type, client_id)
VALUES ('Implantação XPTO', 'XPTO-IMPL', 'one_time', 'service', 'client-id');

-- Item de mensalidade
INSERT INTO web_items (name, item_code, billing_type, item_type, client_id)
VALUES ('Mensalidade XPTO', 'XPTO', 'recurring', 'service', 'client-id');
```

---

### 2. Níveis do Time (`core_team_levels`)

Define comissão base do time **por tipo de billing**:

```sql
commission_one_time_percentage  -- Para billing_type = 'one_time'
commission_recurring_percentage -- Para billing_type = 'recurring'
```

**Lógica:**
- Quando calcular comissão, verifica `billing_type` do item
- Se `one_time` → usa `commission_one_time_percentage`
- Se `recurring` → usa `commission_recurring_percentage`

**Exemplo:**
```sql
-- Nível 1 do SQUAD 01
INSERT INTO core_team_levels (
  team_id, name, level_order,
  commission_one_time_percentage,  -- 20% para one_time
  commission_recurring_percentage, -- 8% para recurring
  client_id
) VALUES (
  'squad-01-id', 'Nível 1', 1,
  20.00, 8.00,
  'client-id'
);
```

---

### 3. Comissões por Item (`core_team_commissions`)

Configuração **por item** de como a comissão será distribuída.

**Campos principais:**
- `item_id` ou `item_code`: Item específico
- `distribution_type`: `'team_based'` ou `'individual'`
- `distribution_config`: JSONB com configuração
- `recurring_max_months`: Prazo máximo (NULL = até cancelamento)
- `recurring_until_cancellation`: TRUE = enquanto cliente ativo

---

## 🔄 Tipos de Distribuição

### Tipo 1: Por Time (`distribution_type = 'team_based'`)

**Como funciona:**
1. Calcula comissão do time (usando nível do time + `billing_type` do item)
2. Distribui entre membros conforme `distribution_config`

**Estrutura de `distribution_config`:**
```json
{
  "ev": 50,  // EV recebe 50% da comissão do time
  "ec": 30,  // EC recebe 30% da comissão do time
  "sdr": 20  // SDR recebe 20% da comissão do time
}
```

**Exemplo:**
- Item: "XPTO" (`billing_type: 'recurring'`, valor: R$ 310)
- Time: SQUAD 01 - Nível 1 (`commission_recurring_percentage: 8%`)
- Configuração: `{"ev": 50, "ec": 30, "sdr": 20}`

**Cálculo:**
1. Comissão do time: R$ 310 × 8% = **R$ 24,80**
2. Distribuição:
   - EV: R$ 24,80 × 50% = **R$ 12,40**
   - EC: R$ 24,80 × 30% = **R$ 7,44**
   - SDR: R$ 24,80 × 20% = **R$ 4,96**

---

### Tipo 2: Individual (`distribution_type = 'individual'`)

**Como funciona:**
1. Cada membro recebe comissão **diretamente sobre o valor do item**
2. Configuração individual por papel

**Estrutura de `distribution_config`:**
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

**Exemplo:**
- Item: "XPTO" (`billing_type: 'recurring'`, valor: R$ 310)
- Configuração individual

**Cálculo:**
- EV: R$ 310 × 5% = **R$ 15,50**
- EC: R$ 310 × 3% = **R$ 9,30** (por 6 meses ou enquanto ativo)
- SDR: **R$ 50,00** (fixo)

---

## ⏱️ Controle de Prazo para Recorrentes

### Campos em `core_team_commissions`:

- `recurring_max_months`: Prazo máximo em meses (ex: 6)
- `recurring_until_cancellation`: TRUE = enquanto cliente ativo

### Lógica de Prazo:

**Cenário 1:** `recurring_max_months = 6`, `recurring_until_cancellation = TRUE`
- Comissão por **6 meses** OU **enquanto cliente estiver ativo** (o que durar mais)
- Se cancelar no mês 3 → para no mês 3
- Se ativo após 6 meses → para no mês 6

**Cenário 2:** `recurring_max_months = NULL`, `recurring_until_cancellation = TRUE`
- Comissão **enquanto cliente estiver ativo** (sem limite de meses)

**Cenário 3:** `recurring_max_months = 6`, `recurring_until_cancellation = FALSE`
- Comissão por **exatamente 6 meses** (mesmo se cancelar antes)

---

## 💡 Exemplo Completo: SQUAD 01 - LORDS

### Configuração do Time

```sql
-- Nível 1
INSERT INTO core_team_levels (
  team_id, name, level_order,
  commission_one_time_percentage,  -- 20%
  commission_recurring_percentage, -- 8%
  client_id
) VALUES (
  'squad-01-id', 'Nível 1', 1,
  20.00, 8.00,
  'client-id'
);
```

### Configuração do Item "XPTO" (Mensalidade)

```sql
-- Item
INSERT INTO web_items (
  name, item_code, billing_type, item_type, client_id
) VALUES (
  'Mensalidade XPTO', 'XPTO', 'recurring', 'service', 'client-id'
);

-- Comissão por time
INSERT INTO core_team_commissions (
  team_id, item_code,
  distribution_type,
  distribution_config,
  recurring_max_months,
  recurring_until_cancellation,
  client_id
) VALUES (
  'squad-01-id', 'XPTO',
  'team_based',
  '{"ev": 50, "ec": 30, "sdr": 20}'::jsonb,
  6,   -- 6 meses
  TRUE, -- ou enquanto ativo
  'client-id'
);
```

### Configuração do Item "Implantação XPTO"

```sql
-- Item
INSERT INTO web_items (
  name, item_code, billing_type, item_type, client_id
) VALUES (
  'Implantação XPTO', 'XPTO-IMPL', 'one_time', 'service', 'client-id'
);

-- Comissão individual
INSERT INTO core_team_commissions (
  team_id, item_code,
  distribution_type,
  distribution_config,
  client_id
) VALUES (
  'squad-01-id', 'XPTO-IMPL',
  'individual',
  '{"ev": {"type": "percentage", "value": 5}, "ec": {"type": "percentage", "value": 3}}'::jsonb,
  'client-id'
);
```

---

## 🔧 Fluxo de Cálculo

```
1. Card Completo → Adicionar à Carteira
   ↓
2. Para cada item do card (nexflow.card_items):
   ↓
3. Buscar item (web_items) para obter billing_type
   ↓
4. Buscar comissão configurada (core_team_commissions)
   ↓
5. Verificar distribution_type:
   ↓
   A) team_based:
      - Buscar nível do time
      - Calcular comissão do time:
        * Se billing_type = 'one_time' → usa commission_one_time_percentage
        * Se billing_type = 'recurring' → usa commission_recurring_percentage
      - Distribuir conforme distribution_config
   ↓
   B) individual:
      - Calcular comissão direta por membro conforme distribution_config
   ↓
6. Para recorrentes:
   - Verificar recurring_max_months e recurring_until_cancellation
   - Criar distribuições mensais conforme prazo
   ↓
7. Registrar em core_commission_distributions
```

---

## ✅ Vantagens

1. **Flexível**: Cada item pode ter configuração diferente
2. **Configurável**: Não hardcoded, tudo configurável
3. **Escalável**: Fácil adicionar novos tipos de distribuição
4. **Claro**: Separação entre comissão do time e distribuição individual
5. **Controle de prazo**: Configurável por item recorrente

---

## 📝 Estrutura de `distribution_config`

### Para `distribution_type = 'team_based'`:

```json
{
  "ev": 50,    // Percentual da comissão do time
  "ec": 30,
  "sdr": 20
}
```

**Validação:** Soma deve ser <= 100%

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

**Tipos suportados:**
- `"percentage"`: Percentual sobre valor do item
- `"fixed"`: Valor fixo

---

## 🎯 Resumo

### O que foi ajustado:

1. ✅ `core_team_levels` agora usa `commission_one_time_percentage` e `commission_recurring_percentage`
2. ✅ `core_team_commissions` tem `distribution_type` e `distribution_config`
3. ✅ Controle de prazo para recorrentes (`recurring_max_months`, `recurring_until_cancellation`)
4. ✅ Tipos TypeScript atualizados

### Próximos passos:

1. ⏳ Criar hooks para gerenciar configurações
2. ⏳ Criar interface para configurar comissões por item
3. ⏳ Implementar lógica de cálculo

---

**Última atualização:** 2025-01-27
