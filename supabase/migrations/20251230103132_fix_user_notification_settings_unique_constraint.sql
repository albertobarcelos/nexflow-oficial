-- =====================================================
-- CORRIGIR CONSTRAINT UNIQUE EM user_notification_settings
-- =====================================================
-- A constraint atual é UNIQUE(user_id), mas deveria ser
-- UNIQUE(user_id, client_id) para permitir que um usuário
-- tenha configurações diferentes para diferentes clientes

-- Remover a constraint antiga se existir
ALTER TABLE nexflow.user_notification_settings
DROP CONSTRAINT IF EXISTS user_notification_settings_user_id_key;

-- Adicionar a nova constraint composta
ALTER TABLE nexflow.user_notification_settings
ADD CONSTRAINT user_notification_settings_user_id_client_id_key 
UNIQUE (user_id, client_id);

