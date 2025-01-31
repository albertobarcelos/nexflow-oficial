-- Remove a constraint antiga
ALTER TABLE company_partners
DROP CONSTRAINT IF EXISTS company_partners_company_id_partner_id_key;

-- Renomeia a coluna partnership_type para relationship_type
ALTER TABLE company_partners 
RENAME COLUMN partnership_type TO relationship_type;

-- Atualiza os registros existentes para MATRIZ
UPDATE company_partners
SET relationship_type = 'MATRIZ'
WHERE relationship_type NOT IN ('MATRIZ', 'UNIDADE', 'POLO');

-- Adiciona check constraint para relationship_type
ALTER TABLE company_partners 
DROP CONSTRAINT IF EXISTS relationship_type_check,
ADD CONSTRAINT relationship_type_check 
  CHECK (relationship_type IN ('MATRIZ', 'UNIDADE', 'POLO'));

-- Adiciona unique constraint no partner_id
ALTER TABLE company_partners
ADD CONSTRAINT company_partners_partner_id_key UNIQUE (partner_id);
