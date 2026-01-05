# Próximos Passos: Sistema de Comissões e Equipes

## 📊 Status Atual

### ✅ Concluído

1. **Estrutura de Banco de Dados**
   - Tabelas criadas (items, níveis, comissões, pagamentos)
   - Tipos TypeScript atualizados
   - RLS policies configuradas

2. **Integração com Revalya**
   - Edge Functions criadas
   - Documentação completa
   - Webhook configurado

### 🔄 Próximas Etapas

---

## Fase 3: Backend - Hooks e Lógica (PRIORIDADE ALTA)

### 3.1 Hooks de Configuração de Equipes

#### `src/hooks/useTeamLevels.ts` ⚠️ **CRÍTICO**

**Funcionalidades:**
- Listar níveis hierárquicos de um time
- Criar/editar/excluir níveis
- Definir percentual de comissão por nível
- Ordenar níveis (level_order)

**Estrutura esperada:**
```typescript
interface TeamLevel {
  id: string;
  team_id: string;
  name: string; // "Líder", "Sênior", "Pleno", "Júnior"
  level_order: number; // 1 = mais alto
  commission_percentage: number; // 0-100
  description?: string;
  is_active: boolean;
  client_id: string;
}

// Hook
useTeamLevels(teamId: string)
useCreateTeamLevel()
useUpdateTeamLevel()
useDeleteTeamLevel()
```

**Dependências:**
- Tabela `core_team_levels` ✅ (já existe)

---

#### `src/hooks/useTeamMemberLevels.ts` ⚠️ **CRÍTICO**

**Funcionalidades:**
- Atribuir níveis aos membros do time
- Histórico de níveis (effective_from/effective_to)
- Buscar nível atual de um membro

**Estrutura esperada:**
```typescript
interface TeamMemberLevel {
  id: string;
  team_member_id: string;
  team_level_id: string;
  effective_from: string;
  effective_to?: string; // NULL = ativo
  client_id: string;
}

// Hook
useTeamMemberLevels(teamMemberId: string)
useAssignLevelToMember()
useUpdateMemberLevel()
```

**Dependências:**
- Tabela `core_team_member_levels` ✅ (já existe)
- Hook `useTeamMembers` ✅ (já existe)

---

#### `src/hooks/useTeamCommissions.ts` ⚠️ **CRÍTICO**

**Funcionalidades:**
- Configurar comissões por time e item
- Tipo: percentual ou valor fixo
- Buscar comissão por `item_code` ou `item_id`
- Comissão padrão do time (quando não há item específico)

**Estrutura esperada:**
```typescript
interface TeamCommission {
  id: string;
  team_id: string;
  item_id?: string;
  item_code?: string; // "XPTO"
  commission_type: "percentage" | "fixed";
  commission_value: number; // % ou R$
  description?: string;
  is_active: boolean;
  client_id: string;
}

// Hook
useTeamCommissions(teamId: string)
useCreateTeamCommission()
useUpdateTeamCommission()
useGetTeamCommission(teamId, itemCode)
```

**Dependências:**
- Tabela `core_team_commissions` ✅ (já existe)
- Tabela `web_items` ✅ (já existe)

---

### 3.2 Hooks de Itens e Cards

#### `src/hooks/useItems.ts` ⚠️ **CRÍTICO**

**Funcionalidades:**
- CRUD completo de itens (produtos/serviços)
- Filtrar por tipo (product/service)
- Filtrar por billing_type (one_time/recurring)
- Buscar por `item_code`

**Estrutura esperada:**
```typescript
interface Item {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  price?: number;
  item_code?: string; // "XPTO"
  item_type: "product" | "service";
  billing_type: "one_time" | "recurring";
  metadata: Json;
  is_active: boolean;
}

// Hook
useItems(filters?: { type?, billing_type?, code? })
useCreateItem()
useUpdateItem()
useDeleteItem()
```

**Dependências:**
- Tabela `web_items` ✅ (já existe)

---

#### `src/hooks/useCardItems.ts` ⚠️ **CRÍTICO**

