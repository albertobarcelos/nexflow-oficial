-- Tabela de Funis
CREATE TABLE IF NOT EXISTS funnels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Estágios do Funil
CREATE TABLE IF NOT EXISTS funnel_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Negócios (Cards)
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  stage_id UUID REFERENCES funnel_stages(id),
  responsible_id UUID,
  value DECIMAL(15,2),
  expected_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Inserir Funil Padrão
INSERT INTO funnels (name, description, is_default) 
VALUES ('Funil de Vendas', 'Funil principal para gestão de oportunidades de vendas', true);

-- Inserir Estágios Padrão
WITH default_funnel AS (
  SELECT id FROM funnels WHERE is_default = true LIMIT 1
)
INSERT INTO funnel_stages (funnel_id, name, color, order_index) 
VALUES 
  ((SELECT id FROM default_funnel), 'Triagem', '#E2E8F0', 0),
  ((SELECT id FROM default_funnel), 'Aprovação', '#3B82F6', 1),
  ((SELECT id FROM default_funnel), 'Aprovação', '#10B981', 2),
  ((SELECT id FROM default_funnel), 'Arquivado', '#EF4444', 3);

-- Criar índices para melhor performance
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_funnel_stages_funnel_id ON funnel_stages(funnel_id);

-- Adicionar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_funnels_updated_at
    BEFORE UPDATE ON funnels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_stages_updated_at
    BEFORE UPDATE ON funnel_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 