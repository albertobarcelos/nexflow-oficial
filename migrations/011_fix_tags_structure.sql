-- Primeiro, corrigir a estrutura da tabela tags
ALTER TABLE tags
DROP CONSTRAINT IF EXISTS tags_client_id_fkey;

-- Alterar a coluna client_id para referenciar a tabela clients
ALTER TABLE tags
ALTER COLUMN client_id TYPE UUID USING client_id::uuid,
ADD CONSTRAINT tags_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;

-- Adicionar a coluna funnel_id na tabela tags
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tags_funnel_id ON tags(funnel_id);
CREATE INDEX IF NOT EXISTS idx_tags_client_id ON tags(client_id);

-- Criar trigger para preencher client_id automaticamente ao criar uma tag
CREATE OR REPLACE FUNCTION set_tags_client_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.client_id := (
    SELECT f.client_id
    FROM funnels f
    WHERE f.id = NEW.funnel_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tags_set_client_id ON tags;
CREATE TRIGGER tags_set_client_id
  BEFORE INSERT ON tags
  FOR EACH ROW
  EXECUTE FUNCTION set_tags_client_id();

-- Atualizar a estrutura da tabela deal_tags (tabela de relacionamento)
ALTER TABLE deal_tags
DROP CONSTRAINT IF EXISTS deal_tags_pkey CASCADE;

ALTER TABLE deal_tags
ADD CONSTRAINT deal_tags_pkey PRIMARY KEY (deal_id, tag_id);

-- Adicionar client_id na tabela deal_tags para facilitar as políticas
ALTER TABLE deal_tags
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Criar trigger para preencher client_id automaticamente
CREATE OR REPLACE FUNCTION set_deal_tags_client_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.client_id := (
    SELECT d.client_id
    FROM deals d
    WHERE d.id = NEW.deal_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deal_tags_set_client_id ON deal_tags;
CREATE TRIGGER deal_tags_set_client_id
  BEFORE INSERT ON deal_tags
  FOR EACH ROW
  EXECUTE FUNCTION set_deal_tags_client_id();

-- Remover a coluna tags da tabela deals (já que usaremos deal_tags)
ALTER TABLE deals 
DROP COLUMN IF EXISTS tags;

-- Adicionar comentários para documentação
COMMENT ON TABLE tags IS 'Tabela de tags disponíveis por funil';
COMMENT ON TABLE deal_tags IS 'Relacionamento N:N entre negócios e tags';
COMMENT ON COLUMN tags.funnel_id IS 'ID do funil ao qual a tag pertence';
COMMENT ON COLUMN tags.client_id IS 'ID do cliente ao qual a tag pertence';
COMMENT ON COLUMN deal_tags.client_id IS 'ID do cliente ao qual o relacionamento pertence';

-- Atualizar políticas de segurança
DROP POLICY IF EXISTS "Colaboradores podem ver tags do seu cliente" ON tags;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar tags do seu cliente" ON tags;
DROP POLICY IF EXISTS "Colaboradores podem ver deal_tags" ON deal_tags;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar deal_tags" ON deal_tags;

-- Habilitar RLS nas tabelas
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para tags
CREATE POLICY "Colaboradores podem ver tags do cliente"
ON tags FOR SELECT
USING (
  client_id IN (
    SELECT client_id 
    FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Colaboradores podem gerenciar tags do cliente"
ON tags FOR ALL
USING (
  client_id IN (
    SELECT client_id 
    FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Políticas para deal_tags
CREATE POLICY "Colaboradores podem ver deal_tags"
ON deal_tags FOR SELECT
USING (
  client_id IN (
    SELECT client_id 
    FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Colaboradores podem gerenciar deal_tags"
ON deal_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM deals d
    JOIN collaborators c ON d.client_id = c.client_id
    WHERE d.id = deal_tags.deal_id
    AND c.auth_user_id = auth.uid()
  )
);

-- Atualizar client_id nas tags existentes
UPDATE tags t
SET client_id = f.client_id
FROM funnels f
WHERE f.id = t.funnel_id; 