-- =====================================================
-- FUNÇÕES SQL PARA HISTÓRICO DE CARDS E CONTATOS
-- =====================================================
-- Funções que fazem joins explícitos e retornam JSON formatado
-- Resolvem problemas de schema cache do PostgREST
-- =====================================================

-- =====================================================
-- FUNÇÃO: get_card_timeline
-- =====================================================
-- Retorna timeline completa de eventos de um card
-- Inclui dados relacionados: user, steps, fields, activities
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_card_timeline(
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
BEGIN
  -- Validar que o card pertence ao client_id
  IF NOT EXISTS (
    SELECT 1 FROM public.cards 
    WHERE id = p_card_id AND client_id = p_client_id
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Buscar histórico com joins explícitos
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ch.id,
      'event_type', COALESCE(ch.event_type, 'stage_change'),
      'created_at', ch.created_at,
      'created_by', ch.created_by,
      'duration_seconds', ch.duration_seconds,
      'previous_value', ch.previous_value,
      'new_value', ch.new_value,
      'from_step_id', ch.from_step_id,
      'to_step_id', ch.to_step_id,
      'field_id', ch.field_id,
      'activity_id', ch.activity_id,
      'action_type', ch.action_type,
      'movement_direction', ch.movement_direction,
      'details', ch.details,
      -- User (created_by)
      'user', CASE 
        WHEN ch.created_by IS NOT NULL THEN
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'surname', u.surname,
            'email', u.email,
            'avatar_url', u.avatar_url
          )
        ELSE NULL
      END,
      -- From Step
      'from_step', CASE
        WHEN ch.from_step_id IS NOT NULL THEN
          jsonb_build_object(
            'id', fs.id,
            'title', fs.title,
            'color', fs.color,
            'position', fs.position
          )
        ELSE NULL
      END,
      -- To Step
      'to_step', CASE
        WHEN ch.to_step_id IS NOT NULL THEN
          jsonb_build_object(
            'id', ts.id,
            'title', ts.title,
            'color', ts.color,
            'position', ts.position
          )
        ELSE NULL
      END,
      -- Field
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
      -- Activity
      'activity', CASE
        WHEN ch.activity_id IS NOT NULL THEN
          jsonb_build_object(
            'id', ca.id,
            'title', ca.title,
            'start_at', ca.start_at,
            'end_at', ca.end_at
          )
        ELSE NULL
      END
    )
    ORDER BY ch.created_at ASC
  )
  INTO v_result
  FROM public.card_history ch
  LEFT JOIN public.core_client_users u ON u.id = ch.created_by
  LEFT JOIN public.steps fs ON fs.id = ch.from_step_id
  LEFT JOIN public.steps ts ON ts.id = ch.to_step_id
  LEFT JOIN public.step_fields sf ON sf.id = ch.field_id
  LEFT JOIN public.card_activities ca ON ca.id = ch.activity_id
  WHERE ch.card_id = p_card_id
    AND ch.client_id = p_client_id;

  -- Retornar array vazio se não houver resultados
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.get_card_timeline IS 'Retorna timeline completa de eventos de um card com dados relacionados (user, steps, fields, activities)';

