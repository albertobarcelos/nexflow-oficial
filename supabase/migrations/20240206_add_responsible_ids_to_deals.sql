-- Adiciona coluna responsible_ids na tabela deals
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS responsible_ids UUID[] DEFAULT '{}';

-- Adiciona comentário explicativo na coluna
COMMENT ON COLUMN public.deals.responsible_ids IS 'Array de IDs dos colaboradores responsáveis pelo negócio';

-- Adiciona índice GIN para melhorar performance de buscas no array
CREATE INDEX IF NOT EXISTS idx_deals_responsible_ids ON public.deals USING GIN (responsible_ids);
