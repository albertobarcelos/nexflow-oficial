-- Atualiza a tabela partners para o novo padrão
ALTER TABLE partners
  ALTER COLUMN client_id SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN website DROP NOT NULL,
  ALTER COLUMN description DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adiciona a trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Atualiza as políticas de segurança (RLS)
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
DROP POLICY IF EXISTS "Usuários podem ver parceiros do seu client_id" ON partners;
CREATE POLICY "Usuários podem ver parceiros do seu client_id"
ON partners FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Política para INSERT
DROP POLICY IF EXISTS "Usuários podem inserir parceiros no seu client_id" ON partners;
CREATE POLICY "Usuários podem inserir parceiros no seu client_id"
ON partners FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Política para UPDATE
DROP POLICY IF EXISTS "Usuários podem atualizar parceiros do seu client_id" ON partners;
CREATE POLICY "Usuários podem atualizar parceiros do seu client_id"
ON partners FOR UPDATE
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Política para DELETE
DROP POLICY IF EXISTS "Usuários podem deletar parceiros do seu client_id" ON partners;
CREATE POLICY "Usuários podem deletar parceiros do seu client_id"
ON partners FOR DELETE
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
); 