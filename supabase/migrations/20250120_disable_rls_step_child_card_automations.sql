-- =====================================================
-- MIGRATION: Disable RLS for step_child_card_automations (Development)
-- =====================================================
-- Desabilita RLS temporariamente para desenvolvimento
-- IMPORTANTE: Reabilitar RLS e criar políticas adequadas antes de produção

-- Desabilitar RLS na tabela step_child_card_automations
ALTER TABLE nexflow.step_child_card_automations DISABLE ROW LEVEL SECURITY;

-- Conceder permissões para service_role (necessário para Edge Functions)
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.step_child_card_automations TO service_role;

-- Conceder permissões para authenticated users (desenvolvimento)
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.step_child_card_automations TO authenticated;

