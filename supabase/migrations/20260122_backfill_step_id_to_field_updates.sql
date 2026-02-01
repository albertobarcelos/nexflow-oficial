-- =====================================================
-- BACKFILL: ADICIONAR step_id AOS EVENTOS field_update EXISTENTES
-- =====================================================
-- Retroativamente adiciona step_id aos eventos field_update
-- que foram criados antes da implementação do step_id
-- =====================================================

-- Função para adicionar step_id baseado no histórico de mudanças de etapa
CREATE OR REPLACE FUNCTION public.backfill_step_id_to_field_updates()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_event RECORD;
  v_card_step_id UUID;
BEGIN
  -- Para cada evento field_update sem step_id
  FOR v_event IN 
    SELECT ch.id, ch.card_id, ch.created_at, ch.client_id
    FROM public.card_history ch
    WHERE ch.event_type = 'field_update'
      AND ch.step_id IS NULL
    ORDER BY ch.created_at ASC
  LOOP
    -- Buscar o step_id do card no momento do evento
    -- Usar a última mudança de etapa antes ou no momento do evento
    SELECT step_id INTO v_card_step_id
    FROM (
      -- Buscar step_id do último evento stage_change antes do field_update
      SELECT to_step_id as step_id, created_at
      FROM public.card_history
      WHERE card_id = v_event.card_id
        AND event_type = 'stage_change'
        AND created_at <= v_event.created_at
      ORDER BY created_at DESC
      LIMIT 1
      
      UNION ALL
      
      -- Se não houver stage_change, buscar step_id do card na criação
      SELECT step_id, created_at
      FROM public.cards
      WHERE id = v_event.card_id
        AND created_at <= v_event.created_at
      ORDER BY created_at DESC
      LIMIT 1
    ) AS step_history
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Se encontrou step_id, atualizar o evento
    IF v_card_step_id IS NOT NULL THEN
      UPDATE public.card_history
      SET step_id = v_card_step_id
      WHERE id = v_event.id;
      
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Executar o backfill (comentado para não executar automaticamente em produção)
-- Descomente para executar manualmente quando necessário
-- SELECT * FROM public.backfill_step_id_to_field_updates();

-- Comentário
COMMENT ON FUNCTION public.backfill_step_id_to_field_updates() IS 'Retroativamente adiciona step_id aos eventos field_update existentes baseado no histórico de mudanças de etapa. Execute manualmente quando necessário.';
