-- =====================================================
-- ADICIONAR step_id AOS EVENTOS field_update
-- =====================================================
-- Modifica o trigger track_card_field_update() para armazenar
-- step_id quando um campo é atualizado, permitindo associar
-- cada campo preenchido à etapa onde foi preenchido
-- =====================================================

CREATE OR REPLACE FUNCTION public.track_card_field_update()
RETURNS TRIGGER AS $$
DECLARE
  field_key TEXT;
  old_value JSONB;
  new_value JSONB;
  field_record RECORD;
  user_name TEXT;
BEGIN
  -- Só processar se field_values mudou
  IF OLD.field_values IS NOT DISTINCT FROM NEW.field_values THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do usuário atual (via auth.uid())
  IF auth.uid() IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = auth.uid();
  END IF;

  -- Comparar field_values antigo e novo
  FOR field_key IN 
    SELECT DISTINCT key 
    FROM (
      SELECT jsonb_object_keys(COALESCE(OLD.field_values, '{}'::jsonb)) AS key
      UNION
      SELECT jsonb_object_keys(COALESCE(NEW.field_values, '{}'::jsonb)) AS key
    ) AS all_keys
  LOOP
    old_value := OLD.field_values->field_key;
    new_value := NEW.field_values->field_key;

    -- Só criar evento se o valor realmente mudou
    IF old_value IS DISTINCT FROM new_value THEN
      -- Tentar encontrar field_id pelo slug ou ID
      SELECT id INTO field_record
      FROM public.step_fields
      WHERE (slug = field_key OR id::text = field_key)
        AND step_id = NEW.step_id
      LIMIT 1;

      -- Criar evento no histórico com step_id
      INSERT INTO public.card_history (
        card_id,
        client_id,
        created_by,
        event_type,
        step_id,
        field_id,
        previous_value,
        new_value,
        details,
        created_at
      ) VALUES (
        NEW.id,
        NEW.client_id,
        auth.uid(),
        'field_update',
        NEW.step_id, -- Armazenar etapa onde o campo foi preenchido
        field_record.id,
        jsonb_build_object('value', old_value),
        jsonb_build_object('value', new_value),
        jsonb_build_object(
          'field_key', field_key,
          'field_label', COALESCE(field_record.label, field_key),
          'user_name', user_name,
          'updated_at', NEW.updated_at
        ),
        COALESCE(NEW.updated_at, NOW())
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário atualizado
COMMENT ON FUNCTION public.track_card_field_update() IS 'Cria eventos field_update para cada campo alterado em field_values, armazenando step_id para associar o campo à etapa onde foi preenchido';
