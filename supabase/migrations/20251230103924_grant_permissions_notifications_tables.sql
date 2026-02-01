-- =====================================================
-- CONCEDER PERMISSÕES NAS TABELAS DE NOTIFICAÇÕES
-- =====================================================
-- Esta migration concede permissões necessárias para acessar
-- as tabelas de notificações para os roles authenticated e service_role

-- Conceder permissões para authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.user_notification_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.card_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.card_message_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.card_attachments TO authenticated;

-- Conceder permissões para service_role (necessário para Edge Functions)
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.user_notification_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.card_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.card_message_attachments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.card_attachments TO service_role;

-- Conceder permissões de uso nas sequências (se houver)
-- Isso é necessário para INSERTs que usam DEFAULT gen_random_uuid()
-- Mas como estamos usando UUIDs, não precisamos de sequências

-- Comentários
COMMENT ON TABLE nexflow.notifications IS 'Permissões concedidas para authenticated e service_role';
COMMENT ON TABLE nexflow.user_notification_settings IS 'Permissões concedidas para authenticated e service_role';
COMMENT ON TABLE nexflow.card_messages IS 'Permissões concedidas para authenticated e service_role';
COMMENT ON TABLE nexflow.card_message_attachments IS 'Permissões concedidas para authenticated e service_role';
COMMENT ON TABLE nexflow.card_attachments IS 'Permissões concedidas para authenticated e service_role';

