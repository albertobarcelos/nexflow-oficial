-- =====================================================
-- SCRIPT COMPLETO PARA CORRIGIR PERMISSÕES DE NOTIFICAÇÕES
-- =====================================================
-- Este script garante que todas as permissões, políticas RLS
-- e funções auxiliares estão configuradas corretamente
-- para resolver os erros 403 (Forbidden)

-- =====================================================
-- ETAPA 1: GARANTIR FUNÇÃO AUXILIAR
-- =====================================================

-- Criar ou substituir função auxiliar para obter client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id 
  FROM public.core_client_users 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.get_user_client_id() IS 'Retorna o client_id do usuário autenticado. Retorna NULL se o usuário não existir em core_client_users.';

-- =====================================================
-- ETAPA 2: CONCEDER PERMISSÕES GRANT
-- =====================================================

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

-- =====================================================
-- ETAPA 3: REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- =====================================================

-- Remover políticas antigas de notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON nexflow.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON nexflow.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON nexflow.notifications;

-- Remover políticas antigas de user_notification_settings
DROP POLICY IF EXISTS "Users can view their own notification settings" ON nexflow.user_notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON nexflow.user_notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON nexflow.user_notification_settings;

-- =====================================================
-- ETAPA 4: CRIAR POLÍTICAS RLS CORRETAS
-- =====================================================

-- POLÍTICAS PARA NOTIFICAÇÕES

-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
    ON nexflow.notifications
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- Sistema pode inserir notificações (via triggers/functions)
CREATE POLICY "System can insert notifications"
    ON nexflow.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Usuários podem atualizar apenas suas próprias notificações (marcar como lida)
CREATE POLICY "Users can update their own notifications"
    ON nexflow.notifications
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- POLÍTICAS PARA CONFIGURAÇÕES DE NOTIFICAÇÕES

-- Usuários podem ver apenas suas próprias configurações
CREATE POLICY "Users can view their own notification settings"
    ON nexflow.user_notification_settings
    FOR SELECT
    TO authenticated
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
    TO authenticated
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
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND client_id = public.get_user_client_id()
        AND public.get_user_client_id() IS NOT NULL
    );

-- =====================================================
-- ETAPA 5: HABILITAR RLS (APENAS APÓS TUDO ESTAR CONFIGURADO)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE nexflow.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexflow.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- NOTA: As outras tabelas (card_messages, etc) já têm suas políticas
-- configuradas em outras migrations. Se necessário, habilite RLS nelas também:
-- ALTER TABLE nexflow.card_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_message_attachments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nexflow.card_attachments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ETAPA 6: VERIFICAR CONSTRAINT UNIQUE
-- =====================================================

-- Verificar e corrigir constraint UNIQUE em user_notification_settings
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_notification_settings_user_id_key'
        AND conrelid = 'nexflow.user_notification_settings'::regclass
    ) THEN
        ALTER TABLE nexflow.user_notification_settings
        DROP CONSTRAINT user_notification_settings_user_id_key;
    END IF;

    -- Adicionar nova constraint composta se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_notification_settings_user_id_client_id_key'
        AND conrelid = 'nexflow.user_notification_settings'::regclass
    ) THEN
        ALTER TABLE nexflow.user_notification_settings
        ADD CONSTRAINT user_notification_settings_user_id_client_id_key 
        UNIQUE (user_id, client_id);
    END IF;
END $$;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE nexflow.notifications IS 'Notificações para usuários. RLS habilitado com políticas para acesso baseado em user_id e client_id.';
COMMENT ON TABLE nexflow.user_notification_settings IS 'Configurações de notificações por usuário. RLS habilitado com políticas para acesso baseado em user_id e client_id.';

