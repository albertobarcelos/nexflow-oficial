-- =====================================================
-- MIGRAÇÃO: Adicionar campos faltantes na tabela web_deals
-- Data: 2024-01-XX
-- Descrição: Adiciona campos para person_id, temperature, tags, 
--            responsible_id, probability, notes e last_activity
-- =====================================================

-- 1. Adicionar person_id (referência para pessoas)
ALTER TABLE web_deals 
ADD COLUMN person_id UUID REFERENCES web_people(id);

-- 2. Adicionar temperature (temperatura do deal)
ALTER TABLE web_deals 
ADD COLUMN temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold'));

-- 3. Adicionar tags (array de tags/etiquetas)
ALTER TABLE web_deals 
ADD COLUMN tags TEXT[];

-- 4. Adicionar responsible_id (referência para responsável)
ALTER TABLE web_deals 
ADD COLUMN responsible_id UUID REFERENCES core_client_users(id);

-- 5. Adicionar probability (probabilidade de fechamento 0-100)
ALTER TABLE web_deals 
ADD COLUMN probability INTEGER CHECK (probability >= 0 AND probability <= 100);

-- 6. Adicionar notes (observações do deal)
ALTER TABLE web_deals 
ADD COLUMN notes TEXT;

-- 7. Adicionar last_activity (data da última atividade)
ALTER TABLE web_deals 
ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para person_id (para JOINs eficientes)
CREATE INDEX idx_web_deals_person_id ON web_deals(person_id);

-- Índice para responsible_id (para filtros por responsável)
CREATE INDEX idx_web_deals_responsible_id ON web_deals(responsible_id);

-- Índice para temperature (para filtros por temperatura)
CREATE INDEX idx_web_deals_temperature ON web_deals(temperature);

-- Índice para last_activity (para ordenação por atividade)
CREATE INDEX idx_web_deals_last_activity ON web_deals(last_activity);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN web_deals.person_id IS 'Referência para pessoa associada ao deal';
COMMENT ON COLUMN web_deals.temperature IS 'Temperatura do deal: hot, warm, cold';
COMMENT ON COLUMN web_deals.tags IS 'Array de tags/etiquetas do deal';
COMMENT ON COLUMN web_deals.responsible_id IS 'Usuário responsável pelo deal';
COMMENT ON COLUMN web_deals.probability IS 'Probabilidade de fechamento (0-100%)';
COMMENT ON COLUMN web_deals.notes IS 'Observações e anotações do deal';
COMMENT ON COLUMN web_deals.last_activity IS 'Data e hora da última atividade no deal';

-- =====================================================
-- DADOS PADRÃO PARA CAMPOS EXISTENTES
-- =====================================================

-- Definir temperatura padrão como 'warm' para deals existentes
UPDATE web_deals 
SET temperature = 'warm' 
WHERE temperature IS NULL;

-- Definir probabilidade padrão como 50% para deals existentes
UPDATE web_deals 
SET probability = 50 
WHERE probability IS NULL;

-- Definir last_activity como created_at para deals existentes
UPDATE web_deals 
SET last_activity = created_at 
WHERE last_activity IS NULL; 