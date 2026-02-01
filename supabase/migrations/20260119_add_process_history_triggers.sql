-- =====================================================
-- TRIGGERS PARA RASTREAMENTO DE PROCESSOS NO HISTÓRICO
-- =====================================================
-- Sistema de triggers para registrar automaticamente
-- eventos relacionados a processos (card_step_actions) no card_history
-- =====================================================

-- =====================================================
-- FUNÇÃO: Rastrear mudança de status de processo
-- =====================================================
-- Cria evento 'process_status_change' quando status de um processo muda
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
    action_type,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    auth.uid(),
    'process',
    jsonb_build_object(
      'event_type', 'process_status_change',
      'process_id', NEW.id,
      'step_action_id', NEW.step_action_id,
      'process_title', COALESCE(step_action_title, 'Processo'),
      'previous_value', jsonb_build_object(
        'status', OLD.status,
        'completed_at', OLD.completed_at,
        'completed_by', OLD.completed_by
      ),
      'new_value', jsonb_build_object(
        'status', NEW.status,
        'completed_at', NEW.completed_at,
        'completed_by', NEW.completed_by
      ),
      'user_name', user_name,
      'changed_at', COALESCE(NEW.updated_at, NOW())
    ),
    COALESCE(NEW.updated_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Rastrear conclusão de processo
-- =====================================================
-- Cria evento especial quando processo é concluído
-- (pode ser usado para eventos adicionais além do status_change)
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
    action_type,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    COALESCE(NEW.completed_by, auth.uid()),
    'process',
    jsonb_build_object(
      'event_type', 'process_completed',
      'process_id', NEW.id,
      'step_action_id', NEW.step_action_id,
      'process_title', COALESCE(step_action_title, 'Processo'),
      'completed_at', NEW.completed_at,
      'completed_by', NEW.completed_by,
      'completed_by_name', COALESCE(completed_by_name, user_name),
      'user_name', user_name
    ),
    COALESCE(NEW.completed_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para rastrear mudança de status de processo
DROP TRIGGER IF EXISTS trigger_track_process_status_change ON public.card_step_actions;
CREATE TRIGGER trigger_track_process_status_change
AFTER UPDATE OF status ON public.card_step_actions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.track_process_status_change();

-- Trigger para rastrear conclusão de processo
DROP TRIGGER IF EXISTS trigger_track_process_completed ON public.card_step_actions;
CREATE TRIGGER trigger_track_process_completed
AFTER UPDATE OF status ON public.card_step_actions
FOR EACH ROW
WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION public.track_process_completed();

-- Comentários
COMMENT ON FUNCTION public.track_process_status_change() IS 'Cria evento process_status_change no histórico quando status de um processo muda';
COMMENT ON FUNCTION public.track_process_completed() IS 'Cria evento process_completed no histórico quando um processo é concluído';
