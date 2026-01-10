-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES
-- =====================================================
-- Tabelas para gerenciar notificações de cards atribuídos,
-- menções em mensagens e configurações por usuário

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS nexflow.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.core_client_users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES nexflow.cards(id) ON DELETE CASCADE,
    message_id UUID, -- Será referenciado após criar a tabela card_messages
    type TEXT NOT NULL CHECK (type IN ('card_assigned', 'card_mentioned', 'new_card_in_stage', 'message_mention')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_id UUID NOT NULL
);

-- Tabela de configurações de notificações por usuário
CREATE TABLE IF NOT EXISTS nexflow.user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.core_client_users(id) ON DELETE CASCADE,
    notify_card_assigned BOOLEAN NOT NULL DEFAULT true,
    notify_mentions BOOLEAN NOT NULL DEFAULT true,
    notify_new_cards_in_stages JSONB DEFAULT '[]'::jsonb, -- Array de step_ids
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_id UUID NOT NULL,
    UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON nexflow.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON nexflow.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_card_id ON nexflow.notifications(card_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON nexflow.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON nexflow.notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON nexflow.user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_client_id ON nexflow.user_notification_settings(client_id);

-- Comentários
COMMENT ON TABLE nexflow.notifications IS 'Notificações para usuários sobre cards atribuídos, menções e novos cards em etapas';
COMMENT ON COLUMN nexflow.notifications.type IS 'Tipo de notificação: card_assigned, card_mentioned, new_card_in_stage, message_mention';
COMMENT ON COLUMN nexflow.notifications.metadata IS 'Dados adicionais como step_id, flow_id, etc';
COMMENT ON TABLE nexflow.user_notification_settings IS 'Configurações de notificações por usuário';
COMMENT ON COLUMN nexflow.user_notification_settings.notify_new_cards_in_stages IS 'Array de step_ids para os quais o usuário quer receber notificações de novos cards';

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION nexflow.update_user_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_user_notification_settings_updated_at
    BEFORE UPDATE ON nexflow.user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION nexflow.update_user_notification_settings_updated_at();




