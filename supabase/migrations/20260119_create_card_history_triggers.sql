-- =====================================================
-- TRIGGERS PARA RASTREAMENTO AUTOMÁTICO DE EVENTOS
-- =====================================================
-- Sistema completo de triggers para calcular duração
-- e rastrear todos os tipos de eventos automaticamente
-- =====================================================

-- =====================================================
-- FUNÇÃO: Calcular duração na etapa anterior
-- =====================================================
-- Calcula duration_seconds baseado no last_stage_change_at do card
-- ou no último evento stage_change do histórico
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

  -- Calcular duração se houver data anterior
  IF card_last_change IS NOT NULL THEN
    duration_calc := EXTRACT(EPOCH FROM (NEW.created_at - card_last_change))::INTEGER;
    NEW.duration_seconds := duration_calc;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Rastrear mudança de etapa
-- =====================================================
-- Cria evento stage_change no histórico quando step_id muda
CREATE OR REPLACE FUNCTION public.track_card_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  from_step_title TEXT;
  to_step_title TEXT;
  from_step_type TEXT;
  to_step_type TEXT;
  user_name TEXT;
  action_type_val TEXT;
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

  -- Criar evento no histórico
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
      'moved_at', NEW.updated_at
    ),
    COALESCE(NEW.updated_at, NOW())
  );

  -- Atualizar last_stage_change_at no card
  NEW.last_stage_change_at := COALESCE(NEW.updated_at, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Rastrear atualização de campos
-- =====================================================
-- Cria eventos field_update para cada campo alterado
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

      -- Criar evento no histórico
      INSERT INTO public.card_history (
        card_id,
        client_id,
        created_by,
        event_type,
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

-- =====================================================
-- FUNÇÃO: Rastrear mudança de status
-- =====================================================
-- Cria evento status_change quando status do card muda
CREATE OR REPLACE FUNCTION public.track_card_status_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Só processar se status mudou
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do usuário atual (via auth.uid())
  IF auth.uid() IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = auth.uid();
  END IF;

  -- Criar evento no histórico
  INSERT INTO public.card_history (
    card_id,
    client_id,
    created_by,
    event_type,
    previous_value,
    new_value,
    details,
    created_at
  ) VALUES (
    NEW.id,
    NEW.client_id,
    auth.uid(),
    'status_change',
    jsonb_build_object('status', OLD.status),
    jsonb_build_object('status', NEW.status),
    jsonb_build_object(
      'user_name', user_name,
      'changed_at', NEW.updated_at
    ),
    COALESCE(NEW.updated_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para calcular duration_seconds antes de inserir
DROP TRIGGER IF EXISTS trigger_calculate_stage_duration ON public.card_history;
CREATE TRIGGER trigger_calculate_stage_duration
BEFORE INSERT ON public.card_history
FOR EACH ROW
EXECUTE FUNCTION public.calculate_stage_duration();

-- Trigger para rastrear mudança de etapa
DROP TRIGGER IF EXISTS trigger_track_card_stage_change ON public.cards;
CREATE TRIGGER trigger_track_card_stage_change
AFTER UPDATE OF step_id ON public.cards
FOR EACH ROW
WHEN (OLD.step_id IS DISTINCT FROM NEW.step_id)
EXECUTE FUNCTION public.track_card_stage_change();

-- Trigger para rastrear atualização de campos
DROP TRIGGER IF EXISTS trigger_track_card_field_update ON public.cards;
CREATE TRIGGER trigger_track_card_field_update
AFTER UPDATE OF field_values ON public.cards
FOR EACH ROW
WHEN (OLD.field_values IS DISTINCT FROM NEW.field_values)
EXECUTE FUNCTION public.track_card_field_update();

-- Trigger para rastrear mudança de status
DROP TRIGGER IF EXISTS trigger_track_card_status_change ON public.cards;
CREATE TRIGGER trigger_track_card_status_change
AFTER UPDATE OF status ON public.cards
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.track_card_status_change();

-- Comentários
COMMENT ON FUNCTION public.calculate_stage_duration() IS 'Calcula duration_seconds baseado no last_stage_change_at do card ou último evento stage_change';
COMMENT ON FUNCTION public.track_card_stage_change() IS 'Cria evento stage_change no histórico quando step_id muda';
COMMENT ON FUNCTION public.track_card_field_update() IS 'Cria eventos field_update para cada campo alterado em field_values';
COMMENT ON FUNCTION public.track_card_status_change() IS 'Cria evento status_change quando status do card muda';
