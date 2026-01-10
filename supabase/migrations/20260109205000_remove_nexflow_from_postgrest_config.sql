-- =====================================================
-- MIGRATION: Remover Schema Nexflow da Configuração PostgREST
-- =====================================================
-- O schema nexflow foi migrado para public, então não deve mais
-- estar na lista de schemas expostos pelo PostgREST.
-- =====================================================

-- Atualizar db_schemas (schemas expostos)
-- Removendo 'nexflow' da lista, mantendo apenas: public, nexhunters, graphql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, nexhunters, graphql';

-- Atualizar db_extra_search_path (search path adicional)
-- Removendo 'nexflow' da lista, mantendo apenas: public, extensions, nexhunters
-- Nota: O search path padrão já inclui public, então removemos nexflow
ALTER ROLE authenticator SET pgrst.db_extra_search_path = 'public, extensions, nexhunters';

-- Verificar a configuração atual
DO $$
DECLARE
    current_schemas TEXT;
    current_search_path TEXT;
BEGIN
    SELECT 
        COALESCE((SELECT option_value FROM pg_options_to_table(rolconfig) WHERE option_name = 'pgrst.db_schemas'), 'não configurado'),
        COALESCE((SELECT option_value FROM pg_options_to_table(rolconfig) WHERE option_name = 'pgrst.db_extra_search_path'), 'não configurado')
    INTO current_schemas, current_search_path
    FROM pg_roles 
    WHERE rolname = 'authenticator';
    
    RAISE NOTICE 'Configuração atual do authenticator:';
    RAISE NOTICE '  pgrst.db_schemas: %', current_schemas;
    RAISE NOTICE '  pgrst.db_extra_search_path: %', current_search_path;
END $$;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Esta migration atualiza a configuração do role authenticator,
-- mas o PostgREST pode precisar ser reiniciado manualmente para
-- aplicar as mudanças. No Supabase Cloud, isso geralmente acontece
-- automaticamente, mas pode levar alguns minutos.
--
-- Para verificar se a correção funcionou:
-- 1. Verifique os logs do PostgREST no Supabase Dashboard
-- 2. Os logs devem mostrar: "Successfully loaded schema cache using db-schemas=public,nexhunters,graphql"
-- 3. Teste uma requisição: curl https://fakjjzrucxpektnhhnjl.supabase.co/rest/v1/core_client_users?select=id&limit=1
-- =====================================================

