-- Cria a tabela de relacionamento entre empresas e parceiros
CREATE TABLE IF NOT EXISTS company_partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('MATRIZ', 'UNIDADE', 'POLO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Garante que um parceiro só pode ter uma empresa vinculada
  UNIQUE(partner_id)
);

-- Adiciona a trigger para atualizar o updated_at automaticamente
DROP TRIGGER IF EXISTS update_company_partners_updated_at ON company_partners;
CREATE TRIGGER update_company_partners_updated_at
    BEFORE UPDATE ON company_partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Atualiza as políticas de segurança (RLS)
ALTER TABLE company_partners ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
DROP POLICY IF EXISTS "Usuários podem ver vínculos do seu client_id" ON company_partners;
CREATE POLICY "Usuários podem ver vínculos do seu client_id"
ON company_partners FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Política para INSERT
DROP POLICY IF EXISTS "Usuários podem criar vínculos no seu client_id" ON company_partners;
CREATE POLICY "Usuários podem criar vínculos no seu client_id"
ON company_partners FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Política para UPDATE
DROP POLICY IF EXISTS "Usuários podem atualizar vínculos do seu client_id" ON company_partners;
CREATE POLICY "Usuários podem atualizar vínculos do seu client_id"
ON company_partners FOR UPDATE
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
DROP POLICY IF EXISTS "Usuários podem deletar vínculos do seu client_id" ON company_partners;
CREATE POLICY "Usuários podem deletar vínculos do seu client_id"
ON company_partners FOR DELETE
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);
