-- Adiciona coluna position na tabela funnel_stages
ALTER TABLE funnel_stages 
ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Adiciona índice para melhorar performance de ordenação
CREATE INDEX idx_funnel_stages_position ON funnel_stages(position);

-- Adiciona colunas na tabela deals
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS person_id UUID;

-- Adiciona chaves estrangeiras na tabela deals
ALTER TABLE deals
ADD CONSTRAINT fk_deals_company
FOREIGN KEY (company_id) 
REFERENCES companies(id)
ON DELETE SET NULL;

ALTER TABLE deals
ADD CONSTRAINT fk_deals_person
FOREIGN KEY (person_id) 
REFERENCES people(id)
ON DELETE SET NULL; 