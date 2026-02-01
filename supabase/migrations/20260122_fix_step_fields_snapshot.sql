-- =====================================================
-- CORRIGIR LÓGICA DO SNAPSHOT DE CAMPOS
-- =====================================================
-- Corrige a lógica do snapshot no trigger track_card_stage_change()
-- para buscar quando o campo foi preenchido de forma mais robusta
-- =====================================================

CREATE OR REPLACE FUNCTION public.track_card_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  from_step_title TEXT;
  to_step_title TEXT;
  from_step_type TEXT;
  to_step_type TEXT;
  user_name TEXT;
  action_type_val TEXT;
  fields_filled JSONB := '[]'::jsonb;
  field_key TEXT;
  field_value JSONB;
  field_record RECORD;
  field_filled_at TEXT;
BEGIN
  -- Só processar se step_id realmente mudou
  IF OLD.step_id IS NOT DISTINCT FROM NEW.step_id THEN
    RETURN NEW;
  END IF;

  -- Buscar informações dos steps
  SELECT title, step_type INTO from_step_title, from_step_type
  FROM public.steps
  WHERE id = OLD.step_id;

  SELECT title, step_type INTO to_step_title, to_step_type
  FROM public.steps
  WHERE id = NEW.step_id;

  -- Buscar nome do usuário atual (via auth.uid())
  IF auth.uid() IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = auth.uid();
  END IF;

  -- Determinar action_type baseado no tipo de step de destino
  action_type_val := 'move';
  IF to_step_type = 'finisher' THEN
    action_type_val := 'complete';
  ELSIF to_step_type = 'fail' THEN
    action_type_val := 'cancel';
  END IF;

  -- Capturar snapshot dos campos preenchidos na etapa anterior
  -- Buscar todos os campos que pertencem à etapa anterior (OLD.step_id)
  -- e que estão preenchidos no field_values do card
  IF OLD.step_id IS NOT NULL AND OLD.field_values IS NOT NULL THEN
    FOR field_key IN 
      SELECT jsonb_object_keys(OLD.field_values)
    LOOP
      field_value := OLD.field_values->field_key;
      
      -- Só incluir se o campo tem valor (não null, não vazio)
      IF field_value IS NOT NULL AND field_value != 'null'::jsonb AND field_value != '""'::jsonb THEN
        -- Tentar encontrar informações do campo
        SELECT id, label INTO field_record
        FROM public.step_fields
        WHERE (slug = field_key OR id::text = field_key)
          AND step_id = OLD.step_id
        LIMIT 1;

        -- Buscar quando o campo foi preenchido de forma mais robusta
        -- Primeiro: buscar em eventos field_update com step_id
        -- Segundo: buscar em qualquer evento field_update do campo (sem step_id)
        -- Fallback: usar updated_at do card
        SELECT COALESCE(
          -- Tentar buscar com field_id e step_id
          (SELECT created_at::text 
           FROM public.card_history 
           WHERE card_id = OLD.id 
             AND event_type = 'field_update'
             AND field_id IS NOT NULL
             AND field_id = field_record.id
             AND step_id = OLD.step_id
           ORDER BY created_at DESC 
           LIMIT 1),
          -- Se não encontrar, buscar apenas com field_id (sem step_id)
          (SELECT created_at::text 
           FROM public.card_history 
           WHERE card_id = OLD.id 
             AND event_type = 'field_update'
             AND field_id IS NOT NULL
             AND field_id = field_record.id
           ORDER BY created_at DESC 
           LIMIT 1),
          -- Se ainda não encontrar, buscar por field_key em details
          (SELECT created_at::text 
           FROM public.card_history 
           WHERE card_id = OLD.id 
             AND event_type = 'field_update'
             AND details->>'field_key' = field_key
           ORDER BY created_at DESC 
           LIMIT 1),
          -- Fallback: usar updated_at do card
          OLD.updated_at::text
        ) INTO field_filled_at;

        -- Adicionar campo ao array de campos preenchidos
        fields_filled := fields_filled || jsonb_build_object(
          'field_id', COALESCE(field_record.id::text, field_key),
          'field_key', field_key,
          'field_label', COALESCE(field_record.label, field_key),
          'value', field_value,
          'filled_at', field_filled_at
        );
      END IF;
    END LOOP;
  END IF;

  -- Criar evento no histórico com snapshot de campos
  INSERT INTO public.card_history (
    card_id,
    client_id,
    from_step_id,
    to_step_id,
    created_by,
    event_type,
    action_type,
    details,
    created_at
  ) VALUES (
    NEW.id,
    NEW.client_id,
    OLD.step_id,
    NEW.step_id,
    auth.uid(),
    'stage_change',
    action_type_val,
    jsonb_build_object(
      'from_step_title', from_step_title,
      'from_step_type', from_step_type,
      'to_step_title', to_step_title,
      'to_step_type', to_step_type,
      'user_name', user_name,
      'moved_at', NEW.updated_at,
      'fields_filled', fields_filled
    ),
    COALESCE(NEW.updated_at, NOW())
  );

  -- Atualizar last_stage_change_at no card
  NEW.last_stage_change_at := COALESCE(NEW.updated_at, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário atualizado
COMMENT ON FUNCTION public.track_card_stage_change() IS 'Cria evento stage_change no histórico quando step_id muda, incluindo snapshot dos campos preenchidos na etapa anterior (lógica corrigida para buscar filled_at de forma mais robusta)';