-- =====================================================
-- FUNÇÃO: get_contact_history
-- =====================================================
-- Retorna resumo da jornada dos cards de um contato
-- Inclui etapa atual, tempo na etapa e eventos recentes
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_contact_history(
  p_contact_id UUID,
  p_client_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_card_record RECORD;
  v_card_summaries jsonb := '[]'::jsonb;
  v_time_in_stage INTEGER;
  v_reference_date TIMESTAMPTZ;
  v_events jsonb;
  v_total_events INTEGER;
BEGIN
  -- Validar que o contato pertence ao client_id
  IF NOT EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE id = p_contact_id AND client_id = p_client_id
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Iterar sobre todos os cards do contato
  FOR v_card_record IN
    SELECT 
      c.id,
      c.title,
      c.flow_id,
      c.step_id,
      c.status,
      c.last_stage_change_at,
      c.created_at,
      c.updated_at,
      f.name AS flow_name,
      s.id AS step_id,
      s.title AS step_title,
      s.color AS step_color,
      s.position AS step_position
    FROM public.cards c
    LEFT JOIN public.flows f ON f.id = c.flow_id
    LEFT JOIN public.steps s ON s.id = c.step_id
    WHERE c.contact_id = p_contact_id
      AND c.client_id = p_client_id
    ORDER BY c.updated_at DESC
  LOOP
    -- Calcular tempo na etapa atual
    v_reference_date := COALESCE(
      v_card_record.last_stage_change_at,
      v_card_record.created_at
    );
    
    IF v_reference_date IS NOT NULL THEN
      v_time_in_stage := EXTRACT(EPOCH FROM (NOW() - v_reference_date))::INTEGER;
    ELSE
      v_time_in_stage := 0;
    END IF;

    -- Buscar eventos recentes (últimos 10)
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ch.id,
        'event_type', COALESCE(ch.event_type, 'stage_change'),
        'created_at', ch.created_at,
        'created_by', ch.created_by,
        'duration_seconds', ch.duration_seconds,
        'previous_value', ch.previous_value,
        'new_value', ch.new_value,
        'from_step_id', ch.from_step_id,
        'to_step_id', ch.to_step_id,
        'field_id', ch.field_id,
        'activity_id', ch.activity_id,
        'action_type', ch.action_type,
        'movement_direction', ch.movement_direction,
        'details', ch.details,
        -- User
        'user', CASE 
          WHEN ch.created_by IS NOT NULL THEN
            jsonb_build_object(
              'id', u.id,
              'name', u.name,
              'surname', u.surname,
              'email', u.email,
              'avatar_url', u.avatar_url
            )
          ELSE NULL
        END,
        -- From Step
        'from_step', CASE
          WHEN ch.from_step_id IS NOT NULL THEN
            jsonb_build_object(
              'id', fs.id,
              'title', fs.title,
              'color', fs.color,
              'position', fs.position
            )
          ELSE NULL
        END,
        -- To Step
        'to_step', CASE
          WHEN ch.to_step_id IS NOT NULL THEN
            jsonb_build_object(
              'id', ts.id,
              'title', ts.title,
              'color', ts.color,
              'position', ts.position
            )
          ELSE NULL
        END,
        'field', NULL,
        'activity', NULL
      )
      ORDER BY ch.created_at ASC
    )
    INTO v_events
    FROM (
      SELECT ch.*
      FROM public.card_history ch
      LEFT JOIN public.core_client_users u ON u.id = ch.created_by
      LEFT JOIN public.steps fs ON fs.id = ch.from_step_id
      LEFT JOIN public.steps ts ON ts.id = ch.to_step_id
      WHERE ch.card_id = v_card_record.id
        AND ch.client_id = p_client_id
      ORDER BY ch.created_at DESC
      LIMIT 10
    ) ch
    LEFT JOIN public.core_client_users u ON u.id = ch.created_by
    LEFT JOIN public.steps fs ON fs.id = ch.from_step_id
    LEFT JOIN public.steps ts ON ts.id = ch.to_step_id;

    -- Buscar total de eventos
    SELECT COUNT(*) INTO v_total_events
    FROM public.card_history
    WHERE card_id = v_card_record.id
      AND client_id = p_client_id;

    -- Construir resumo do card
    v_card_summaries := v_card_summaries || jsonb_build_object(
      'card_id', v_card_record.id,
      'card_title', v_card_record.title,
      'flow_id', v_card_record.flow_id,
      'flow_name', COALESCE(v_card_record.flow_name, 'Flow desconhecido'),
      'current_step', CASE
        WHEN v_card_record.step_id IS NOT NULL THEN
          jsonb_build_object(
            'id', v_card_record.step_id,
            'title', v_card_record.step_title,
            'color', COALESCE(v_card_record.step_color, '#94a3b8'),
            'position', COALESCE(v_card_record.step_position, 0)
          )
        ELSE NULL
      END,
      'time_in_current_stage', v_time_in_stage,
      'last_updated', COALESCE(
        v_card_record.updated_at,
        v_card_record.created_at,
        NOW()
      ),
      'status', v_card_record.status,
      'events', COALESCE(v_events, '[]'::jsonb),
      'total_events', v_total_events,
      'last_event_type', CASE 
        WHEN v_events IS NOT NULL AND jsonb_array_length(v_events) > 0 THEN
          v_events->0->>'event_type'
        ELSE NULL
      END,
      'last_event_at', CASE
        WHEN v_events IS NOT NULL AND jsonb_array_length(v_events) > 0 THEN
          v_events->0->>'created_at'
        ELSE NULL
      END
    );
  END LOOP;

  RETURN v_card_summaries;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.get_contact_history IS 'Retorna resumo da jornada dos cards de um contato com etapa atual, tempo na etapa e eventos recentes';

-- Permissões
GRANT EXECUTE ON FUNCTION public.get_card_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_card_timeline TO anon;
GRANT EXECUTE ON FUNCTION public.get_contact_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_history TO anon;
