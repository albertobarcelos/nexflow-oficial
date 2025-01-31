-- Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela de tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT '#94A3B8', -- Cor padrão slate-400
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar tabela de relacionamento entre tags e negócios
CREATE TABLE IF NOT EXISTS deal_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(deal_id, tag_id)
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tags_client_id ON tags(client_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_deal_id ON deal_tags(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_tag_id ON deal_tags(tag_id);

-- Adicionar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS set_timestamp ON tags;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Adicionar comentários para documentação
COMMENT ON TABLE tags IS 'Tabela de tags para categorização de negócios';
COMMENT ON TABLE deal_tags IS 'Tabela de relacionamento entre tags e negócios';

-- Habilitar RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
DROP POLICY IF EXISTS "Usuários podem ver suas próprias tags" ON tags;
CREATE POLICY "Usuários podem ver suas próprias tags"
  ON tags FOR SELECT
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias tags" ON tags;
CREATE POLICY "Usuários podem inserir suas próprias tags"
  ON tags FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias tags" ON tags;
CREATE POLICY "Usuários podem atualizar suas próprias tags"
  ON tags FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias tags" ON tags;
CREATE POLICY "Usuários podem deletar suas próprias tags"
  ON tags FOR DELETE
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem ver relacionamentos de suas tags" ON deal_tags;
CREATE POLICY "Usuários podem ver relacionamentos de suas tags"
  ON deal_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = tag_id
      AND tags.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem gerenciar relacionamentos de suas tags" ON deal_tags;
CREATE POLICY "Usuários podem gerenciar relacionamentos de suas tags"
  ON deal_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = tag_id
      AND tags.client_id = auth.uid()
    )
  ); 