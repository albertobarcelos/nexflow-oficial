-- =====================================================
-- QUERIES DE TESTE PARA VALIDAR ACESSO ÀS TABELAS
-- =====================================================
-- Execute estas queries no Supabase SQL Editor
-- enquanto está autenticado como um usuário de teste
--
-- IMPORTANTE: Estas queries devem ser executadas como o usuário autenticado,
-- não como service_role. Use o SQL Editor do Supabase Dashboard.
--
-- NOTA: Se auth.uid() retornar NULL, você precisa executar como usuário autenticado.
-- No SQL Editor do Supabase, certifique-se de estar logado como um usuário válido.

-- =====================================================
-- TESTE 1: Verificar se a função auxiliar funciona
-- =====================================================

-- Esta query deve retornar o client_id do usuário autenticado
-- Se auth.uid() for NULL, você não está executando como usuário autenticado
DO $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE WARNING 'ERRO: auth.uid() é NULL. Você precisa executar estas queries como um usuário autenticado.';
        RAISE NOTICE 'Para testar como usuário autenticado, use o Supabase SQL Editor enquanto está logado,';
        RAISE NOTICE 'ou execute as queries através da API do Supabase com um token de autenticação válido.';
    ELSE
        RAISE NOTICE '✓ Usuário autenticado: %', auth.uid();
        RAISE NOTICE '✓ Client ID: %', public.get_user_client_id();
    END IF;
END $$;

SELECT 
    auth.uid() AS user_id,
    public.get_user_client_id() AS client_id,
    CASE 
        WHEN auth.uid() IS NULL THEN 'ERRO: Usuário não autenticado'
        WHEN public.get_user_client_id() IS NOT NULL THEN 'OK'
        ELSE 'ERRO: client_id é NULL (usuário pode não existir em core_client_users)'
    END AS status;

-- =====================================================
-- TESTE 2: Verificar acesso SELECT em notifications
-- =====================================================

-- Esta query deve retornar as notificações do usuário autenticado
-- Se retornar erro 403, as permissões ou políticas estão incorretas
SELECT 
    id,
    user_id,
    client_id,
    type,
    title,
    read,
    created_at
FROM nexflow.notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- TESTE 3: Verificar acesso SELECT em user_notification_settings
-- =====================================================

-- Esta query deve retornar as configurações do usuário autenticado
SELECT 
    id,
    user_id,
    client_id,
    notify_card_assigned,
    notify_mentions,
    email_notifications_enabled
FROM nexflow.user_notification_settings
WHERE user_id = auth.uid()
AND client_id = public.get_user_client_id();

-- =====================================================
-- TESTE 4: Verificar acesso INSERT (criar configuração de teste)
-- =====================================================

-- Esta query deve criar uma configuração de teste
-- Se retornar erro, a política INSERT está bloqueando
-- NOTA: Só executa se auth.uid() não for NULL
-- 
-- IMPORTANTE: Se auth.uid() for NULL, esta query falhará.
-- Execute apenas quando estiver autenticado como um usuário válido.

-- Verificar se pode executar
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 'ERRO: auth.uid() é NULL - você precisa estar autenticado'
        WHEN public.get_user_client_id() IS NULL THEN 'ERRO: client_id é NULL - usuário pode não existir em core_client_users'
        ELSE 'OK: Pode executar INSERT'
    END AS status_insert;

-- Executar INSERT apenas se auth.uid() não for NULL
-- Se você receber erro de NULL, significa que não está executando como usuário autenticado
INSERT INTO nexflow.user_notification_settings (
    user_id,
    client_id,
    notify_card_assigned,
    notify_mentions,
    email_notifications_enabled
)
SELECT 
    auth.uid(),
    public.get_user_client_id(),
    true,
    true,
    false
WHERE auth.uid() IS NOT NULL
AND public.get_user_client_id() IS NOT NULL
ON CONFLICT (user_id, client_id) 
DO UPDATE SET
    notify_card_assigned = EXCLUDED.notify_card_assigned,
    notify_mentions = EXCLUDED.notify_mentions,
    email_notifications_enabled = EXCLUDED.email_notifications_enabled
RETURNING *;

-- =====================================================
-- TESTE 5: Verificar acesso UPDATE (marcar notificação como lida)
-- =====================================================

-- Esta query deve atualizar uma notificação do usuário
-- Se não houver notificações, este teste será ignorado
UPDATE nexflow.notifications
SET 
    read = true,
    read_at = NOW()
WHERE id IN (
    SELECT id 
    FROM nexflow.notifications 
    WHERE user_id = auth.uid() 
    AND read = false
    LIMIT 1
)
AND user_id = auth.uid()
AND client_id = public.get_user_client_id()
RETURNING id, read, read_at;

-- =====================================================
-- TESTE 6: Verificar que usuário NÃO pode ver notificações de outros
-- =====================================================

-- Esta query deve retornar 0 linhas (segurança)
-- Se retornar linhas, há um problema de segurança nas políticas RLS
SELECT COUNT(*) AS notificacoes_de_outros_usuarios
FROM nexflow.notifications
WHERE user_id != auth.uid()
AND client_id = public.get_user_client_id();

-- =====================================================
-- TESTE 7: Verificar que usuário NÃO pode ver notificações de outros clientes
-- =====================================================

-- Esta query deve retornar 0 linhas (segurança multi-tenant)
-- Se retornar linhas, há um problema de segurança nas políticas RLS
SELECT COUNT(*) AS notificacoes_de_outros_clientes
FROM nexflow.notifications
WHERE user_id = auth.uid()
AND client_id != public.get_user_client_id();

-- =====================================================
-- TESTE 8: Resumo de Validação
-- =====================================================

-- Esta query retorna um resumo de todas as validações
SELECT 
    'Validação de Acesso às Notificações' AS teste,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'OK'
        ELSE 'ERRO: Usuário não autenticado'
    END AS usuario_autenticado,
    CASE 
        WHEN public.get_user_client_id() IS NOT NULL THEN 'OK'
        ELSE 'ERRO: client_id é NULL'
    END AS client_id_valido,
    (SELECT COUNT(*) FROM nexflow.notifications WHERE user_id = auth.uid()) AS minhas_notificacoes,
    (SELECT COUNT(*) FROM nexflow.user_notification_settings WHERE user_id = auth.uid()) AS minhas_configuracoes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM nexflow.notifications 
            WHERE user_id != auth.uid() 
            AND client_id = public.get_user_client_id()
        ) THEN 'ERRO: Vendo notificações de outros'
        ELSE 'OK: Isolamento de usuários funcionando'
    END AS isolamento_usuarios,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM nexflow.notifications 
            WHERE user_id = auth.uid() 
            AND client_id != public.get_user_client_id()
        ) THEN 'ERRO: Vendo notificações de outros clientes'
        ELSE 'OK: Isolamento de clientes funcionando'
    END AS isolamento_clientes;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

-- 1. Faça login no Supabase Dashboard
-- 2. Vá para SQL Editor
-- 3. Execute cada teste individualmente
-- 4. Verifique os resultados
-- 5. Se algum teste falhar, verifique:
--    - Se as migrations foram aplicadas
--    - Se o usuário existe em core_client_users
--    - Se o client_id está correto
--    - Se as políticas RLS estão corretas

