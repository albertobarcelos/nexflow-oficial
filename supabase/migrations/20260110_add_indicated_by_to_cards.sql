-- Adicionar campo indicated_by na tabela cards
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS indicated_by UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_cards_indicated_by ON public.cards(indicated_by);

-- Comentário
COMMENT ON COLUMN public.cards.indicated_by IS 'ID do contato parceiro que indicou este card/negócio';

