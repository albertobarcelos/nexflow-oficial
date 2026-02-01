-- =====================================================
-- ADICIONAR COLUNA step_id EM card_history
-- =====================================================
-- Adiciona coluna step_id para associar eventos field_update
-- à etapa onde o campo foi preenchido
-- =====================================================

-- Adicionar coluna step_id (nullable para não quebrar registros existentes)
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES public.steps(id) ON DELETE SET NULL;

-- Criar índice para performance em queries que agrupam por etapa
CREATE INDEX IF NOT EXISTS idx_card_history_step_id 
ON public.card_history(step_id) 
WHERE step_id IS NOT NULL;

-- Criar índice composto para queries de eventos por etapa
CREATE INDEX IF NOT EXISTS idx_card_history_card_step_event 
ON public.card_history(card_id, step_id, event_type) 
WHERE step_id IS NOT NULL;

-- Comentário
COMMENT ON COLUMN public.card_history.step_id IS 'ID da etapa onde o evento ocorreu (principalmente para eventos field_update)';
