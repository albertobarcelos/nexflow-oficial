-- =====================================================
-- MIGRATION: Dropar Schema Nexflow
-- =====================================================
-- Remove o schema nexflow após migração completa para public
-- IMPORTANTE: Executar apenas após validação completa
-- =====================================================

-- Verificar se o schema existe e está vazio antes de dropar
DO $$
BEGIN
    -- Verificar se existem objetos no schema nexflow
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'nexflow'
    ) THEN
        RAISE EXCEPTION 'Schema nexflow ainda contém tabelas. Não é seguro dropar.';
    END IF;

    -- Verificar se existem funções no schema nexflow
    IF EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_schema = 'nexflow'
    ) THEN
        RAISE EXCEPTION 'Schema nexflow ainda contém funções. Não é seguro dropar.';
    END IF;

    -- Verificar se existem tipos no schema nexflow
    IF EXISTS (
        SELECT 1 
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'nexflow'
    ) THEN
        RAISE EXCEPTION 'Schema nexflow ainda contém tipos. Não é seguro dropar.';
    END IF;

    -- Se chegou aqui, o schema está vazio e pode ser removido
    DROP SCHEMA IF EXISTS nexflow CASCADE;
    
    RAISE NOTICE 'Schema nexflow removido com sucesso.';
END $$;

