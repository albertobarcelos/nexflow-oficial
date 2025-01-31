-- Adiciona coluna funnel_id na tabela deals
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS funnel_id UUID;

-- Adiciona foreign key para a tabela funnels
ALTER TABLE deals
ADD CONSTRAINT fk_deals_funnel
FOREIGN KEY (funnel_id) 
REFERENCES funnels(id)
ON DELETE SET NULL;

-- Adiciona índice para melhorar performance de queries
CREATE INDEX idx_deals_funnel_id ON deals(funnel_id);

-- Adiciona comentário na coluna
COMMENT ON COLUMN deals.funnel_id IS 'ID do funil ao qual o negócio pertence'; 