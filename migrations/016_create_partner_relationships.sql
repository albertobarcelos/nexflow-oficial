-- Criação das tabelas de relacionamento para parceiros (016)

BEGIN;

-- Adicionar campos de empresa na tabela partners
ALTER TABLE partners
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
    ADD COLUMN IF NOT EXISTS role VARCHAR(100); -- Cargo/função na empresa

-- Tabela para empresas indicadas pelo parceiro
CREATE TABLE IF NOT EXISTS partner_indications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDENTE',
    indication_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conversion_date TIMESTAMP WITH TIME ZONE, -- Data quando a indicação virou cliente
    points_earned INTEGER DEFAULT 0, -- Pontos ganhos com esta indicação
    notes TEXT, -- Observações sobre a indicação
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_id UUID NOT NULL REFERENCES clients(id), -- Multi-tenant
    CONSTRAINT check_indication_status CHECK (
        status IN ('PENDENTE', 'EM_ANALISE', 'CONVERTIDA', 'REJEITADA', 'CANCELADA')
    )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_partners_company_id ON partners(company_id);
CREATE INDEX IF NOT EXISTS idx_partner_indications_partner_id ON partner_indications(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_indications_company_id ON partner_indications(company_id);
CREATE INDEX IF NOT EXISTS idx_partner_indications_client_id ON partner_indications(client_id);
CREATE INDEX IF NOT EXISTS idx_partner_indications_status ON partner_indications(status);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para partner_indications
DROP TRIGGER IF EXISTS trigger_update_partner_indications_timestamp ON partner_indications;
CREATE TRIGGER trigger_update_partner_indications_timestamp
    BEFORE UPDATE ON partner_indications
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Comentários nas colunas
COMMENT ON COLUMN partners.company_id IS 'ID da empresa onde o parceiro trabalha (opcional)';
COMMENT ON COLUMN partners.role IS 'Cargo/função do parceiro na empresa vinculada';

-- Comentários na tabela de indicações
COMMENT ON TABLE partner_indications IS 'Empresas indicadas pelos parceiros';
COMMENT ON COLUMN partner_indications.partner_id IS 'ID do parceiro que fez a indicação';
COMMENT ON COLUMN partner_indications.company_id IS 'ID da empresa indicada';
COMMENT ON COLUMN partner_indications.status IS 'Status da indicação';
COMMENT ON COLUMN partner_indications.indication_date IS 'Data da indicação';
COMMENT ON COLUMN partner_indications.conversion_date IS 'Data em que a empresa se tornou cliente';
COMMENT ON COLUMN partner_indications.points_earned IS 'Pontos ganhos com esta indicação';
COMMENT ON COLUMN partner_indications.notes IS 'Observações sobre a indicação';

-- Políticas de segurança RLS
ALTER TABLE partner_indications ENABLE ROW LEVEL SECURITY;

-- Política para partner_indications
CREATE POLICY partner_indications_tenant_isolation ON partner_indications
    USING (client_id IN (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid()));

COMMIT;

-- Rollback em caso de problemas
-- Para reverter, execute:
/*
BEGIN;
ALTER TABLE partners DROP COLUMN IF EXISTS company_id;
ALTER TABLE partners DROP COLUMN IF EXISTS role;
DROP TABLE IF EXISTS partner_indications;
DROP FUNCTION IF EXISTS update_timestamp_column();
COMMIT;
*/ 