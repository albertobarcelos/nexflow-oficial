-- Remover TODAS as políticas existentes das duas tabelas
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias tags" ON tags;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias tags" ON tags;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias tags" ON tags;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias tags" ON tags;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias tags" ON tags;
DROP POLICY IF EXISTS "Colaboradores podem ver tags do cliente" ON tags;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar tags do cliente" ON tags;
DROP POLICY IF EXISTS "Colaboradores podem ver tags do funil" ON tags;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar tags do funil" ON tags;

-- Remover políticas da tabela deal_tags
DROP POLICY IF EXISTS "Usuários podem ver relacionamentos de suas tags" ON deal_tags;
DROP POLICY IF EXISTS "Usuários podem gerenciar relacionamentos de suas tags" ON deal_tags;
DROP POLICY IF EXISTS "Colaboradores podem ver relacionamentos de tags" ON deal_tags;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar relacionamentos de tags" ON deal_tags;

-- Desabilitar RLS temporariamente nas duas tabelas
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tags DISABLE ROW LEVEL SECURITY;

-- Corrigir a estrutura da tabela tags
ALTER TABLE tags
DROP CONSTRAINT IF EXISTS tags_client_id_fkey;

-- Alterar a coluna client_id para referenciar a tabela clients
ALTER TABLE tags
ALTER COLUMN client_id TYPE UUID USING client_id::uuid,
ADD CONSTRAINT tags_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;

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

-- Atualizar client_id nas tags existentes
UPDATE tags t
SET client_id = f.client_id
FROM funnels f
WHERE f.id = t.funnel_id;

-- Reabilitar RLS nas duas tabelas
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;

-- Recriar as políticas de segurança para tags
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

-- Recriar as políticas de segurança para deal_tags
CREATE POLICY "Colaboradores podem ver relacionamentos de tags"
ON deal_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tags t
    WHERE t.id = deal_tags.tag_id
    AND t.client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Colaboradores podem gerenciar relacionamentos de tags"
ON deal_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tags t
    WHERE t.id = deal_tags.tag_id
    AND t.client_id IN (
      SELECT client_id 
      FROM collaborators 
      WHERE auth_user_id = auth.uid()
    )
  )
); 