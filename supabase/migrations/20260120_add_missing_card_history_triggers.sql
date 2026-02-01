-- =====================================================
-- TRIGGERS PARA RASTREAMENTO DE ALTERAÇÕES ADICIONAIS
-- =====================================================
-- Sistema de triggers para registrar automaticamente
-- todas as alterações de cards que ainda não estavam sendo rastreadas
-- =====================================================

-- =====================================================
-- FUNÇÃO: Rastrear alteração de título
-- =====================================================
-- Cria evento 'title_change' quando título do card muda
CREATE OR REPLACE FUNCTION public.track_card_title_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Só processar se título mudou
  IF OLD.title IS NOT DISTINCT FROM NEW.title THEN
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
    'title_change',
    jsonb_build_object('title', OLD.title),
    jsonb_build_object('title', NEW.title),
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
-- FUNÇÃO: Rastrear alteração de checklist
-- =====================================================
-- Cria evento 'checklist_change' quando checklist_progress muda
CREATE OR REPLACE FUNCTION public.track_card_checklist_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  old_checklist JSONB;
  new_checklist JSONB;
  checklist_changes JSONB := '{}'::jsonb;
  has_changes BOOLEAN := false;
BEGIN
  -- Só processar se checklist_progress mudou
  IF OLD.checklist_progress IS NOT DISTINCT FROM NEW.checklist_progress THEN
    RETURN NEW;
  END IF;

  old_checklist := COALESCE(OLD.checklist_progress, '{}'::jsonb);
  new_checklist := COALESCE(NEW.checklist_progress, '{}'::jsonb);

  -- Verificar se realmente houve mudanças significativas
  IF old_checklist = new_checklist THEN
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
    'checklist_change',
    jsonb_build_object('checklist_progress', old_checklist),
    jsonb_build_object('checklist_progress', new_checklist),
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
-- FUNÇÃO: Rastrear alteração de responsável
-- =====================================================
-- Cria evento 'assignee_change' quando assigned_to ou assigned_team_id muda
CREATE OR REPLACE FUNCTION public.track_card_assignee_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  old_assignee_type TEXT;
  new_assignee_type TEXT;
  old_assignee_name TEXT;
  new_assignee_name TEXT;
  old_team_name TEXT;
  new_team_name TEXT;
BEGIN
  -- Só processar se assigned_to ou assigned_team_id mudou
  IF OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to 
     AND OLD.assigned_team_id IS NOT DISTINCT FROM NEW.assigned_team_id THEN
    RETURN NEW;
  END IF;

  -- Determinar tipo de responsável antigo
  IF OLD.assigned_to IS NOT NULL THEN
    old_assignee_type := 'user';
    SELECT COALESCE(name || ' ' || surname, email) INTO old_assignee_name
    FROM public.core_client_users
    WHERE id = OLD.assigned_to;
  ELSIF OLD.assigned_team_id IS NOT NULL THEN
    old_assignee_type := 'team';
    SELECT name INTO old_team_name
    FROM public.teams
    WHERE id = OLD.assigned_team_id;
  ELSE
    old_assignee_type := 'unassigned';
  END IF;

  -- Determinar tipo de responsável novo
  IF NEW.assigned_to IS NOT NULL THEN
    new_assignee_type := 'user';
    SELECT COALESCE(name || ' ' || surname, email) INTO new_assignee_name
    FROM public.core_client_users
    WHERE id = NEW.assigned_to;
  ELSIF NEW.assigned_team_id IS NOT NULL THEN
    new_assignee_type := 'team';
    SELECT name INTO new_team_name
    FROM public.teams
    WHERE id = NEW.assigned_team_id;
  ELSE
    new_assignee_type := 'unassigned';
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
    'assignee_change',
    jsonb_build_object(
      'assigned_to', OLD.assigned_to,
      'assigned_team_id', OLD.assigned_team_id,
      'assignee_type', old_assignee_type,
      'assignee_name', COALESCE(old_assignee_name, old_team_name, 'Não atribuído')
    ),
    jsonb_build_object(
      'assigned_to', NEW.assigned_to,
      'assigned_team_id', NEW.assigned_team_id,
      'assignee_type', new_assignee_type,
      'assignee_name', COALESCE(new_assignee_name, new_team_name, 'Não atribuído')
    ),
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
-- FUNÇÃO: Rastrear alteração de produto/valor
-- =====================================================
-- Cria evento 'product_value_change' quando product ou value muda
CREATE OR REPLACE FUNCTION public.track_card_product_value_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  has_changes BOOLEAN := false;
  previous_values JSONB := '{}'::jsonb;
  new_values JSONB := '{}'::jsonb;
