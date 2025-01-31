-- Adiciona coluna position na tabela deals
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Adiciona índice composto para melhorar performance de ordenação
CREATE INDEX idx_deals_stage_position ON deals(stage_id, position);

-- Adiciona comentário na coluna
COMMENT ON COLUMN deals.position IS 'Posição do card dentro do estágio do funil'; 