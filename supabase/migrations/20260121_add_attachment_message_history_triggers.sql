-- =====================================================
-- TRIGGERS PARA RASTREAMENTO DE ANEXOS E MENSAGENS
-- =====================================================
-- Sistema de triggers para registrar automaticamente
-- eventos relacionados a anexos e mensagens no card_history
-- =====================================================

-- =====================================================
-- FUNÇÃO: Rastrear upload de anexo
-- =====================================================
-- Cria evento 'attachment_uploaded' quando arquivo é anexado
CREATE OR REPLACE FUNCTION public.track_attachment_uploaded()
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

  -- Buscar nome do usuário
  IF NEW.user_id IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = NEW.user_id;
  END IF;

  -- Criar evento no histórico
  INSERT INTO public.card_history (
    card_id,
    client_id,
    created_by,
    event_type,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    NEW.user_id,
    'attachment_uploaded',
    jsonb_build_object(
      'attachment_id', NEW.id,
      'file_name', NEW.file_name,
      'file_size', NEW.file_size,
      'file_type', NEW.file_type,
      'file_url', NEW.file_url,
      'user_name', user_name,
      'uploaded_at', NEW.created_at
    ),
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Rastrear criação de mensagem/comentário
-- =====================================================
-- Cria evento 'message_created' quando mensagem é criada
CREATE OR REPLACE FUNCTION public.track_message_created()
RETURNS TRIGGER AS $$
DECLARE
  card_client_id UUID;
  user_name TEXT;
  content_preview TEXT;
BEGIN
  -- Buscar client_id do card
  SELECT client_id INTO card_client_id
  FROM public.cards
  WHERE id = NEW.card_id;

  IF card_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do usuário
  IF NEW.user_id IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = NEW.user_id;
  END IF;

  -- Criar preview do conteúdo (primeiros 100 caracteres)
  IF NEW.content IS NOT NULL AND LENGTH(NEW.content) > 0 THEN
    content_preview := LEFT(NEW.content, 100);
    IF LENGTH(NEW.content) > 100 THEN
      content_preview := content_preview || '...';
    END IF;
  END IF;

  -- Criar evento no histórico
  INSERT INTO public.card_history (
    card_id,
    client_id,
    created_by,
    event_type,
    details,
    created_at
  ) VALUES (
    NEW.card_id,
    card_client_id,
    NEW.user_id,
    'message_created',
    jsonb_build_object(
      'message_id', NEW.id,
      'message_type', NEW.message_type,
      'content_preview', content_preview,
      'has_file', NEW.file_url IS NOT NULL,
      'file_name', NEW.file_name,
      'file_size', NEW.file_size,
      'file_type', NEW.file_type,
      'has_mentions', COALESCE(array_length(NEW.mentions, 1), 0) > 0,
      'mentions_count', COALESCE(array_length(NEW.mentions, 1), 0),
      'reply_to_id', NEW.reply_to_id,
      'user_name', user_name,
      'created_at', NEW.created_at
    ),
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATUALIZAR CONSTRAINT DE event_type
-- =====================================================
-- Adicionar novos tipos de eventos à constraint CHECK
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
  'process_completed',
  'attachment_uploaded',
  'message_created'
));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para rastrear upload de anexo
DROP TRIGGER IF EXISTS trigger_track_attachment_uploaded ON public.card_attachments;
CREATE TRIGGER trigger_track_attachment_uploaded
AFTER INSERT ON public.card_attachments
FOR EACH ROW
EXECUTE FUNCTION public.track_attachment_uploaded();

-- Trigger para rastrear criação de mensagem
DROP TRIGGER IF EXISTS trigger_track_message_created ON public.card_messages;
CREATE TRIGGER trigger_track_message_created
AFTER INSERT ON public.card_messages
FOR EACH ROW
EXECUTE FUNCTION public.track_message_created();

-- Comentários
COMMENT ON FUNCTION public.track_attachment_uploaded() IS 'Cria evento attachment_uploaded no histórico quando um arquivo é anexado ao card';
COMMENT ON FUNCTION public.track_message_created() IS 'Cria evento message_created no histórico quando uma mensagem/comentário é criado no card';
