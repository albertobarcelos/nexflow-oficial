-- Reestruturação da tabela de parceiros (015)
-- Alteração para focar em parceiros como pessoas físicas

BEGIN;

-- Backup dos dados existentes (caso necessário reverter)
CREATE TABLE partners_backup AS SELECT * FROM partners;

-- Remover colunas relacionadas a empresa
ALTER TABLE partners
    DROP COLUMN IF EXISTS cnpj,
    DROP COLUMN IF EXISTS razao_social,
    DROP COLUMN IF EXISTS website,
    DROP COLUMN IF EXISTS setor,
    DROP COLUMN IF EXISTS categoria;

-- Adicionar novas colunas para dados pessoais
ALTER TABLE partners
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS partner_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDENTE',
    -- Campos base para gamificação (podem ser expandidos depois)
    ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_indications INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Adicionar as constraints após criar as colunas
ALTER TABLE partners
    ADD CONSTRAINT partner_type_check 
    CHECK (partner_type IN ('AFILIADO', 'AGENTE_STONE', 'CONTADOR')),
    ADD CONSTRAINT partner_status_check 
    CHECK (status IN ('PENDENTE', 'ATIVO', 'INATIVO', 'BLOQUEADO'));

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partners_timestamp ON partners;
CREATE TRIGGER trigger_update_partners_timestamp
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partners_updated_at();

-- Comentários nas colunas
COMMENT ON COLUMN partners.birth_date IS 'Data de nascimento do parceiro';
COMMENT ON COLUMN partners.linkedin_url IS 'URL do perfil do LinkedIn';
COMMENT ON COLUMN partners.instagram_url IS 'URL do perfil do Instagram';
COMMENT ON COLUMN partners.whatsapp IS 'Número do WhatsApp com DDD';
COMMENT ON COLUMN partners.phone IS 'Telefone adicional com DDD';
COMMENT ON COLUMN partners.email IS 'Email principal do parceiro';
COMMENT ON COLUMN partners.partner_type IS 'Tipo do parceiro: AFILIADO, AGENTE_STONE ou CONTADOR';
COMMENT ON COLUMN partners.status IS 'Status do parceiro no programa';
COMMENT ON COLUMN partners.current_level IS 'Nível atual do parceiro no programa';
COMMENT ON COLUMN partners.points IS 'Pontos acumulados pelo parceiro';
COMMENT ON COLUMN partners.total_indications IS 'Total de indicações realizadas';

COMMIT;

-- Rollback em caso de problemas
-- Para reverter, execute:
/*
BEGIN;
DROP TRIGGER IF EXISTS trigger_update_partners_timestamp ON partners;
DROP FUNCTION IF EXISTS update_partners_updated_at();
DROP TABLE partners;
ALTER TABLE partners_backup RENAME TO partners;
COMMIT;
*/ 