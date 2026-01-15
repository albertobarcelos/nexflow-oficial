-- =====================================================
-- FUNÇÃO: get_stage_fields
-- =====================================================
-- Busca todos os campos preenchidos em uma etapa específica
-- Considera eventos field_update e field_values do card
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_stage_fields(
  p_card_id UUID,
  p_step_id UUID,
  p_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_field_record RECORD;
  v_field_update RECORD;
  v_fields_map JSONB := '{}'::jsonb;
  v_field_key TEXT;
  v_field_value JSONB;
BEGIN
  -- Validar que o card existe
  IF NOT EXISTS (
    SELECT 1 FROM public.cards 
    WHERE id = p_card_id
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Buscar todos os eventos field_update para esta etapa até o timestamp
  FOR v_field_update IN
    SELECT 
      ch.id,
      ch.field_id,
      ch.new_value,
      ch.created_at,
      ch.details,
      sf.label as field_label,
      sf.slug as field_slug,
      sf.field_type
    FROM public.card_history ch
    LEFT JOIN public.step_fields sf ON sf.id = ch.field_id
    WHERE ch.card_id = p_card_id
      AND ch.event_type = 'field_update'
      AND ch.step_id = p_step_id
      AND ch.created_at <= p_timestamp
    ORDER BY ch.created_at ASC
  LOOP
    -- Extrair field_key do details ou usar slug do step_field
    v_field_key := COALESCE(
      v_field_update.details->>'field_key',
      v_field_update.field_slug,
      v_field_update.field_id::text
    );
    
    -- Extrair valor do new_value
    v_field_value := v_field_update.new_value->'value';
    
    -- Adicionar ao mapa (último valor vence)
    v_fields_map := v_fields_map || jsonb_build_object(
      v_field_key,
      jsonb_build_object(
        'field_id', v_field_update.field_id::text,
        'field_key', v_field_key,
        'field_label', COALESCE(v_field_update.field_label, v_field_key),
        'field_type', v_field_update.field_type,
        'value', v_field_value,
        'filled_at', v_field_update.created_at::text,
        'event_id', v_field_update.id::text
      )
    );
  END LOOP;

  -- Converter mapa para array (ordenar por filled_at)
  SELECT jsonb_agg(
    jsonb_build_object(
      'field_id', field_data->>'field_id',
      'field_key', field_data->>'field_key',
      'field_label', field_data->>'field_label',
      'field_type', field_data->>'field_type',
      'value', field_data->'value',
      'filled_at', field_data->>'filled_at',
      'event_id', field_data->>'event_id'
    )
    ORDER BY (field_data->>'filled_at')::timestamptz ASC
  )
  INTO v_result
  FROM jsonb_each(v_fields_map) AS t(key, field_data);

  -- Retornar array vazio se não houver resultados
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.get_stage_fields(UUID, UUID, TIMESTAMPTZ) IS 'Busca todos os campos preenchidos em uma etapa específica até um timestamp, considerando eventos field_update com step_id';
