-- =====================================================
-- TRIGGERS PARA NOTIFICAÇÕES AUTOMÁTICAS
-- =====================================================
-- Triggers que criam notificações automaticamente quando:
-- 1. Card é atribuído a um usuário
-- 2. Usuário é mencionado em uma mensagem
-- 3. Novo card é criado em uma etapa configurada

-- Função para notificar quando card é atribuído
CREATE OR REPLACE FUNCTION nexflow.notify_card_assigned()
RETURNS TRIGGER AS $$
DECLARE
    card_title TEXT;
    card_flow_name TEXT;
    card_step_name TEXT;
    user_name TEXT;
BEGIN
    -- Verificar se assigned_to mudou e não é NULL
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
        -- Buscar informações do card
        SELECT c.title, f.name, s.title
        INTO card_title, card_flow_name, card_step_name
        FROM nexflow.cards c
        JOIN nexflow.flows f ON c.flow_id = f.id
        JOIN nexflow.steps s ON c.step_id = s.id
        WHERE c.id = NEW.id;
        
        -- Buscar nome do usuário atribuído
        SELECT COALESCE(cu.name || ' ' || cu.surname, cu.email, 'Usuário')
        INTO user_name
        FROM public.core_client_users cu
        WHERE cu.id = NEW.assigned_to;
        
        -- Verificar se o usuário quer receber notificações de cards atribuídos
        IF EXISTS (
            SELECT 1 FROM nexflow.user_notification_settings
            WHERE user_id = NEW.assigned_to
            AND notify_card_assigned = true
        ) THEN
            -- Criar notificação
            INSERT INTO nexflow.notifications (
                user_id,
                card_id,
                type,
                title,
                message,
                metadata,
                client_id
            ) VALUES (
                NEW.assigned_to,
                NEW.id,
                'card_assigned',
                'Card atribuído a você',
                COALESCE(card_title, 'Card sem título') || ' foi atribuído a você no fluxo ' || COALESCE(card_flow_name, '') || ', etapa ' || COALESCE(card_step_name, ''),
                jsonb_build_object(
                    'flow_id', NEW.flow_id,
                    'step_id', NEW.step_id,
                    'card_title', card_title
                ),
                NEW.client_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cards atribuídos
DROP TRIGGER IF EXISTS trigger_notify_card_assigned ON nexflow.cards;
CREATE TRIGGER trigger_notify_card_assigned
    AFTER INSERT OR UPDATE OF assigned_to ON nexflow.cards
    FOR EACH ROW
    EXECUTE FUNCTION nexflow.notify_card_assigned();

-- Função para notificar quando usuário é mencionado em mensagem
CREATE OR REPLACE FUNCTION nexflow.notify_message_mention()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user_id UUID;
    card_title TEXT;
    sender_name TEXT;
    message_preview TEXT;
BEGIN
    -- Se há menções na mensagem
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        -- Buscar título do card
        SELECT c.title INTO card_title
        FROM nexflow.cards c
        WHERE c.id = NEW.card_id;
        
        -- Buscar nome do remetente
        SELECT COALESCE(cu.name || ' ' || cu.surname, cu.email, 'Usuário')
        INTO sender_name
        FROM public.core_client_users cu
        WHERE cu.id = NEW.user_id;
        
        -- Preview da mensagem (primeiros 100 caracteres)
        message_preview := LEFT(COALESCE(NEW.content, ''), 100);
        IF LENGTH(COALESCE(NEW.content, '')) > 100 THEN
            message_preview := message_preview || '...';
        END IF;
        
        -- Criar notificação para cada usuário mencionado
        FOREACH mentioned_user_id IN ARRAY NEW.mentions
        LOOP
            -- Verificar se o usuário quer receber notificações de menções
            IF EXISTS (
                SELECT 1 FROM nexflow.user_notification_settings
                WHERE user_id = mentioned_user_id
                AND notify_mentions = true
            ) AND mentioned_user_id != NEW.user_id THEN -- Não notificar o próprio remetente
                INSERT INTO nexflow.notifications (
                    user_id,
                    card_id,
                    message_id,
                    type,
                    title,
                    message,
                    metadata,
                    client_id
                ) VALUES (
                    mentioned_user_id,
                    NEW.card_id,
                    NEW.id,
                    'message_mention',
                    'Você foi mencionado',
                    sender_name || ' mencionou você em ' || COALESCE(card_title, 'um card') || ': ' || message_preview,
                    jsonb_build_object(
                        'card_id', NEW.card_id,
                        'message_id', NEW.id,
                        'sender_id', NEW.user_id,
                        'sender_name', sender_name
                    ),
                    NEW.client_id
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para menções em mensagens
DROP TRIGGER IF EXISTS trigger_notify_message_mention ON nexflow.card_messages;
CREATE TRIGGER trigger_notify_message_mention
    AFTER INSERT ON nexflow.card_messages
    FOR EACH ROW
    EXECUTE FUNCTION nexflow.notify_message_mention();

-- Função para notificar quando novo card é criado em etapa configurada
CREATE OR REPLACE FUNCTION nexflow.notify_new_card_in_stage()
RETURNS TRIGGER AS $$
DECLARE
    user_setting RECORD;
    step_id_in_array BOOLEAN;
    card_title TEXT;
    flow_name TEXT;
    step_name TEXT;
BEGIN
    -- Para cada usuário com configurações de notificação
    FOR user_setting IN
        SELECT * FROM nexflow.user_notification_settings
        WHERE client_id = NEW.client_id
        AND notify_new_cards_in_stages IS NOT NULL
        AND jsonb_array_length(notify_new_cards_in_stages) > 0
    LOOP
        -- Verificar se o step_id está no array de notificações
        step_id_in_array := EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(user_setting.notify_new_cards_in_stages) AS step_id_text
            WHERE step_id_text::uuid = NEW.step_id
        );
        
        IF step_id_in_array THEN
            -- Buscar informações do card, flow e step
            SELECT c.title, f.name, s.title
            INTO card_title, flow_name, step_name
            FROM nexflow.cards c
            JOIN nexflow.flows f ON c.flow_id = f.id
            JOIN nexflow.steps s ON c.step_id = s.id
            WHERE c.id = NEW.id;
            
            -- Criar notificação
            INSERT INTO nexflow.notifications (
                user_id,
                card_id,
                type,
                title,
                message,
                metadata,
                client_id
            ) VALUES (
                user_setting.user_id,
                NEW.id,
                'new_card_in_stage',
                'Novo card na etapa ' || COALESCE(step_name, ''),
                'Um novo card "' || COALESCE(card_title, 'sem título') || '" foi criado na etapa "' || COALESCE(step_name, '') || '" do fluxo "' || COALESCE(flow_name, '') || '"',
                jsonb_build_object(
                    'flow_id', NEW.flow_id,
                    'step_id', NEW.step_id,
                    'card_title', card_title
                ),
                NEW.client_id
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para novos cards em etapas configuradas
DROP TRIGGER IF EXISTS trigger_notify_new_card_in_stage ON nexflow.cards;
CREATE TRIGGER trigger_notify_new_card_in_stage
    AFTER INSERT ON nexflow.cards
    FOR EACH ROW
    EXECUTE FUNCTION nexflow.notify_new_card_in_stage();

-- Comentários
COMMENT ON FUNCTION nexflow.notify_card_assigned() IS 'Cria notificação quando um card é atribuído a um usuário';
COMMENT ON FUNCTION nexflow.notify_message_mention() IS 'Cria notificações quando usuários são mencionados em mensagens';
COMMENT ON FUNCTION nexflow.notify_new_card_in_stage() IS 'Cria notificações quando novos cards são criados em etapas configuradas pelo usuário';