BEGIN
  -- Verificar se product mudou
  IF OLD.product IS DISTINCT FROM NEW.product THEN
    has_changes := true;
    previous_values := previous_values || jsonb_build_object('product', OLD.product);
    new_values := new_values || jsonb_build_object('product', NEW.product);
  END IF;

  -- Verificar se value mudou
  IF OLD.value IS DISTINCT FROM NEW.value THEN
    has_changes := true;
    previous_values := previous_values || jsonb_build_object('value', OLD.value);
    new_values := new_values || jsonb_build_object('value', NEW.value);
  END IF;

  -- Se não houve mudanças, não criar evento
  IF NOT has_changes THEN
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
    'product_value_change',
    previous_values,
    new_values,
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
-- FUNÇÃO: Rastrear alteração de parent card
-- =====================================================
-- Cria evento 'parent_change' quando parent_card_id muda
CREATE OR REPLACE FUNCTION public.track_card_parent_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  old_parent_title TEXT;
  new_parent_title TEXT;
BEGIN
  -- Só processar se parent_card_id mudou
  IF OLD.parent_card_id IS NOT DISTINCT FROM NEW.parent_card_id THEN
    RETURN NEW;
  END IF;

  -- Buscar título do parent antigo (se existir)
  IF OLD.parent_card_id IS NOT NULL THEN
    SELECT title INTO old_parent_title
    FROM public.cards
    WHERE id = OLD.parent_card_id;
  END IF;

  -- Buscar título do parent novo (se existir)
  IF NEW.parent_card_id IS NOT NULL THEN
    SELECT title INTO new_parent_title
    FROM public.cards
    WHERE id = NEW.parent_card_id;
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
    'parent_change',
    jsonb_build_object(
      'parent_card_id', OLD.parent_card_id,
      'parent_title', old_parent_title
    ),
    jsonb_build_object(
      'parent_card_id', NEW.parent_card_id,
      'parent_title', new_parent_title
    ),
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
-- FUNÇÃO: Rastrear alteração de agents
-- =====================================================
-- Cria evento 'agents_change' quando agents muda
CREATE OR REPLACE FUNCTION public.track_card_agents_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  old_agents JSONB;
  new_agents JSONB;
BEGIN
  -- Só processar se agents mudou
  IF OLD.agents IS NOT DISTINCT FROM NEW.agents THEN
    RETURN NEW;
  END IF;

  old_agents := COALESCE(OLD.agents, '[]'::jsonb);
  new_agents := COALESCE(NEW.agents, '[]'::jsonb);

  -- Verificar se realmente houve mudanças
  IF old_agents = new_agents THEN
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
    'agents_change',
    jsonb_build_object('agents', old_agents),
    jsonb_build_object('agents', new_agents),
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
-- ATUALIZAR CONSTRAINT DE event_type
-- =====================================================
-- Adicionar novos tipos de eventos à constraint CHECK
-- Primeiro, remover a constraint antiga (pode ter nome gerado automaticamente)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar nome da constraint CHECK de event_type
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.card_history'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%event_type%';
  
  -- Se encontrou, remover
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.card_history DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

