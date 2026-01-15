-- =====================================================
-- CORREÇÃO DOS TRIGGERS DE ATIVIDADES E PROCESSOS
-- =====================================================
-- Corrige os triggers para usar event_type na coluna
-- ao invés de apenas em details, permitindo que
-- get_card_timeline identifique corretamente os eventos
-- =====================================================

-- =====================================================
-- CORRIGIR: track_activity_created
-- =====================================================
CREATE OR REPLACE FUNCTION public.track_activity_created()
RETURNS TRIGGER AS $$
DECLARE
  card_client_id UUID;
  user_name TEXT;
BEGIN
  -- Buscar client_id do card
  SELECT client_id INTO card_client_id
  FROM public.cards
  WHERE id = NEW.card_id;

  IF card_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do usuário criador
  IF NEW.creator_id IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = NEW.creator_id;
  END IF;

  -- Criar evento no histórico
  INSERT INTO public.card_history (
    card_id,
    client_id,
    created_by,
    event_type,
    activity_id,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    NEW.creator_id,
    'activity',
    NEW.id,
    jsonb_build_object(
      'activity_title', NEW.title,
      'activity_action', 'created',
      'activity_type_id', NEW.activity_type_id,
      'start_at', NEW.start_at,
      'end_at', NEW.end_at,
      'assignee_id', NEW.assignee_id,
      'creator_id', NEW.creator_id,
      'user_name', user_name,
      'created_at', NEW.created_at
    ),
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORRIGIR: track_activity_completed
-- =====================================================
CREATE OR REPLACE FUNCTION public.track_activity_completed()
RETURNS TRIGGER AS $$
DECLARE
  card_client_id UUID;
  user_name TEXT;
BEGIN
  -- Só processar se completed mudou de false para true
  IF NOT (OLD.completed = false AND NEW.completed = true) THEN
    RETURN NEW;
  END IF;

  -- Buscar client_id do card
  SELECT client_id INTO card_client_id
  FROM public.cards
  WHERE id = NEW.card_id;

  IF card_client_id IS NULL THEN
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
    activity_id,
    previous_value,
    new_value,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    auth.uid(),
    'activity',
    NEW.id,
    jsonb_build_object(
      'completed', OLD.completed,
      'completed_at', OLD.completed_at
    ),
    jsonb_build_object(
      'completed', NEW.completed,
      'completed_at', NEW.completed_at
    ),
    jsonb_build_object(
      'activity_title', NEW.title,
      'activity_action', 'completed',
      'user_name', user_name,
      'completed_at', NEW.completed_at
    ),
    COALESCE(NEW.completed_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORRIGIR: track_activity_updated
-- =====================================================
CREATE OR REPLACE FUNCTION public.track_activity_updated()
RETURNS TRIGGER AS $$
DECLARE
  card_client_id UUID;
  user_name TEXT;
  has_changes BOOLEAN := false;
  previous_values JSONB := '{}'::jsonb;
  new_values JSONB := '{}'::jsonb;
BEGIN
  -- Ignorar se apenas completed mudou (já tratado por track_activity_completed)
  IF OLD.completed IS DISTINCT FROM NEW.completed THEN
    RETURN NEW;
  END IF;

  -- Verificar se houve mudanças relevantes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    has_changes := true;
    previous_values := previous_values || jsonb_build_object('title', OLD.title);
    new_values := new_values || jsonb_build_object('title', NEW.title);
  END IF;

  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    has_changes := true;
    previous_values := previous_values || jsonb_build_object('assignee_id', OLD.assignee_id);
    new_values := new_values || jsonb_build_object('assignee_id', NEW.assignee_id);
  END IF;

  IF OLD.start_at IS DISTINCT FROM NEW.start_at THEN
    has_changes := true;
    previous_values := previous_values || jsonb_build_object('start_at', OLD.start_at);
    new_values := new_values || jsonb_build_object('start_at', NEW.start_at);
  END IF;

  IF OLD.end_at IS DISTINCT FROM NEW.end_at THEN
    has_changes := true;
    previous_values := previous_values || jsonb_build_object('end_at', OLD.end_at);
    new_values := new_values || jsonb_build_object('end_at', NEW.end_at);
  END IF;

  -- Se não houve mudanças relevantes, não criar evento
  IF NOT has_changes THEN
    RETURN NEW;
  END IF;

  -- Buscar client_id do card
  SELECT client_id INTO card_client_id
  FROM public.cards
  WHERE id = NEW.card_id;

  IF card_client_id IS NULL THEN
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
    activity_id,
    previous_value,
    new_value,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    auth.uid(),
    'activity',
    NEW.id,
    previous_values,
    new_values,
    jsonb_build_object(
      'activity_title', NEW.title,
      'activity_action', 'updated',
      'user_name', user_name,
      'updated_at', NEW.updated_at
    ),
    NEW.updated_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORRIGIR: track_process_status_change
-- =====================================================
CREATE OR REPLACE FUNCTION public.track_process_status_change()
RETURNS TRIGGER AS $$
DECLARE
  card_client_id UUID;
  step_action_title TEXT;
  user_name TEXT;
BEGIN
  -- Só processar se status mudou
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buscar client_id do card
  SELECT client_id INTO card_client_id
  FROM public.cards
  WHERE id = NEW.card_id;

  IF card_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar título do processo (step_action)
  SELECT title INTO step_action_title
  FROM public.step_actions
  WHERE id = NEW.step_action_id;

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
    NEW.card_id,
    card_client_id,
    auth.uid(),
    'process_status_change',
    jsonb_build_object(
      'status', OLD.status,
      'completed_at', OLD.completed_at,
      'completed_by', OLD.completed_by
    ),
    jsonb_build_object(
      'status', NEW.status,
      'completed_at', NEW.completed_at,
      'completed_by', NEW.completed_by
    ),
    jsonb_build_object(
      'process_id', NEW.id,
      'step_action_id', NEW.step_action_id,
      'process_title', COALESCE(step_action_title, 'Processo'),
      'user_name', user_name,
      'changed_at', COALESCE(NEW.updated_at, NOW())
    ),
    COALESCE(NEW.updated_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORRIGIR: track_process_completed
-- =====================================================
CREATE OR REPLACE FUNCTION public.track_process_completed()
RETURNS TRIGGER AS $$
DECLARE
  card_client_id UUID;
  step_action_title TEXT;
  user_name TEXT;
  completed_by_name TEXT;
BEGIN
  -- Só processar se status mudou para 'completed'
  IF NOT (OLD.status != 'completed' AND NEW.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Buscar client_id do card
  SELECT client_id INTO card_client_id
  FROM public.cards
  WHERE id = NEW.card_id;

  IF card_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar título do processo (step_action)
  SELECT title INTO step_action_title
  FROM public.step_actions
  WHERE id = NEW.step_action_id;

  -- Buscar nome do usuário atual (via auth.uid())
  IF auth.uid() IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = auth.uid();
  END IF;

  -- Buscar nome do usuário que completou (se diferente)
  IF NEW.completed_by IS NOT NULL AND NEW.completed_by != auth.uid() THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO completed_by_name
    FROM public.core_client_users
    WHERE id = NEW.completed_by;
  END IF;

  -- Criar evento adicional de conclusão (além do status_change)
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
    NEW.card_id,
    card_client_id,
    COALESCE(NEW.completed_by, auth.uid()),
    'process_completed',
    jsonb_build_object(
      'status', OLD.status,
      'completed_at', OLD.completed_at,
      'completed_by', OLD.completed_by
    ),
    jsonb_build_object(
      'status', NEW.status,
      'completed_at', NEW.completed_at,
      'completed_by', NEW.completed_by
    ),
    jsonb_build_object(
      'process_id', NEW.id,
      'step_action_id', NEW.step_action_id,
      'process_title', COALESCE(step_action_title, 'Processo'),
      'completed_by_name', COALESCE(completed_by_name, user_name),
      'user_name', user_name
    ),
    COALESCE(NEW.completed_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON FUNCTION public.track_activity_created() IS 'Cria evento activity no histórico quando uma atividade é criada (corrigido para usar event_type na coluna)';
COMMENT ON FUNCTION public.track_activity_completed() IS 'Cria evento activity no histórico quando uma atividade é concluída (corrigido para usar event_type na coluna)';
COMMENT ON FUNCTION public.track_activity_updated() IS 'Cria evento activity no histórico quando uma atividade é atualizada (corrigido para usar event_type na coluna)';
COMMENT ON FUNCTION public.track_process_status_change() IS 'Cria evento process_status_change no histórico quando status de um processo muda (corrigido para usar event_type na coluna)';
COMMENT ON FUNCTION public.track_process_completed() IS 'Cria evento process_completed no histórico quando um processo é concluído (corrigido para usar event_type na coluna)';
