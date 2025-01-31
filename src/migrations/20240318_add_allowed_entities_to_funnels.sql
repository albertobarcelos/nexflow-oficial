-- Adiciona a coluna allowed_entities na tabela funnels
ALTER TABLE funnels 
ADD COLUMN IF NOT EXISTS allowed_entities JSONB NOT NULL DEFAULT '["companies", "people", "partners"]'::jsonb;

-- Atualiza os registros existentes para ter todas as entidades permitidas por padrão
UPDATE funnels 
SET allowed_entities = '["companies", "people", "partners"]'::jsonb 
WHERE allowed_entities IS NULL; 