**Funcionalidades:**
- Adicionar itens a um card
- Suportar parcelamento (installment_number, total_installments)
- Listar itens de um card
- Editar/remover itens

**Estrutura esperada:**
```typescript
interface CardItem {
  id: string;
  card_id: string;
  item_id?: string;
  item_code?: string;
  item_name: string; // Snapshot
  quantity: number;
  unit_price: number;
  total_price: number;
  installment_number?: number;
  total_installments?: number;
  description?: string;
  client_id: string;
}

// Hook
useCardItems(cardId: string)
useAddCardItem()
useUpdateCardItem()
useRemoveCardItem()
```

**Dependências:**
- Tabela `nexflow.card_items` ✅ (já existe)
- Tabela `nexflow.cards` ✅ (já existe)

---

### 3.3 Hooks de Pagamentos e Comissões

#### `src/hooks/usePayments.ts`

**Funcionalidades:**
- Listar pagamentos de um card
- Filtrar por status
- Confirmar pagamento manualmente
- Ver histórico de pagamentos

**Estrutura esperada:**
```typescript
interface Payment {
  id: string;
  card_id: string;
  payment_reference?: string;
  payment_date: string;
  payment_amount: number;
  payment_method?: string;
  payment_status: "pending" | "confirmed" | "cancelled" | "refunded";
  revalya_payment_id?: string;
  revalya_sync_status: "pending" | "synced" | "error";
  confirmed_at?: string;
  client_id: string;
}

// Hook
usePayments(cardId: string)
useConfirmPayment(paymentId: string)
```

**Dependências:**
- Tabela `web_payments` ✅ (já existe)

---

#### `src/hooks/useCloserCommissions.ts` ⚠️ **PRIORIDADE MÁXIMA**

**Funcionalidades:**
- **VISÃO DO CLOSER**: Cards completados que realmente pagaram
- Listar comissões do closer
- Filtrar por período
- Ver detalhes de cada comissão
- Status: pending, approved, paid

**Estrutura esperada:**
```typescript
interface CloserCommission {
  card_id: string;
  card_title: string;
  card_completed_at: string;
  payment_id: string;
  payment_date: string;
  payment_amount: number;
  item_code: string;
  item_name: string;
  team_commission_amount: number;
  user_distribution_amount: number; // Quanto o closer recebe
  user_distribution_percentage: number;
  status: "pending" | "approved" | "paid";
  calculation_id: string;
}

// Hook
useCloserCommissions(filters?: { 
  startDate?, 
  endDate?, 
  status? 
})
useCloserCommissionSummary() // Total pendente, aprovado, pago
```

**Query SQL esperada:**
```sql
SELECT 
  c.id as card_id,
  c.title as card_title,
  c.updated_at as card_completed_at,
  p.id as payment_id,
  p.payment_date,
  p.payment_amount,
  ci.item_code,
  ci.item_name,
  calc.team_commission_amount,
  dist.distribution_amount as user_distribution_amount,
  dist.distribution_percentage as user_distribution_percentage,
  dist.status,
  calc.id as calculation_id
FROM nexflow.cards c
INNER JOIN web_payments p ON p.card_id = c.id
INNER JOIN nexflow.card_items ci ON ci.card_id = c.id
INNER JOIN core_commission_calculations calc ON calc.card_id = c.id AND calc.payment_id = p.id
INNER JOIN core_commission_distributions dist ON dist.calculation_id = calc.id
WHERE c.status = 'completed'
  AND p.payment_status = 'confirmed'
  AND dist.user_id = :userId
ORDER BY p.payment_date DESC
```

**Dependências:**
- Todas as tabelas de comissão ✅ (já existem)

---

#### `src/hooks/useCommissionCalculations.ts`

**Funcionalidades:**
- Listar cálculos de comissão (admin)
- Aprovar/rejeitar comissões
- Filtrar por time, período, status
- Ver distribuições detalhadas

