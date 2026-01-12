-- =====================================================
-- TRIGGER PARA NOTIFICAÇÕES DE ATIVIDADES ATRIBUÍDAS
-- =====================================================
-- Cria notificações automaticamente quando uma atividade
-- é atribuída a um usuário diferente do criador
-- =====================================================

-- Função para notificar quando atividade é atribuída
CREATE OR REPLACE FUNCTION public.notify_activity_assigned()
RETURNS TRIGGER AS $$
DECLARE
    card_title TEXT;
    flow_name TEXT;
    activity_title TEXT;
    creator_name TEXT;
BEGIN
    -- Verificar se deve notificar:
    -- 1. Na criação: assignee_id != creator_id
    -- 2. No update: assignee_id mudou e é diferente de creator_id
    IF (
        (TG_OP = 'INSERT' AND NEW.assignee_id IS NOT NULL AND NEW.assignee_id != NEW.creator_id)
        OR 
        (TG_OP = 'UPDATE' AND NEW.assignee_id IS NOT NULL 
         AND NEW.assignee_id != NEW.creator_id 
         AND (OLD.assignee_id IS NULL OR NEW.assignee_id != OLD.assignee_id))
    ) THEN
        -- Buscar informações do card e flow
        SELECT c.title, f.name
        INTO card_title, flow_name
        FROM public.cards c
        JOIN public.flows f ON c.flow_id = f.id
        WHERE c.id = NEW.card_id;
        
        -- Buscar nome do criador
        SELECT COALESCE(cu.name || ' ' || cu.surname, cu.email, 'Usuário')
        INTO creator_name
        FROM public.core_client_users cu
        WHERE cu.id = NEW.creator_id;
        
        -- Verificar se o usuário quer receber notificações de cards atribuídos
        -- (usando a mesma configuração de notify_card_assigned)
        IF EXISTS (
            SELECT 1 FROM public.user_notification_settings
            WHERE user_id = NEW.assignee_id
            AND notify_card_assigned = true
        ) THEN
            -- Criar notificação
            INSERT INTO public.notifications (
                user_id,
                card_id,
                type,
                title,
                message,
                metadata,
                client_id
            ) VALUES (
                NEW.assignee_id,
                NEW.card_id,
                'activity_assigned',
                'Nova atividade atribuída',
                creator_name || ' atribuiu a atividade "' || COALESCE(NEW.title, 'sem título') || '" a você no card "' || COALESCE(card_title, 'sem título') || '" do fluxo "' || COALESCE(flow_name, '') || '"',
                jsonb_build_object(
                    'activity_id', NEW.id,
                    'card_id', NEW.card_id,
                    'flow_id', (SELECT flow_id FROM public.cards WHERE id = NEW.card_id),
                    'activity_title', NEW.title,
                    'card_title', card_title,
                    'start_at', NEW.start_at,
                    'end_at', NEW.end_at
                ),
                NEW.client_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atividades atribuídas
DROP TRIGGER IF EXISTS trigger_notify_activity_assigned ON public.card_activities;
CREATE TRIGGER trigger_notify_activity_assigned
    AFTER INSERT OR UPDATE OF assignee_id ON public.card_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_activity_assigned();

-- Comentário
COMMENT ON FUNCTION public.notify_activity_assigned() IS 'Cria notificação quando uma atividade é atribuída a um usuário diferente do criador';
