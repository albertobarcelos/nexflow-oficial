# Lógica do Sistema de Histórico e Auditoria

## Visão Geral

O sistema de histórico e auditoria do NexFlow rastreia granularmente todos os eventos relacionados aos cards, incluindo mudanças de etapa, edições de campos, atividades, congelamento/descongelamento, conclusão/cancelamento, com cálculo automático de tempo de permanência em cada etapa.

## Arquitetura

### Estrutura de Dados

O sistema utiliza a tabela `card_history` para armazenar todos os eventos, com suporte a diferentes tipos de eventos através da coluna `event_type`:

- **`stage_change`**: Mudança de etapa do card
- **`field_update`**: Edição de campos do card
- **`activity`**: Eventos relacionados a atividades
- **`status_change`**: Mudança de status do card
- **`freeze`**: Congelamento do card
- **`unfreeze`**: Descongelamento do card
- **`checklist_completed`**: Conclusão de checklist

### Campos Principais

#### Tabela `card_history` (Estrutura Atual)

**Colunas Diretas:**
- **`id`**: UUID do registro
- **`card_id`**: UUID do card relacionado
- **`client_id`**: UUID do cliente (tenant)
- **`from_step_id`**: ID da etapa de origem (para eventos `stage_change`)
- **`to_step_id`**: ID da etapa de destino (para eventos `stage_change`)
- **`created_by`**: UUID do usuário que criou o evento
- **`created_at`**: Timestamp de criação
- **`action_type`**: Tipo de ação (`move`, `complete`, `cancel`)
- **`movement_direction`**: Direção do movimento (`forward`, `backward`, `same`)
- **`from_step_position`**: Posição da etapa de origem
- **`to_step_position`**: Posição da etapa de destino
- **`details`**: JSONB com dados adicionais do evento

**Dados Armazenados em `details` (JSONB):**
- **`event_type`**: Tipo do evento (`stage_change`, `field_update`, `activity`, `status_change`, `freeze`, `unfreeze`, `checklist_completed`)
- **`duration_seconds`**: Tempo em segundos que o card permaneceu na etapa anterior
- **`previous_value`**: Valor anterior (para edições de campos)
- **`new_value`**: Novo valor (para edições de campos)
- **`field_id`**: ID do campo alterado (para eventos `field_update`)
- **`field_label`**: Label do campo (para referência)
- **`field_slug`**: Slug do campo (para referência)
- **`field_type`**: Tipo do campo (para referência)
- **`activity_id`**: ID da atividade (para eventos `activity`)
- **`activity_title`**: Título da atividade (para referência)
- **`activity_start_at`**: Data de início da atividade
- **`activity_end_at`**: Data de fim da atividade

**Nota:** As colunas `event_type`, `field_id`, `activity_id`, `duration_seconds`, `previous_value` e `new_value` são armazenadas no campo `details` (JSONB) para manter compatibilidade com a estrutura existente. As funções SQL `get_card_timeline` e `get_contact_history` extraem esses valores do JSONB quando disponíveis.

#### Tabela `cards`

- **`last_stage_change_at`**: Data/hora da última mudança de etapa (otimização para cálculo rápido)

## Cálculo de Tempo

### Tempo na Etapa Anterior (`duration_seconds`)

O cálculo do tempo que o card permaneceu na etapa anterior é feito automaticamente pelo trigger `calculate_stage_duration()` quando um novo evento `stage_change` é inserido.

**Algoritmo:**

1. Busca o `last_stage_change_at` do card (otimização O(1))
2. Se não houver, busca o último evento `stage_change` do histórico
3. Calcula a diferença em segundos entre o evento atual e o anterior
4. Armazena em `duration_seconds`

**Exemplo:**

```sql
-- Card mudou de etapa às 10:00
-- Última mudança foi às 09:30
-- duration_seconds = 1800 (30 minutos)
```

### Tempo na Etapa Atual

O tempo na etapa atual é calculado em tempo real usando `last_stage_change_at`:

```typescript
const now = new Date();
const lastChange = new Date(card.last_stage_change_at);
const timeInCurrentStage = Math.floor((now.getTime() - lastChange.getTime()) / 1000);
```

## Triggers e Funções

### 1. `calculate_stage_duration()`

**Tipo**: Trigger Function (BEFORE INSERT)

**Responsabilidade**: Calcula `duration_seconds` para eventos `stage_change`

**Fluxo:**
1. Verifica se é evento `stage_change`
2. Busca `last_stage_change_at` do card
3. Se não houver, busca último evento do histórico
4. Calcula diferença em segundos
5. Atualiza `duration_seconds` no registro

### 2. `track_card_stage_change()`

**Tipo**: Trigger (AFTER UPDATE OF step_id)

**Responsabilidade**: Cria evento `stage_change` quando card muda de etapa

**Fluxo:**
1. Detecta mudança em `step_id`
2. Busca informações dos steps (título, tipo)
3. Busca nome do usuário atual (`auth.uid()`)
4. Determina `action_type` baseado no tipo de step:
   - `finisher` → `complete`
   - `fail` → `cancel`
   - outros → `move`
5. Cria evento no histórico
6. Atualiza `last_stage_change_at` no card

### 3. `track_card_field_update()`

**Tipo**: Trigger (AFTER UPDATE OF field_values)

**Responsabilidade**: Cria eventos `field_update` para cada campo alterado

**Fluxo:**
1. Detecta mudança em `field_values`
2. Compara `OLD.field_values` com `NEW.field_values`
3. Para cada campo alterado:
   - Busca `field_id` pelo slug
   - Cria evento com `previous_value` e `new_value`
   - Armazena em JSONB

### 4. `track_card_status_change()`

**Tipo**: Trigger (AFTER UPDATE OF status)

**Responsabilidade**: Cria evento `status_change` quando status muda

**Fluxo:**
1. Detecta mudança em `status`
2. Cria evento com status anterior e novo
3. Armazena em `previous_value` e `new_value`

## Performance e Otimizações

### Índices

1. **`idx_card_history_card_id_event_type`**: Consultas por card e tipo de evento
2. **`idx_card_history_card_created`**: Timeline ordenada por data
3. **`idx_cards_last_stage_change_at`**: Cálculo rápido de tempo na etapa atual
4. **`idx_cards_step_last_change`**: Queries de cards por etapa e tempo

### Estratégias de Otimização

1. **`last_stage_change_at`**: Evita varrer todo o histórico para calcular tempo atual (O(1) vs O(n))
2. **Cache no Frontend**: `staleTime: 1000 * 60 * 5` (5 minutos) nos hooks
3. **Agrupamento de Eventos**: Frontend agrupa eventos próximos (< 1 hora) para melhor visualização

## Funções SQL

### `get_card_timeline(p_card_id UUID, p_client_id UUID)`

Função SQL que retorna timeline completa de eventos de um card com dados relacionados.

**Características:**
- Usa apenas colunas existentes na tabela `card_history`
- Extrai `event_type`, `duration_seconds`, `field_id`, `activity_id` do campo `details` (JSONB)
- Faz joins explícitos com `core_client_users` e `steps`
- Retorna JSON formatado pronto para uso no frontend

**Uso:**
```sql
SELECT * FROM get_card_timeline('card-uuid', 'client-uuid');
```

### `get_contact_history(p_contact_id UUID, p_client_id UUID)`

Função SQL que retorna resumo da jornada dos cards de um contato.

**Características:**
- Busca todos os cards vinculados ao contato
- Calcula tempo na etapa atual usando `last_stage_change_at`
- Retorna últimos 10 eventos de cada card
- Retorna JSON formatado com resumo por card

**Uso:**
```sql
SELECT * FROM get_contact_history('contact-uuid', 'client-uuid');
```

## Exemplos de Queries

### Buscar Timeline Completa de um Card (via Função SQL)