**Estrutura esperada:**
```typescript
interface CommissionCalculation {
  id: string;
  card_id: string;
  card_title: string;
  payment_id: string;
  payment_amount: number;
  team_id: string;
  team_name: string;
  item_code: string;
  team_commission_amount: number;
  total_distributed_amount: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  distributions: CommissionDistribution[];
}

// Hook
useCommissionCalculations(filters?: { teamId?, status?, startDate?, endDate? })
useApproveCommission(calculationId: string)
useRejectCommission(calculationId: string)
```

**Dependências:**
- Tabela `core_commission_calculations` ✅ (já existe)
- Tabela `core_commission_distributions` ✅ (já existe)

---

## Fase 4: Frontend - Componentes de Configuração

### 4.1 Gerenciamento de Itens

**Arquivo:** `src/components/crm/settings/ItemsManager.tsx`

**Funcionalidades:**
- Lista de itens com filtros (tipo, recorrência)
- Modal de criação/edição
- Campos: nome, descrição, preço, código, tipo, recorrência
- Validação de `item_code` único por cliente

**Dependências:**
- Hook `useItems` (Fase 3.2)

---

### 4.2 Gerenciamento de Níveis de Time

**Arquivo:** `src/components/crm/settings/TeamLevelsManager.tsx`

**Funcionalidades:**
- Lista de níveis do time
- Drag & drop para reordenar (level_order)
- Modal de criação/edição
- Campos: nome, percentual de comissão, descrição
- Validação: soma dos percentuais não pode exceder 100%

**Dependências:**
- Hook `useTeamLevels` (Fase 3.1)

---

### 4.3 Atribuição de Níveis aos Membros

**Arquivo:** `src/components/crm/settings/TeamMemberLevelsManager.tsx`

**Funcionalidades:**
- Lista de membros do time com seus níveis atuais
- Dropdown para atribuir/alterar nível
- Histórico de níveis (modal)
- Data de início e término do nível

**Dependências:**
- Hook `useTeamMemberLevels` (Fase 3.1)
- Hook `useTeamMembers` ✅ (já existe)

---

### 4.4 Configuração de Comissões por Time

**Arquivo:** `src/components/crm/settings/TeamCommissionSettings.tsx`

**Funcionalidades:**
- Lista de comissões configuradas
- Modal de criação/edição
- Campos:
  - Time (seleção)
  - Item (busca por código ou seleção)
  - Tipo: percentual ou fixo
  - Valor
- Comissão padrão do time (sem item específico)

**Dependências:**
- Hook `useTeamCommissions` (Fase 3.1)
- Hook `useItems` (Fase 3.2)
- Hook `useOrganizationTeams` ✅ (já existe)

---

## Fase 5: Frontend - Visualização do Closer

### 5.1 Dashboard de Comissões do Closer ⚠️ **PRIORIDADE MÁXIMA**

**Arquivo:** `src/components/crm/commissions/CloserCommissionsDashboard.tsx`

**Funcionalidades:**
- **Cards que ganhou e realmente pagaram**
- Resumo: Total pendente, aprovado, pago
- Lista de comissões com filtros:
  - Período (mês atual, último mês, customizado)
  - Status (pending, approved, paid)
- Detalhes de cada comissão:
  - Card (título, data de conclusão)
  - Pagamento (data, valor, método)
  - Item vendido
  - Valor da comissão
  - Status

**Dependências:**
- Hook `useCloserCommissions` (Fase 3.3) ⚠️ **CRÍTICO**

---

### 5.2 Adicionar Itens ao Card

**Arquivo:** `src/components/crm/cards/CardItemsManager.tsx`

**Funcionalidades:**
- Lista de itens do card
- Botão "Adicionar Item"
- Modal com:
  - Busca/seleção de item
  - Quantidade
  - Preço unitário
  - Parcelamento (se aplicável)
- Editar/remover itens

**Dependências:**
- Hook `useCardItems` (Fase 3.2)
- Hook `useItems` (Fase 3.2)

**Onde usar:**
- Na página de detalhes do card
- Quando card está em step de finalização

---

## Fase 6: Frontend - Administração

### 6.1 Aprovação de Comissões

