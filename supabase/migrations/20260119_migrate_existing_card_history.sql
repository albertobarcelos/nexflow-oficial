-- =====================================================
-- MIGRAÇÃO DE DADOS EXISTENTES DO CARD_HISTORY
-- =====================================================
-- Converte action_type para event_type
-- Calcula duration_seconds retroativamente
-- Preenche last_stage_change_at nos cards
-- =====================================================

-- 1. Converter action_type para event_type nos registros existentes
UPDATE public.card_history
SET event_type = CASE
  WHEN action_type = 'move' OR action_type = 'complete' OR action_type = 'cancel' THEN 'stage_change'
  WHEN action_type = 'child_card_created' THEN 'stage_change'
  ELSE 'stage_change' -- Default para registros antigos
END
WHERE event_type IS NULL;

-- 2. Calcular duration_seconds retroativamente
-- Para cada evento stage_change, calcular tempo desde o evento anterior
WITH stage_changes AS (
  SELECT 
    id,
    card_id,
    created_at,
    LAG(created_at) OVER (PARTITION BY card_id ORDER BY created_at) AS previous_created_at
  FROM public.card_history
  WHERE event_type = 'stage_change'
  ORDER BY card_id, created_at
)
UPDATE public.card_history ch
SET duration_seconds = EXTRACT(EPOCH FROM (ch.created_at - sc.previous_created_at))::INTEGER
FROM stage_changes sc
WHERE ch.id = sc.id
  AND sc.previous_created_at IS NOT NULL
  AND ch.duration_seconds IS NULL;

-- 3. Preencher last_stage_change_at nos cards baseado no histórico
-- Usar o created_at do último evento stage_change de cada card
WITH last_stage_changes AS (
  SELECT DISTINCT ON (card_id)
    card_id,
    created_at AS last_change
  FROM public.card_history
  WHERE event_type = 'stage_change'
  ORDER BY card_id, created_at DESC
)
UPDATE public.cards c
SET last_stage_change_at = lsc.last_change
FROM last_stage_changes lsc
WHERE c.id = lsc.card_id
  AND c.last_stage_change_at IS NULL;

-- 4. Para cards que não têm histórico mas têm step_id, usar created_at como last_stage_change_at
UPDATE public.cards
SET last_stage_change_at = created_at
WHERE last_stage_change_at IS NULL
  AND step_id IS NOT NULL;

-- Comentário
COMMENT ON FUNCTION public.calculate_stage_duration() IS 'Migration: Dados existentes foram migrados e duration_seconds calculado retroativamente';
