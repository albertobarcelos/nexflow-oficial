-- =====================================================
-- MIGRATION: Enable RLS on core_indications
-- =====================================================
-- Habilita Row Level Security na tabela core_indications
-- para que as políticas RLS funcionem corretamente

-- Habilitar RLS na tabela
ALTER TABLE public.core_indications ENABLE ROW LEVEL SECURITY;

-- Comentário para documentação
COMMENT ON TABLE public.core_indications IS 'Tabela de indicações do módulo Hunters. RLS habilitado para controle de acesso baseado em role.';

