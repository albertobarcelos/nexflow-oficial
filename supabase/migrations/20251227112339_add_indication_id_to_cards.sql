-- =====================================================
-- MIGRATION: Indication-Card Integration
-- =====================================================
-- Adiciona coluna indication_id na tabela cards
-- Permite vincular cards a indicações do módulo Hunters

-- 1. Adicionar coluna indication_id na tabela nexflow.cards
ALTER TABLE nexflow.cards
ADD COLUMN IF NOT EXISTS indication_id uuid REFERENCES public.core_indications(id) ON DELETE SET NULL;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_nexflow_cards_indication_id ON nexflow.cards(indication_id);

-- 3. Comentários para documentação
COMMENT ON COLUMN nexflow.cards.indication_id IS 'Referência à indicação do módulo Hunters que originou este card';

