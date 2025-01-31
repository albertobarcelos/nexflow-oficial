-- Adicionar novos campos na tabela partners
BEGIN;

-- Campos de redes sociais
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Comentários para documentação
COMMENT ON COLUMN partners.linkedin IS 'URL do perfil do LinkedIn do parceiro';
COMMENT ON COLUMN partners.instagram IS 'Nome de usuário do Instagram do parceiro';
COMMENT ON COLUMN partners.whatsapp IS 'Número do WhatsApp do parceiro';
COMMENT ON COLUMN partners.phone IS 'Número de telefone adicional do parceiro';
COMMENT ON COLUMN partners.birth_date IS 'Data de nascimento do parceiro';

-- Índices para performance em buscas
CREATE INDEX IF NOT EXISTS idx_partners_whatsapp ON partners(whatsapp);
CREATE INDEX IF NOT EXISTS idx_partners_instagram ON partners(instagram);

COMMIT;

-- Rollback em caso de problemas
/*
BEGIN;
ALTER TABLE partners 
  DROP COLUMN IF EXISTS linkedin,
  DROP COLUMN IF EXISTS instagram,
  DROP COLUMN IF EXISTS whatsapp,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS birth_date;
DROP INDEX IF EXISTS idx_partners_whatsapp;
DROP INDEX IF EXISTS idx_partners_instagram;
COMMIT;
*/ 