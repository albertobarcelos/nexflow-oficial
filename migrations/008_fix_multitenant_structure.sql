-- Primeiro remover as políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios funis" ON funnels;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios funis" ON funnels;
DROP POLICY IF EXISTS "Usuários podem ver estágios dos seus funis" ON funnel_stages;
DROP POLICY IF EXISTS "Usuários podem gerenciar estágios dos seus funis" ON funnel_stages;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios negócios" ON deals;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios negócios" ON deals;

-- Remover políticas existentes de colaboradores
DROP POLICY IF EXISTS "Colaboradores podem ver funis do seu cliente" ON funnels;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar funis do seu cliente" ON funnels;
DROP POLICY IF EXISTS "Colaboradores podem ver estágios dos funis do seu cliente" ON funnel_stages;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar estágios dos funis do seu cliente" ON funnel_stages;
DROP POLICY IF EXISTS "Colaboradores podem ver negócios do seu cliente" ON deals;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar negócios do seu cliente" ON deals;

-- Desabilitar RLS temporariamente
ALTER TABLE funnels DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;

-- Primeiro remover as constraints existentes
ALTER TABLE funnels DROP CONSTRAINT IF EXISTS funnels_client_id_fkey;
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_client_id_fkey;
ALTER TABLE funnel_stages DROP CONSTRAINT IF EXISTS funnel_stages_funnel_id_fkey;

-- Corrigir a tabela funnels
ALTER TABLE funnels 
  ALTER COLUMN client_id TYPE UUID,
  DROP CONSTRAINT IF EXISTS funnels_client_id_fkey,
  ADD CONSTRAINT funnels_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE CASCADE;

-- Adicionar client_id na tabela funnel_stages
ALTER TABLE funnel_stages
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD CONSTRAINT funnel_stages_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE CASCADE;

-- Atualizar client_id em funnel_stages baseado no funil
UPDATE funnel_stages fs
SET client_id = f.client_id
FROM funnels f
WHERE fs.funnel_id = f.id;

-- Tornar client_id NOT NULL em funnel_stages
ALTER TABLE funnel_stages 
  ALTER COLUMN client_id SET NOT NULL;

-- Corrigir a tabela deals
ALTER TABLE deals
  ALTER COLUMN client_id TYPE UUID,
  DROP CONSTRAINT IF EXISTS deals_client_id_fkey,
  ADD CONSTRAINT deals_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE CASCADE;

-- Corrigir a tabela deal_tags
ALTER TABLE deal_tags
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD CONSTRAINT deal_tags_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE CASCADE;

-- Atualizar client_id em deal_tags baseado no deal
UPDATE deal_tags dt
SET client_id = d.client_id
FROM deals d
WHERE dt.deal_id = d.id;

-- Tornar client_id NOT NULL em deal_tags
ALTER TABLE deal_tags
  ALTER COLUMN client_id SET NOT NULL;

-- Corrigir a tabela tags (se não existir, criar)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_funnel_stages_client_id ON funnel_stages(client_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_client_id ON deal_tags(client_id);
CREATE INDEX IF NOT EXISTS idx_tags_client_id ON tags(client_id);

-- Reabilitar RLS em todas as tabelas
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas para funnels
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

-- Adicionar políticas para funnel_stages
CREATE POLICY "Colaboradores podem ver estágios dos funis do seu cliente"
  ON funnel_stages FOR SELECT
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores podem gerenciar estágios dos funis do seu cliente"
  ON funnel_stages FOR ALL
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Adicionar políticas para deals
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

-- Adicionar políticas para tags
CREATE POLICY "Colaboradores podem ver tags do seu cliente"
  ON tags FOR SELECT
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores podem gerenciar tags do seu cliente"
  ON tags FOR ALL
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Adicionar políticas para deal_tags
CREATE POLICY "Colaboradores podem ver deal_tags do seu cliente"
  ON deal_tags FOR SELECT
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores podem gerenciar deal_tags do seu cliente"
  ON deal_tags FOR ALL
  USING (
    client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  ); 