```sql
-- Usar função SQL (recomendado)
SELECT * FROM get_card_timeline('card-uuid', 'client-uuid');

-- Query direta (para referência)
SELECT 
  ch.*,
  ch.details->>'event_type' as event_type,
  (ch.details->>'duration_seconds')::INTEGER as duration_seconds,
  ch.details->'previous_value' as previous_value,
  ch.details->'new_value' as new_value,
  u.name, u.email, u.avatar_url,
  fs.title as from_step_title, fs.color as from_step_color,
  ts.title as to_step_title, ts.color as to_step_color
FROM card_history ch
LEFT JOIN core_client_users u ON u.id = ch.created_by
LEFT JOIN steps fs ON fs.id = ch.from_step_id
LEFT JOIN steps ts ON ts.id = ch.to_step_id
WHERE ch.card_id = $1
ORDER BY ch.created_at ASC;
```

### Calcular Tempo Médio por Etapa

```sql
SELECT 
  s.title,
  AVG((ch.details->>'duration_seconds')::INTEGER) as avg_duration_seconds,
  COUNT(*) as total_movements
FROM card_history ch
JOIN steps s ON s.id = ch.to_step_id
WHERE ch.details->>'event_type' = 'stage_change'
  OR (ch.details->>'event_type' IS NULL AND ch.action_type = 'move')
  AND (ch.details->>'duration_seconds') IS NOT NULL
GROUP BY s.id, s.title
ORDER BY avg_duration_seconds DESC;
```

### Buscar Cards com Mais Tempo na Etapa Atual

```sql
SELECT 
  c.id,
  c.title,
  s.title as current_step,
  EXTRACT(EPOCH FROM (NOW() - c.last_stage_change_at))::INTEGER as time_in_current_stage
FROM cards c
JOIN steps s ON s.id = c.step_id
WHERE c.last_stage_change_at IS NOT NULL
ORDER BY time_in_current_stage DESC
LIMIT 10;
```

## Migração de Dados Existentes

A migration `20260119_migrate_existing_card_history.sql` realiza:

1. **Conversão de `action_type` para `event_type`**: Converte registros antigos
2. **Cálculo Retroativo de `duration_seconds`**: Calcula duração para todos os eventos existentes
3. **Preenchimento de `last_stage_change_at`**: Atualiza cards com base no histórico

## Edge Functions

### `get-card-timeline`

Edge Function que chama a função SQL `get_card_timeline` via RPC.

**Endpoint:** `POST /functions/v1/get-card-timeline`

**Body:**
```json
{
  "cardId": "uuid",
  "parentCardId": "uuid" // opcional
}
```

**Resposta:**
```json
{
  "timeline": [
    {
      "id": "uuid",
      "event_type": "stage_change",
      "created_at": "2025-01-19T10:00:00Z",
      "user": { ... },
      "from_step": { ... },
      "to_step": { ... }
    }
  ]
}
```

### `get-contact-history`

Edge Function que chama a função SQL `get_contact_history` via RPC.

**Endpoint:** `POST /functions/v1/get-contact-history`

**Body:**
```json
{
  "contactId": "uuid"
}
```

**Resposta:**
```json
{
  "history": [
    {
      "card_id": "uuid",
      "card_title": "Título do Card",
      "current_step": { ... },
      "time_in_current_stage": 3600,
      "events": [ ... ]
    }
  ]
}
```

## Notas Importantes

1. **Estrutura Híbrida**: A tabela `card_history` usa uma estrutura híbrida onde dados básicos estão em colunas diretas e dados adicionais (event_type, field_id, etc.) estão no campo `details` (JSONB)
2. **Compatibilidade**: O sistema mantém compatibilidade com `action_type` antigo. O `event_type` é inferido de `action_type` quando não está disponível em `details`
3. **Funções SQL**: As funções `get_card_timeline` e `get_contact_history` abstraem a complexidade de extrair dados do JSONB
4. **Edge Functions**: As Edge Functions garantem autenticação e validação antes de chamar as funções SQL
5. **Performance**: Para cards com muitos eventos, as funções SQL otimizam queries com índices e joins explícitos
6. **Triggers**: Os triggers executam após a atualização do card, garantindo que o histórico seja sempre consistente
