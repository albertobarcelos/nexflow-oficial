# Estrutura Final de Comissões - Configurável por Item

## 🎯 Princípios

1. **Não hardcodar tipos** - Usar `billing_type` do item (`one_time` ou `recurring`)
2. **Configuração por item** - Cada item pode ter configuração diferente
3. **Distribuição flexível** - Por time ou individual
4. **Controle de prazo** - Para itens recorrentes (meses ou até cancelamento)

---

## 📊 Estrutura de Dados

### 1. Itens (`web_items`)

Define o tipo de cobrança:
- `billing_type`: `'one_time'` (implantação) ou `'recurring'` (mensalidade)
- `item_type`: `'product'` ou `'service'`
- `item_code`: Código único (ex: "XPTO")

**Não precisamos hardcodar "implantação" e "mensalidade"!**

---

### 2. Níveis do Time (`core_team_levels`)

Define comissão base do time **por tipo de billing**:

```sql
commission_one_time_percentage DECIMAL(5,2)  -- Para billing_type = 'one_time'
commission_recurring_percentage DECIMAL(5,2) -- Para billing_type = 'recurring'
```

**Lógica:**
- Quando item tem `billing_type = 'one_time'` → usa `commission_one_time_percentage`
- Quando item tem `billing_type = 'recurring'` → usa `commission_recurring_percentage`

**Exemplo:**
```sql
-- Nível 1 do SQUAD 01
INSERT INTO core_team_levels (
  team_id, name, level_order,
  commission_one_time_percentage,  -- 20% para itens one_time
  commission_recurring_percentage, -- 8% para itens recurring
  client_id
) VALUES (
  'squad-01-id', 'Nível 1', 1,
  20.00, 8.00,
  'client-id'
);
```

---

### 3. Comissões por Time e Item (`core_team_commissions`)

Configuração **por item** de como a comissão será distribuída:

**Campos:**
- `item_id` ou `item_code`: Item específico (NULL = todos os itens)
- `distribution_type`: `'team_based'` ou `'individual'`
- `distribution_config`: JSONB com configuração da distribuição
- `recurring_max_months`: Prazo máximo em meses (NULL = até cancelamento)
- `recurring_until_cancellation`: TRUE = enquanto cliente ativo

---

## 🔄 Tipos de Distribuição

### Tipo 1: Por Time (`distribution_type = 'team_based'`)

**Como funciona:**
1. Calcula comissão do time (usando nível do time)
2. Distribui entre membros conforme `distribution_config`

**Exemplo de `distribution_config`:**
```json
{
  "ev": 50,  // EV recebe 50% da comissão do time
  "ec": 30,  // EC recebe 30% da comissão do time
  "sdr": 20  // SDR recebe 20% da comissão do time
}
```

**Cálculo:**
- Item: "XPTO" (recurring, R$ 310)
- Time: Nível 1 (8% de recorrência)
- Comissão do time: R$ 310 × 8% = **R$ 24,80**
- EV: R$ 24,80 × 50% = **R$ 12,40**
- EC: R$ 24,80 × 30% = **R$ 7,44**
- SDR: R$ 24,80 × 20% = **R$ 4,96**

---

### Tipo 2: Individual (`distribution_type = 'individual'`)

**Como funciona:**
1. Cada membro recebe comissão **diretamente sobre o valor do item**
2. Configuração individual por papel

**Exemplo de `distribution_config`:**
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

**Cálculo:**
- Item: "XPTO" (recurring, R$ 310)
- EV: R$ 310 × 5% = **R$ 15,50**
- EC: R$ 310 × 3% = **R$ 9,30** (por 6 meses ou enquanto ativo)
- SDR: **R$ 50,00** (fixo)

---

## ⏱️ Controle de Prazo para Recorrentes

### Campos em `core_team_commissions`:

- `recurring_max_months`: Prazo máximo em meses (ex: 6)
- `recurring_until_cancellation`: TRUE = enquanto cliente ativo

**Lógica:**
- Se `recurring_max_months = 6` e `recurring_until_cancellation = TRUE`:
  - Comissão por **6 meses** OU **enquanto cliente estiver ativo** (o que durar mais)
- Se `recurring_max_months = NULL` e `recurring_until_cancellation = TRUE`:
  - Comissão **enquanto cliente estiver ativo** (sem limite de meses)
- Se `recurring_max_months = 6` e `recurring_until_cancellation = FALSE`:
  - Comissão por **exatamente 6 meses** (mesmo se cliente cancelar antes)

---

## 💡 Exemplo Completo

### Configuração do Item "XPTO"

```sql
-- Item
INSERT INTO web_items (
  name, item_code, billing_type, item_type, client_id
) VALUES (
  'XPTO', 'XPTO', 'recurring', 'service', 'client-id'
);

-- Comissão por time para "XPTO"
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
  6,  -- 6 meses
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

-- Comissão individual para "Implantação XPTO"
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
2. Para cada item do card:
   ↓
3. Buscar comissão configurada (core_team_commissions)
   ↓
4. Verificar distribution_type:
   ↓
   A) team_based:
      - Buscar nível do time
      - Calcular comissão do time (usando billing_type do item)
      - Distribuir conforme distribution_config
   ↓
   B) individual:
      - Calcular comissão direta por membro conforme distribution_config
   ↓
5. Para recorrentes:
   - Verificar recurring_max_months e recurring_until_cancellation
   - Criar distribuições mensais conforme prazo
   ↓
6. Registrar em core_commission_distributions
```

---

## ✅ Vantagens

1. **Flexível**: Cada item pode ter configuração diferente
2. **Configurável**: Não hardcoded, tudo configurável
3. **Escalável**: Fácil adicionar novos tipos de distribuição
4. **Claro**: Separação entre comissão do time e distribuição individual
5. **Controle de prazo**: Configurável por item recorrente

---

## 📝 Próximos Passos

1. ✅ Estrutura ajustada
2. ⏳ Criar hooks para gerenciar configurações
3. ⏳ Criar interface para configurar comissões por item
4. ⏳ Implementar lógica de cálculo

---

**Última atualização:** 2025-01-27
