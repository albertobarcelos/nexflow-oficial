-- =====================================================
-- ATUALIZAR CHECK CONSTRAINT DE NOTIFICAÇÕES
-- =====================================================
-- Adiciona o tipo 'activity_assigned' ao CHECK constraint
-- da tabela notifications
-- =====================================================

-- Remover constraint antigo
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Adicionar novo constraint com 'activity_assigned'
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'card_assigned', 
    'card_mentioned', 
    'new_card_in_stage', 
    'message_mention',
    'activity_assigned'
));

-- Comentário atualizado
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificação: card_assigned, card_mentioned, new_card_in_stage, message_mention, activity_assigned';
