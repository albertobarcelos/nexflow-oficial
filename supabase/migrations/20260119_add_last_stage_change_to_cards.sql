-- =====================================================
-- ADICIONAR last_stage_change_at EM CARDS
-- =====================================================
-- Otimização para cálculo rápido de tempo na etapa atual
-- sem precisar varrer todo o histórico
-- =====================================================

-- Adicionar coluna last_stage_change_at na tabela cards
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS last_stage_change_at TIMESTAMPTZ;

-- Criar índice para performance em queries de tempo na etapa
CREATE INDEX IF NOT EXISTS idx_cards_last_stage_change_at 
ON public.cards(last_stage_change_at) 
WHERE last_stage_change_at IS NOT NULL;

-- Criar índice composto para queries de cards por etapa e tempo
CREATE INDEX IF NOT EXISTS idx_cards_step_last_change 
ON public.cards(step_id, last_stage_change_at DESC);

-- Comentário para documentação
COMMENT ON COLUMN public.cards.last_stage_change_at IS 'Data/hora da última mudança de etapa (atualizado automaticamente por trigger)';
