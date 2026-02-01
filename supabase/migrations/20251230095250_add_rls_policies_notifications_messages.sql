-- =====================================================
-- POLÍTICAS RLS PARA NOTIFICAÇÕES E MENSAGENS
-- =====================================================
-- 
-- NOTA: O RLS está temporariamente desabilitado pela migration
-- 20251230103720_temporarily_disable_rls_notifications.sql
-- 
-- Para reativar o RLS depois de implementar as políticas, descomente
-- as linhas abaixo ou execute a migration de reativação.

-- Habilitar RLS nas tabelas (TEMPORARIAMENTE DESABILITADO)
-- ALTER TABLE nexflow.notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.user_notification_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_message_attachments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_attachments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA NOTIFICAÇÕES
-- =====================================================

-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
    ON nexflow.notifications
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- Sistema pode inserir notificações (via triggers)
CREATE POLICY "System can insert notifications"
    ON nexflow.notifications
    FOR INSERT
    WITH CHECK (true);

-- Usuários podem atualizar apenas suas próprias notificações (marcar como lida)
CREATE POLICY "Users can update their own notifications"
    ON nexflow.notifications
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- =====================================================
-- POLÍTICAS PARA CONFIGURAÇÕES DE NOTIFICAÇÕES
-- =====================================================

-- Usuários podem ver apenas suas próprias configurações
CREATE POLICY "Users can view their own notification settings"
    ON nexflow.user_notification_settings
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- Usuários podem inserir suas próprias configurações
CREATE POLICY "Users can insert their own notification settings"
    ON nexflow.user_notification_settings
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- Usuários podem atualizar suas próprias configurações
CREATE POLICY "Users can update their own notification settings"
    ON nexflow.user_notification_settings
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- =====================================================
-- POLÍTICAS PARA MENSAGENS
-- =====================================================

-- Usuários podem ver mensagens de cards que têm acesso
-- (verificando se têm acesso ao card através do flow/step)
CREATE POLICY "Users can view messages of accessible cards"
    ON nexflow.card_messages
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND public.get_user_client_id() IS NOT NULL
        AND client_id = public.get_user_client_id()
        AND EXISTS (
            SELECT 1 FROM nexflow.cards c
            WHERE c.id = card_messages.card_id
            AND c.client_id = public.get_user_client_id()
        )
    );

-- Usuários podem inserir mensagens em cards que têm acesso
CREATE POLICY "Users can insert messages in accessible cards"
    ON nexflow.card_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND public.get_user_client_id() IS NOT NULL
        AND client_id = public.get_user_client_id()
        AND EXISTS (
            SELECT 1 FROM nexflow.cards c
            WHERE c.id = card_messages.card_id
            AND c.client_id = public.get_user_client_id()
        )
    );

-- Usuários podem atualizar apenas suas próprias mensagens
CREATE POLICY "Users can update their own messages"
    ON nexflow.card_messages
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND public.get_user_client_id() IS NOT NULL
        AND client_id = public.get_user_client_id()
    );

-- Usuários podem deletar apenas suas próprias mensagens
CREATE POLICY "Users can delete their own messages"
    ON nexflow.card_messages
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND public.get_user_client_id() IS NOT NULL
        AND client_id = public.get_user_client_id()
    );

-- =====================================================
-- POLÍTICAS PARA ANEXOS DE MENSAGENS
-- =====================================================

-- Usuários podem ver anexos de mensagens que têm acesso
CREATE POLICY "Users can view message attachments of accessible messages"
    ON nexflow.card_message_attachments
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND public.get_user_client_id() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM nexflow.card_messages cm
            WHERE cm.id = card_message_attachments.message_id
            AND cm.client_id = public.get_user_client_id()
        )
    );

-- Usuários podem inserir anexos em suas próprias mensagens
CREATE POLICY "Users can insert attachments in their own messages"
    ON nexflow.card_message_attachments
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND public.get_user_client_id() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM nexflow.card_messages cm
            WHERE cm.id = card_message_attachments.message_id
            AND cm.user_id = auth.uid()
            AND cm.client_id = public.get_user_client_id()
        )
    );

-- Usuários podem deletar anexos de suas próprias mensagens
CREATE POLICY "Users can delete attachments of their own messages"
    ON nexflow.card_message_attachments
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND public.get_user_client_id() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM nexflow.card_messages cm
            WHERE cm.id = card_message_attachments.message_id
            AND cm.user_id = auth.uid()
            AND cm.client_id = public.get_user_client_id()
        )
    );

-- =====================================================
-- POLÍTICAS PARA ANEXOS DE CARDS
-- =====================================================

-- Usuários podem ver anexos de cards que têm acesso
CREATE POLICY "Users can view attachments of accessible cards"
    ON nexflow.card_attachments
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND public.get_user_client_id() IS NOT NULL
        AND client_id = public.get_user_client_id()
        AND EXISTS (
            SELECT 1 FROM nexflow.cards c
            WHERE c.id = card_attachments.card_id
            AND c.client_id = public.get_user_client_id()
        )
    );

-- Usuários podem inserir anexos em cards que têm acesso
CREATE POLICY "Users can insert attachments in accessible cards"
    ON nexflow.card_attachments
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND public.get_user_client_id() IS NOT NULL
        AND client_id = public.get_user_client_id()
        AND EXISTS (
            SELECT 1 FROM nexflow.cards c
            WHERE c.id = card_attachments.card_id
            AND c.client_id = public.get_user_client_id()
        )
    );

-- Usuários podem deletar anexos que eles próprios criaram
CREATE POLICY "Users can delete their own attachments"
    ON nexflow.card_attachments
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND public.get_user_client_id() IS NOT NULL
        AND client_id = public.get_user_client_id()
    );

