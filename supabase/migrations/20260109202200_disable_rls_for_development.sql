-- =====================================================
-- MIGRATION: Desativar RLS para Desenvolvimento
-- =====================================================
-- Desativa Row Level Security em todas as tabelas do schema public
-- para facilitar desenvolvimento e testes
-- =====================================================
-- IMPORTANTE: Esta migration desativa RLS em TODAS as tabelas
-- Use apenas em ambiente de desenvolvimento/testes
-- Para reativar, execute o script de reativação documentado
-- =====================================================

DO $$
DECLARE
    r RECORD;
    tables_disabled INTEGER := 0;
BEGIN
    -- Desativar RLS em todas as tabelas do schema public
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
        ORDER BY tablename
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
            tables_disabled := tables_disabled + 1;
            RAISE NOTICE 'RLS desativado em: %', r.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erro ao desativar RLS em %: %', r.tablename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total de tabelas com RLS desativado: %', tables_disabled;
END $$;

