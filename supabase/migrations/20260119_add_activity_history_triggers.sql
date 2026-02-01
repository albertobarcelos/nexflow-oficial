-- =====================================================
-- TRIGGERS PARA RASTREAMENTO DE ATIVIDADES NO HISTÓRICO
-- =====================================================
-- Sistema de triggers para registrar automaticamente
-- eventos relacionados a atividades (card_activities) no card_history
-- =====================================================

-- =====================================================
-- FUNÇÃO: Rastrear criação de atividade
-- =====================================================
-- Cria evento 'activity' quando uma atividade é criada
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
    action_type,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    NEW.creator_id,
    'activity',
    jsonb_build_object(
      'event_type', 'activity',
      'activity_id', NEW.id,
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
-- FUNÇÃO: Rastrear conclusão de atividade
-- =====================================================
-- Cria evento 'activity' quando uma atividade é concluída
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
    action_type,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    auth.uid(),
    'activity',
    jsonb_build_object(
      'event_type', 'activity',
      'activity_id', NEW.id,
      'activity_title', NEW.title,
      'activity_action', 'completed',
      'previous_value', jsonb_build_object(
        'completed', OLD.completed,
        'completed_at', OLD.completed_at
      ),
      'new_value', jsonb_build_object(
        'completed', NEW.completed,
        'completed_at', NEW.completed_at
      ),
      'user_name', user_name,
      'completed_at', NEW.completed_at
    ),
    COALESCE(NEW.completed_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Rastrear atualização de atividade
-- =====================================================
-- Cria evento 'activity' quando uma atividade é atualizada
-- (assignee, datas, título, etc) - exceto conclusão
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
    action_type,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    auth.uid(),
    'activity',
    jsonb_build_object(
      'event_type', 'activity',
      'activity_id', NEW.id,
      'activity_title', NEW.title,
      'activity_action', 'updated',
      'previous_value', previous_values,
      'new_value', new_values,
      'user_name', user_name,
      'updated_at', NEW.updated_at
    ),
    NEW.updated_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para rastrear criação de atividade
DROP TRIGGER IF EXISTS trigger_track_activity_created ON public.card_activities;
CREATE TRIGGER trigger_track_activity_created
AFTER INSERT ON public.card_activities
FOR EACH ROW
EXECUTE FUNCTION public.track_activity_created();

-- Trigger para rastrear conclusão de atividade
DROP TRIGGER IF EXISTS trigger_track_activity_completed ON public.card_activities;
CREATE TRIGGER trigger_track_activity_completed
AFTER UPDATE OF completed ON public.card_activities
FOR EACH ROW
WHEN (OLD.completed IS DISTINCT FROM NEW.completed AND NEW.completed = true)
EXECUTE FUNCTION public.track_activity_completed();

-- Trigger para rastrear atualização de atividade
DROP TRIGGER IF EXISTS trigger_track_activity_updated ON public.card_activities;
CREATE TRIGGER trigger_track_activity_updated
AFTER UPDATE ON public.card_activities
FOR EACH ROW
WHEN (
  OLD.completed IS NOT DISTINCT FROM NEW.completed
  AND (
    OLD.title IS DISTINCT FROM NEW.title
    OR OLD.assignee_id IS DISTINCT FROM NEW.assignee_id
    OR OLD.start_at IS DISTINCT FROM NEW.start_at
    OR OLD.end_at IS DISTINCT FROM NEW.end_at
  )
)
EXECUTE FUNCTION public.track_activity_updated();

-- Comentários
COMMENT ON FUNCTION public.track_activity_created() IS 'Cria evento activity no histórico quando uma atividade é criada';
COMMENT ON FUNCTION public.track_activity_completed() IS 'Cria evento activity no histórico quando uma atividade é concluída';
COMMENT ON FUNCTION public.track_activity_updated() IS 'Cria evento activity no histórico quando uma atividade é atualizada (exceto conclusão)';