-- Adicionar nova constraint com todos os tipos de eventos
ALTER TABLE public.card_history
ADD CONSTRAINT card_history_event_type_check 
CHECK (event_type IS NULL OR event_type IN (
  'stage_change',
  'field_update',
  'activity',
  'status_change',
  'freeze',
  'unfreeze',
  'checklist_completed',
  'title_change',
  'checklist_change',
  'assignee_change',
  'product_value_change',
  'parent_change',
  'agents_change',
  'process_status_change',
  'process_completed'
));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para rastrear alteração de título
DROP TRIGGER IF EXISTS trigger_track_card_title_change ON public.cards;
CREATE TRIGGER trigger_track_card_title_change
AFTER UPDATE OF title ON public.cards
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title)
EXECUTE FUNCTION public.track_card_title_change();

-- Trigger para rastrear alteração de checklist
DROP TRIGGER IF EXISTS trigger_track_card_checklist_change ON public.cards;
CREATE TRIGGER trigger_track_card_checklist_change
AFTER UPDATE OF checklist_progress ON public.cards
FOR EACH ROW
WHEN (OLD.checklist_progress IS DISTINCT FROM NEW.checklist_progress)
EXECUTE FUNCTION public.track_card_checklist_change();

-- Trigger para rastrear alteração de responsável
DROP TRIGGER IF EXISTS trigger_track_card_assignee_change ON public.cards;
CREATE TRIGGER trigger_track_card_assignee_change
AFTER UPDATE OF assigned_to, assigned_team_id ON public.cards
FOR EACH ROW
WHEN (
  OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
  OR OLD.assigned_team_id IS DISTINCT FROM NEW.assigned_team_id
)
EXECUTE FUNCTION public.track_card_assignee_change();

-- Trigger para rastrear alteração de produto/valor
DROP TRIGGER IF EXISTS trigger_track_card_product_value_change ON public.cards;
CREATE TRIGGER trigger_track_card_product_value_change
AFTER UPDATE OF product, value ON public.cards
FOR EACH ROW
WHEN (
  OLD.product IS DISTINCT FROM NEW.product
  OR OLD.value IS DISTINCT FROM NEW.value
)
EXECUTE FUNCTION public.track_card_product_value_change();

-- Trigger para rastrear alteração de parent card
DROP TRIGGER IF EXISTS trigger_track_card_parent_change ON public.cards;
CREATE TRIGGER trigger_track_card_parent_change
AFTER UPDATE OF parent_card_id ON public.cards
FOR EACH ROW
WHEN (OLD.parent_card_id IS DISTINCT FROM NEW.parent_card_id)
EXECUTE FUNCTION public.track_card_parent_change();

-- Trigger para rastrear alteração de agents
DROP TRIGGER IF EXISTS trigger_track_card_agents_change ON public.cards;
CREATE TRIGGER trigger_track_card_agents_change
AFTER UPDATE OF agents ON public.cards
FOR EACH ROW
WHEN (OLD.agents IS DISTINCT FROM NEW.agents)
EXECUTE FUNCTION public.track_card_agents_change();

-- Comentários
COMMENT ON FUNCTION public.track_card_title_change() IS 'Cria evento title_change no histórico quando título do card muda';
COMMENT ON FUNCTION public.track_card_checklist_change() IS 'Cria evento checklist_change no histórico quando checklist_progress muda';
COMMENT ON FUNCTION public.track_card_assignee_change() IS 'Cria evento assignee_change no histórico quando assigned_to ou assigned_team_id muda';
COMMENT ON FUNCTION public.track_card_product_value_change() IS 'Cria evento product_value_change no histórico quando product ou value muda';
COMMENT ON FUNCTION public.track_card_parent_change() IS 'Cria evento parent_change no histórico quando parent_card_id muda';
COMMENT ON FUNCTION public.track_card_agents_change() IS 'Cria evento agents_change no histórico quando agents muda';
