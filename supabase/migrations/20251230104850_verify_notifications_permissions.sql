-- =====================================================
-- SCRIPT DE VERIFICAÇÃO DE PERMISSÕES E POLÍTICAS RLS
-- =====================================================
-- Execute este script para verificar se todas as permissões
-- e políticas estão configuradas corretamente

-- =====================================================
-- VERIFICAÇÃO 1: FUNÇÃO AUXILIAR
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'get_user_client_id'
    ) THEN
        RAISE NOTICE '✓ Função get_user_client_id() existe';
    ELSE
        RAISE WARNING '✗ Função get_user_client_id() NÃO existe';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO 2: PERMISSÕES GRANT
-- =====================================================

-- Verificar permissões para authenticated
DO $$
DECLARE
    has_select BOOLEAN;
    has_insert BOOLEAN;
    has_update BOOLEAN;
    has_delete BOOLEAN;
BEGIN
    -- Verificar permissões em notifications
    SELECT 
        has_table_privilege('authenticated', 'nexflow.notifications', 'SELECT'),
        has_table_privilege('authenticated', 'nexflow.notifications', 'INSERT'),
        has_table_privilege('authenticated', 'nexflow.notifications', 'UPDATE'),
        has_table_privilege('authenticated', 'nexflow.notifications', 'DELETE')
    INTO has_select, has_insert, has_update, has_delete;
    
    IF has_select AND has_insert AND has_update AND has_delete THEN
        RAISE NOTICE '✓ Permissões GRANT em nexflow.notifications para authenticated: OK';
    ELSE
        RAISE WARNING '✗ Permissões GRANT em nexflow.notifications para authenticated: FALTANDO';
        RAISE NOTICE '  SELECT: %, INSERT: %, UPDATE: %, DELETE: %', has_select, has_insert, has_update, has_delete;
    END IF;
    
    -- Verificar permissões em user_notification_settings
    SELECT 
        has_table_privilege('authenticated', 'nexflow.user_notification_settings', 'SELECT'),
        has_table_privilege('authenticated', 'nexflow.user_notification_settings', 'INSERT'),
        has_table_privilege('authenticated', 'nexflow.user_notification_settings', 'UPDATE'),
        has_table_privilege('authenticated', 'nexflow.user_notification_settings', 'DELETE')
    INTO has_select, has_insert, has_update, has_delete;
    
    IF has_select AND has_insert AND has_update AND has_delete THEN
        RAISE NOTICE '✓ Permissões GRANT em nexflow.user_notification_settings para authenticated: OK';
    ELSE
        RAISE WARNING '✗ Permissões GRANT em nexflow.user_notification_settings para authenticated: FALTANDO';
        RAISE NOTICE '  SELECT: %, INSERT: %, UPDATE: %, DELETE: %', has_select, has_insert, has_update, has_delete;
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO 3: STATUS DO RLS
-- =====================================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    -- Verificar RLS em notifications
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'nexflow'
    AND c.relname = 'notifications';
    
    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS está HABILITADO em nexflow.notifications';
    ELSE
        RAISE WARNING '✗ RLS está DESABILITADO em nexflow.notifications';
    END IF;
    
    -- Verificar RLS em user_notification_settings
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'nexflow'
    AND c.relname = 'user_notification_settings';
    
    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS está HABILITADO em nexflow.user_notification_settings';
    ELSE
        RAISE WARNING '✗ RLS está DESABILITADO em nexflow.user_notification_settings';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO 4: POLÍTICAS RLS EXISTENTES
-- =====================================================

DO $$
DECLARE
    policy_count INTEGER;
    policy_name TEXT;
BEGIN
    -- Contar políticas em notifications
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'nexflow'
    AND tablename = 'notifications';
    
    RAISE NOTICE 'Políticas RLS em nexflow.notifications: %', policy_count;
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✓ Número adequado de políticas RLS';
    ELSE
        RAISE WARNING '✗ Número insuficiente de políticas RLS (esperado: 3, encontrado: %)', policy_count;
    END IF;
    
    -- Listar políticas
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies
        WHERE schemaname = 'nexflow'
        AND tablename = 'notifications'
    LOOP
        RAISE NOTICE '  - Política: %', policy_name;
    END LOOP;
    
    -- Contar políticas em user_notification_settings
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'nexflow'
    AND tablename = 'user_notification_settings';
    
    RAISE NOTICE 'Políticas RLS em nexflow.user_notification_settings: %', policy_count;
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✓ Número adequado de políticas RLS';
    ELSE
        RAISE WARNING '✗ Número insuficiente de políticas RLS (esperado: 3, encontrado: %)', policy_count;
    END IF;
    
    -- Listar políticas
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies
        WHERE schemaname = 'nexflow'
        AND tablename = 'user_notification_settings'
    LOOP
        RAISE NOTICE '  - Política: %', policy_name;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICAÇÃO 5: CONSTRAINT UNIQUE
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_notification_settings_user_id_client_id_key'
        AND conrelid = 'nexflow.user_notification_settings'::regclass
    ) THEN
        RAISE NOTICE '✓ Constraint UNIQUE(user_id, client_id) existe em user_notification_settings';
    ELSE
        RAISE WARNING '✗ Constraint UNIQUE(user_id, client_id) NÃO existe em user_notification_settings';
    END IF;
END $$;

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT 
    'Verificação de Permissões e Políticas RLS' AS titulo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'get_user_client_id'
        ) THEN 'OK' 
        ELSE 'FALTANDO' 
    END AS funcao_auxiliar,
    CASE 
        WHEN has_table_privilege('authenticated', 'nexflow.notifications', 'SELECT') 
        AND has_table_privilege('authenticated', 'nexflow.notifications', 'INSERT')
        AND has_table_privilege('authenticated', 'nexflow.notifications', 'UPDATE')
        AND has_table_privilege('authenticated', 'nexflow.notifications', 'DELETE')
        THEN 'OK'
        ELSE 'FALTANDO'
    END AS permissoes_notifications,
    CASE 
        WHEN (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'nexflow' AND c.relname = 'notifications')
        THEN 'HABILITADO'
        ELSE 'DESABILITADO'
    END AS rls_status_notifications,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'nexflow' AND tablename = 'notifications') AS num_politicas_notifications;

