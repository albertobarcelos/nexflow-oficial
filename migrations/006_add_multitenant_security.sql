-- Adicionar client_id nas tabelas
ALTER TABLE funnels 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Atualizar client_id baseado nas empresas relacionadas
UPDATE deals d
SET client_id = c.client_id
FROM companies c
WHERE d.company_id = c.id;

-- Tornar client_id NOT NULL
ALTER TABLE funnels 
ALTER COLUMN client_id SET NOT NULL;

ALTER TABLE deals 
ALTER COLUMN client_id SET NOT NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_funnels_client_id ON funnels(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);

-- Habilitar RLS
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Políticas para funnels
CREATE POLICY "Colaboradores podem ver funis do seu cliente"
  ON funnels FOR SELECT
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores podem gerenciar funis do seu cliente"
  ON funnels FOR ALL
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para funnel_stages
CREATE POLICY "Colaboradores podem ver estágios dos funis do seu cliente"
  ON funnel_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM funnels
      WHERE funnels.id = funnel_stages.funnel_id
      AND funnels.client_id IN (
        SELECT client_id 
        FROM collaborators 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Colaboradores podem gerenciar estágios dos funis do seu cliente"
  ON funnel_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM funnels
      WHERE funnels.id = funnel_stages.funnel_id
      AND funnels.client_id IN (
        SELECT client_id 
        FROM collaborators 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Políticas para deals
CREATE POLICY "Colaboradores podem ver negócios do seu cliente"
  ON deals FOR SELECT
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores podem gerenciar negócios do seu cliente"
  ON deals FOR ALL
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  ); 