-- =====================================================
-- FUNÇÃO: get_card_stage_summary
-- =====================================================
-- Retorna resumo agrupado por etapa do que aconteceu
-- em cada etapa que o card passou
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_card_stage_summary(
  p_card_id UUID,
  p_client_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_stage_record RECORD;
  v_fields_filled jsonb;
  v_activities jsonb;
  v_processes jsonb;
  v_other_events jsonb;
BEGIN
  -- Validar que o card pertence ao client_id
  IF NOT EXISTS (
    SELECT 1 FROM public.cards 
    WHERE id = p_card_id AND client_id = p_client_id
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Agrupar eventos por etapa usando CTE
  WITH stage_events AS (
    SELECT 
      COALESCE(ch.from_step_id, ch.step_id) AS step_id,
      MIN(ch.created_at) AS entered_at,
      MAX(ch.created_at) AS last_event_at,
      COUNT(*) FILTER (WHERE ch.event_type = 'field_update') AS fields_count,
      COUNT(*) FILTER (WHERE ch.event_type = 'activity') AS activities_count,
      COUNT(*) FILTER (WHERE ch.event_type IN ('process_status_change', 'process_completed')) AS processes_count,
      COUNT(*) AS total_events
    FROM public.card_history ch
    WHERE ch.card_id = p_card_id
      AND ch.client_id = p_client_id
      AND (ch.from_step_id IS NOT NULL OR ch.step_id IS NOT NULL)
    GROUP BY COALESCE(ch.from_step_id, ch.step_id)
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'step_id', se.step_id,
      'step', CASE
        WHEN se.step_id IS NOT NULL THEN
          jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'color', s.color,
            'position', s.position
          )
        ELSE NULL
      END,
      'entered_at', se.entered_at,
      'last_event_at', se.last_event_at,
      'duration_seconds', EXTRACT(EPOCH FROM (se.last_event_at - se.entered_at))::INTEGER,
      'fields_filled', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'field_id', ch.field_id,
            'field', CASE
              WHEN ch.field_id IS NOT NULL THEN
                jsonb_build_object(
                  'id', sf.id,
                  'label', sf.label,
                  'slug', sf.slug,
                  'field_type', sf.field_type
                )
              ELSE NULL
            END,
            'value', ch.new_value->'value',
            'filled_at', ch.created_at,
            'filled_by', CASE
              WHEN ch.created_by IS NOT NULL THEN
                jsonb_build_object(
                  'id', u.id,
                  'name', u.name,
                  'surname', u.surname,
                  'email', u.email
                )
              ELSE NULL
            END
          )
          ORDER BY ch.created_at ASC
        )
        FROM public.card_history ch
        LEFT JOIN public.step_fields sf ON sf.id = ch.field_id
        LEFT JOIN public.core_client_users u ON u.id = ch.created_by
        WHERE ch.card_id = p_card_id
          AND ch.client_id = p_client_id
          AND ch.event_type = 'field_update'
          AND ch.step_id = se.step_id
      ),
      'activities', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ch.activity_id,
            'activity', CASE
              WHEN ch.activity_id IS NOT NULL THEN
                jsonb_build_object(
                  'id', ca.id,
                  'title', ca.title,
                  'start_at', ca.start_at,
                  'end_at', ca.end_at,
                  'completed', ca.completed
                )
              ELSE NULL
            END,
            'created_at', ch.created_at,
            'details', ch.details
          )
          ORDER BY ch.created_at ASC
        )
        FROM public.card_history ch
        LEFT JOIN public.card_activities ca ON ca.id = ch.activity_id
        WHERE ch.card_id = p_card_id
          AND ch.client_id = p_client_id
          AND ch.event_type = 'activity'
          AND ch.step_id = se.step_id
      ),
      'processes', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ch.id,
            'created_at', ch.created_at,
            'event_type', ch.event_type,
            'details', ch.details
          )
          ORDER BY ch.created_at ASC
        )
        FROM public.card_history ch
        WHERE ch.card_id = p_card_id
          AND ch.client_id = p_client_id
          AND ch.event_type IN ('process_status_change', 'process_completed')
          AND ch.step_id = se.step_id
      ),
      'statistics', jsonb_build_object(
        'fields_count', se.fields_count,
        'activities_count', se.activities_count,
        'processes_count', se.processes_count,
        'total_events', se.total_events
      )
    )
    ORDER BY s.position ASC, se.entered_at ASC
  )
  INTO v_result
  FROM stage_events se
  LEFT JOIN public.steps s ON s.id = se.step_id;

  -- Retornar array vazio se não houver resultados
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.get_card_stage_summary(UUID, UUID) IS 'Retorna resumo agrupado por etapa do que aconteceu em cada etapa que o card passou, incluindo campos preenchidos, atividades e processos';
