-- =====================================================
-- FIX: duration_seconds na primeira movimentação do card
-- =====================================================
-- Quando o card foi criado numa etapa e nunca foi movido,
-- last_stage_change_at e histórico estão vazios. Usar
-- created_at do card como fallback para calcular tempo
-- na etapa de origem (primeira movimentação).
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_stage_duration()
RETURNS TRIGGER AS $$
DECLARE
  card_last_change TIMESTAMPTZ;
  duration_calc INTEGER;
BEGIN
  -- Se não é evento de mudança de etapa, não calcular duração
  IF NEW.event_type != 'stage_change' OR NEW.from_step_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Tentar usar last_stage_change_at do card (mais rápido)
  SELECT last_stage_change_at INTO card_last_change
  FROM public.cards
  WHERE id = NEW.card_id;

  -- Se não houver last_stage_change_at, buscar do histórico
  IF card_last_change IS NULL THEN
    SELECT created_at INTO card_last_change
    FROM public.card_history
    WHERE card_id = NEW.card_id
      AND event_type = 'stage_change'
      AND id != NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Fallback: primeira movimentação (card criado na etapa) — usar created_at do card
  IF card_last_change IS NULL THEN
    SELECT created_at INTO card_last_change
    FROM public.cards
    WHERE id = NEW.card_id;
  END IF;

  -- Calcular duração se houver data anterior
  IF card_last_change IS NOT NULL THEN
    duration_calc := EXTRACT(EPOCH FROM (NEW.created_at - card_last_change))::INTEGER;
    NEW.duration_seconds := duration_calc;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_stage_duration() IS 'Calcula duration_seconds: last_stage_change_at do card, ou último stage_change do histórico, ou created_at do card (primeira movimentação).';
