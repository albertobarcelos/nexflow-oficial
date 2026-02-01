-- =====================================================
-- DESABILITAR RLS TEMPORARIAMENTE NAS TABELAS DE NOTIFICAÇÕES
-- =====================================================
-- Esta migration desabilita o RLS temporariamente para permitir
-- que a aplicação funcione enquanto as políticas são implementadas.
-- 
-- ATENÇÃO: Reative o RLS depois de aplicar as migrations:
-- - 20251230103131_create_get_user_client_id_function.sql
-- - 20251230103132_fix_user_notification_settings_unique_constraint.sql
-- - 20251230095250_add_rls_policies_notifications_messages.sql (atualizada)
--
-- Para reativar, execute:
-- ALTER TABLE nexflow.notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.user_notification_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_message_attachments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_attachments ENABLE ROW LEVEL SECURITY;

-- Desabilitar RLS nas tabelas de notificações
ALTER TABLE nexflow.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE nexflow.user_notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE nexflow.card_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE nexflow.card_message_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE nexflow.card_attachments DISABLE ROW LEVEL SECURITY;

-- Comentário para documentar
COMMENT ON TABLE nexflow.notifications IS 'RLS temporariamente desabilitado - será reativado após implementação das políticas';
COMMENT ON TABLE nexflow.user_notification_settings IS 'RLS temporariamente desabilitado - será reativado após implementação das políticas';