**Arquivo:** `src/components/admin/commissions/CommissionApproval.tsx`

**Funcionalidades:**
- Lista de comissões pendentes
- Detalhes: card, pagamento, time, distribuições
- Botões: Aprovar / Rejeitar
- Filtros: time, período, status

**Dependências:**
- Hook `useCommissionCalculations` (Fase 3.3)

---

## 📋 Ordem de Implementação Recomendada

### Sprint 1: Configuração Base (Semana 1-2)

1. ✅ **`useItems.ts`** - CRUD de itens
2. ✅ **`useTeamLevels.ts`** - Níveis hierárquicos
3. ✅ **`useTeamMemberLevels.ts`** - Atribuição de níveis
4. ✅ **`useTeamCommissions.ts`** - Configuração de comissões

**Resultado:** Administrador consegue configurar o sistema de comissões

---

### Sprint 2: Operação (Semana 3-4)

5. ✅ **`useCardItems.ts`** - Adicionar itens aos cards
6. ✅ **`usePayments.ts`** - Visualizar pagamentos
7. ✅ **`useCloserCommissions.ts`** - **VISÃO DO CLOSER** ⚠️ **CRÍTICO**

**Resultado:** Closer consegue ver suas comissões

---

### Sprint 3: Frontend Configuração (Semana 5-6)

8. ✅ **ItemsManager.tsx** - Gerenciar itens
9. ✅ **TeamLevelsManager.tsx** - Gerenciar níveis
10. ✅ **TeamMemberLevelsManager.tsx** - Atribuir níveis
11. ✅ **TeamCommissionSettings.tsx** - Configurar comissões

**Resultado:** Interface completa de configuração

---

### Sprint 4: Frontend Operação (Semana 7-8)

12. ✅ **CloserCommissionsDashboard.tsx** - Dashboard do closer
13. ✅ **CardItemsManager.tsx** - Adicionar itens ao card
14. ✅ **CommissionApproval.tsx** - Aprovar comissões

**Resultado:** Sistema completo funcional

---

## 🎯 Prioridades

### 🔴 CRÍTICO (Fazer Primeiro)

1. **`useCloserCommissions.ts`** - Closer precisa ver suas comissões
2. **`useCardItems.ts`** - Precisa adicionar itens aos cards
3. **`useTeamLevels.ts`** - Base para distribuição
4. **`useTeamMemberLevels.ts`** - Atribuir níveis aos membros
5. **`useTeamCommissions.ts`** - Configurar comissões

### 🟡 IMPORTANTE (Fazer Depois)

6. `useItems.ts` - Gerenciar itens
7. `usePayments.ts` - Visualizar pagamentos
8. `useCommissionCalculations.ts` - Aprovar comissões

### 🟢 DESEJÁVEL (Fazer Por Último)

9. Componentes de configuração (Fase 4)
10. Dashboard do closer (Fase 5.1)
11. Aprovação de comissões (Fase 6)

---

## 📝 Notas Importantes

### Sobre Cards e Comissões

- **Comissão só é calculada quando:**
  1. Card está completo (`status = 'completed'`)
  2. Card está em step `finisher`
  3. Pagamento está confirmado (`payment_status = 'confirmed'`)

- **Card pode ter múltiplos itens:**
  - Cada item pode ter comissão diferente
  - Cada item pode ser parcelado
  - Comissão é calculada por item

- **Comissão é sobre o pagamento, não sobre a venda:**
  - Se venda é R$ 10.000 parcelado em 12x
  - Comissão é calculada a cada parcela recebida
  - Exemplo: 5% de R$ 833,33 = R$ 41,67 por parcela

### Sobre Níveis e Distribuição

- **Níveis são hierárquicos:**
  - `level_order = 1` = nível mais alto (maior percentual)
  - Percentuais são da comissão total do time
  - Soma dos percentuais não deve exceder 100%

- **Membro pode ter apenas um nível ativo:**
  - `effective_to = NULL` = nível ativo
  - Histórico é mantido para auditoria

---

**Última atualização:** 2025-01-27
