-- =====================================================
-- ATUALIZAR FUNÇÃO get_card_timeline
-- =====================================================
-- Atualiza get_card_timeline() para incluir step_id nos eventos
-- e adicionar informações da etapa nos eventos field_update
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
      'step_id', ch.step_id, -- Nova coluna para eventos field_update
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
      -- Step (para eventos field_update com step_id)
      'step', CASE
        WHEN ch.step_id IS NOT NULL THEN
          jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'color', s.color,
            'position', s.position
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
  LEFT JOIN public.steps s ON s.id = ch.step_id -- Join para step_id
  LEFT JOIN public.step_fields sf ON sf.id = ch.field_id
  LEFT JOIN public.card_activities ca ON ca.id = ch.activity_id
  WHERE ch.card_id = p_card_id
    AND ch.client_id = p_client_id;

  -- Retornar array vazio se não houver resultados
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Comentário atualizado
COMMENT ON FUNCTION public.get_card_timeline(UUID, UUID) IS 'Retorna timeline completa de eventos de um card, incluindo step_id para eventos field_update e informações da etapa';
