-- Criação das tabelas de histórico de pontos e configurações (018)

BEGIN;

-- Tabela de configurações de gamificação por cliente
CREATE TABLE IF NOT EXISTS partner_gamification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    points_per_indication INTEGER NOT NULL DEFAULT 10, -- Pontos base por indicação
    points_per_conversion INTEGER NOT NULL DEFAULT 50, -- Pontos quando indicação vira cliente
    points_multiplier DECIMAL(3,2) DEFAULT 1.00, -- Multiplicador global de pontos
    auto_level_up BOOLEAN DEFAULT true, -- Se deve subir de nível automaticamente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_client_settings UNIQUE (client_id),
    CONSTRAINT check_points_indication CHECK (points_per_indication >= 0),
    CONSTRAINT check_points_conversion CHECK (points_per_conversion >= 0),
    CONSTRAINT check_multiplier CHECK (points_multiplier > 0)
);

-- Tabela de histórico de pontos
CREATE TABLE IF NOT EXISTS partner_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    balance INTEGER NOT NULL, -- Saldo após a transação
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- Tipo da referência (INDICATION, BADGE, etc)
    reference_id UUID, -- ID da referência (ID da indicação, badge, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_id UUID NOT NULL REFERENCES clients(id), -- Multi-tenant
    CONSTRAINT check_points_value CHECK (points != 0), -- Não permite transações com 0 pontos
    CONSTRAINT check_transaction_type CHECK (
        transaction_type IN ('EARNED', 'SPENT', 'ADJUSTED', 'EXPIRED')
    ),
    CONSTRAINT check_reference_type CHECK (
        reference_type IN ('INDICATION', 'CONVERSION', 'BADGE', 'MANUAL', 'SYSTEM')
    )
);

-- Trigger para atualizar pontos do parceiro
CREATE OR REPLACE FUNCTION update_partner_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar total de pontos do parceiro
    UPDATE partners 
    SET points = points + NEW.points
    WHERE id = NEW.partner_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_points
    AFTER INSERT ON partner_points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_points();

-- Trigger para atualizar nível do parceiro (se auto_level_up estiver ativo)
CREATE OR REPLACE FUNCTION check_partner_level()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id UUID;
    v_auto_level_up BOOLEAN;
    v_new_level UUID;
BEGIN
    -- Obter client_id e configuração de auto_level_up
    SELECT client_id INTO v_client_id FROM partners WHERE id = NEW.partner_id;
    SELECT auto_level_up INTO v_auto_level_up 
    FROM partner_gamification_settings 
    WHERE client_id = v_client_id;

    -- Se auto_level_up estiver ativo
    IF v_auto_level_up THEN
        -- Encontrar o nível adequado para os pontos atuais
        SELECT id INTO v_new_level
        FROM partner_levels
        WHERE client_id = v_client_id
        AND required_points <= NEW.balance
        ORDER BY required_points DESC
        LIMIT 1;

        -- Atualizar o nível do parceiro se necessário
        IF v_new_level IS NOT NULL THEN
            UPDATE partners
            SET current_level = v_new_level
            WHERE id = NEW.partner_id
            AND (current_level IS NULL OR current_level != v_new_level);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_partner_level
    AFTER INSERT ON partner_points_history
    FOR EACH ROW
    EXECUTE FUNCTION check_partner_level();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_partner_points_history_partner_id 
    ON partner_points_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_points_history_client_id 
    ON partner_points_history(client_id);
CREATE INDEX IF NOT EXISTS idx_partner_points_history_created_at 
    ON partner_points_history(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_points_history_type 
    ON partner_points_history(transaction_type);

-- Comentários nas tabelas
COMMENT ON TABLE partner_gamification_settings 
    IS 'Configurações de gamificação por cliente';
COMMENT ON TABLE partner_points_history 
    IS 'Histórico de transações de pontos dos parceiros';

-- Comentários partner_gamification_settings
COMMENT ON COLUMN partner_gamification_settings.points_per_indication 
    IS 'Pontos base ganhos por cada indicação';
COMMENT ON COLUMN partner_gamification_settings.points_per_conversion 
    IS 'Pontos ganhos quando uma indicação vira cliente';
COMMENT ON COLUMN partner_gamification_settings.points_multiplier 
    IS 'Multiplicador global de pontos';
COMMENT ON COLUMN partner_gamification_settings.auto_level_up 
    IS 'Se deve subir de nível automaticamente ao atingir pontos necessários';

-- Comentários partner_points_history
COMMENT ON COLUMN partner_points_history.points 
    IS 'Quantidade de pontos da transação (positivo para ganho, negativo para perda)';
COMMENT ON COLUMN partner_points_history.balance 
    IS 'Saldo de pontos após a transação';
COMMENT ON COLUMN partner_points_history.transaction_type 
    IS 'Tipo da transação: EARNED, SPENT, ADJUSTED, EXPIRED';
COMMENT ON COLUMN partner_points_history.reference_type 
    IS 'Tipo da referência que gerou os pontos';
COMMENT ON COLUMN partner_points_history.reference_id 
    IS 'ID da referência que gerou os pontos';

-- Políticas de segurança RLS
ALTER TABLE partner_gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_points_history ENABLE ROW LEVEL SECURITY;

-- Políticas para partner_gamification_settings
CREATE POLICY partner_gamification_settings_tenant_isolation 
ON partner_gamification_settings
    USING (client_id IN (
        SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid()
    ));

-- Políticas para partner_points_history
CREATE POLICY partner_points_history_tenant_isolation 
ON partner_points_history
    USING (client_id IN (
        SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid()
    ));

COMMIT;

-- Rollback em caso de problemas
-- Para reverter, execute:
/*
BEGIN;
DROP TRIGGER IF EXISTS trigger_check_partner_level ON partner_points_history;
DROP TRIGGER IF EXISTS trigger_update_partner_points ON partner_points_history;
DROP FUNCTION IF EXISTS check_partner_level();
DROP FUNCTION IF EXISTS update_partner_points();
DROP TABLE IF EXISTS partner_points_history;
DROP TABLE IF EXISTS partner_gamification_settings;
COMMIT;
*/ 