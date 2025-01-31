-- Primeiro remover as tabelas de relacionamento que não serão mais necessárias
DROP TABLE IF EXISTS company_people;
DROP TABLE IF EXISTS company_partners;
DROP TABLE IF EXISTS company_relationships;

-- Adicionar colunas de relacionamento na tabela people
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES partners(id);

-- Adicionar coluna de relacionamento na tabela companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES partners(id);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_people_company_id ON people(company_id);
CREATE INDEX IF NOT EXISTS idx_people_partner_id ON people(partner_id);
CREATE INDEX IF NOT EXISTS idx_companies_partner_id ON companies(partner_id);

-- Adicionar comentários para documentação
COMMENT ON COLUMN people.company_id IS 'ID da empresa à qual a pessoa está vinculada (uma pessoa só pode estar vinculada a uma empresa)';
COMMENT ON COLUMN people.partner_id IS 'ID do parceiro ao qual a pessoa está vinculada (uma pessoa pode estar vinculada a um parceiro)';
COMMENT ON COLUMN companies.partner_id IS 'ID do parceiro que está vinculado à empresa (uma empresa só pode ter um parceiro)';

-- Criar políticas de segurança (RLS)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Política para pessoas vinculadas a empresas
CREATE POLICY "Pessoas visíveis para membros da mesma empresa"
  ON people
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT auth_user_id 
      FROM collaborators 
      WHERE client_id = (
        SELECT client_id 
        FROM companies 
        WHERE id = people.company_id
      )
    )
  );

-- Política para pessoas vinculadas a parceiros
CREATE POLICY "Pessoas visíveis para membros do mesmo parceiro"
  ON people
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT auth_user_id 
      FROM collaborators 
      WHERE client_id = (
        SELECT client_id 
        FROM partners 
        WHERE id = people.partner_id
      )
    )
  ); 