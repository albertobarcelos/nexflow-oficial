-- Criação das tabelas de gamificação para parceiros (017)

BEGIN;

-- Tabela de níveis possíveis
CREATE TABLE IF NOT EXISTS partner_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    required_points INTEGER NOT NULL,
    benefits TEXT, -- Benefícios do nível em formato texto
    icon_url VARCHAR(255), -- URL do ícone do nível
    color VARCHAR(7), -- Cor em hexadecimal (#RRGGBB)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_id UUID NOT NULL REFERENCES clients(id), -- Multi-tenant
    CONSTRAINT check_required_points CHECK (required_points >= 0),
    CONSTRAINT unique_level_name_per_client UNIQUE (client_id, name)
);

-- Tabela de insígnias/badges
CREATE TABLE IF NOT EXISTS partner_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0, -- Pontos ganhos ao conquistar
    icon_url VARCHAR(255),
    color VARCHAR(7), -- Cor em hexadecimal (#RRGGBB)
    badge_type VARCHAR(50) NOT NULL, -- Tipo da insígnia (CONQUISTA, MILESTONE, etc)
    requirements TEXT, -- Requisitos para ganhar a insígnia
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_id UUID NOT NULL REFERENCES clients(id), -- Multi-tenant
    CONSTRAINT check_badge_points CHECK (points >= 0),
    CONSTRAINT check_badge_type CHECK (
        badge_type IN ('CONQUISTA', 'MILESTONE', 'EVENTO', 'ESPECIAL')
    ),
    CONSTRAINT unique_badge_name_per_client UNIQUE (client_id, name)
);

-- Tabela de relacionamento entre parceiros e badges
CREATE TABLE IF NOT EXISTS partner_earned_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES partner_badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_id UUID NOT NULL REFERENCES clients(id), -- Multi-tenant
    CONSTRAINT unique_partner_badge UNIQUE (partner_id, badge_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_partner_levels_client_id ON partner_levels(client_id);
CREATE INDEX IF NOT EXISTS idx_partner_levels_required_points ON partner_levels(required_points);

CREATE INDEX IF NOT EXISTS idx_partner_badges_client_id ON partner_badges(client_id);
CREATE INDEX IF NOT EXISTS idx_partner_badges_type ON partner_badges(badge_type);

CREATE INDEX IF NOT EXISTS idx_partner_earned_badges_partner_id ON partner_earned_badges(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_earned_badges_badge_id ON partner_earned_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_partner_earned_badges_client_id ON partner_earned_badges(client_id);
CREATE INDEX IF NOT EXISTS idx_partner_earned_badges_earned_at ON partner_earned_badges(earned_at);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_gamification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para partner_levels
CREATE TRIGGER trigger_update_partner_levels_timestamp
    BEFORE UPDATE ON partner_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_timestamp();

-- Trigger para partner_badges
CREATE TRIGGER trigger_update_partner_badges_timestamp
    BEFORE UPDATE ON partner_badges
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_timestamp();

-- Trigger para partner_earned_badges
CREATE TRIGGER trigger_update_partner_earned_badges_timestamp
    BEFORE UPDATE ON partner_earned_badges
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_timestamp();

-- Comentários nas tabelas
COMMENT ON TABLE partner_levels IS 'Níveis possíveis para parceiros';
COMMENT ON TABLE partner_badges IS 'Insígnias que podem ser conquistadas pelos parceiros';
COMMENT ON TABLE partner_earned_badges IS 'Insígnias conquistadas por cada parceiro';

-- Comentários partner_levels
COMMENT ON COLUMN partner_levels.name IS 'Nome do nível';
COMMENT ON COLUMN partner_levels.description IS 'Descrição detalhada do nível';
COMMENT ON COLUMN partner_levels.required_points IS 'Pontos necessários para atingir este nível';
COMMENT ON COLUMN partner_levels.benefits IS 'Benefícios oferecidos neste nível';
COMMENT ON COLUMN partner_levels.icon_url IS 'URL do ícone que representa o nível';
COMMENT ON COLUMN partner_levels.color IS 'Cor do nível em hexadecimal';

-- Comentários partner_badges
COMMENT ON COLUMN partner_badges.name IS 'Nome da insígnia';
COMMENT ON COLUMN partner_badges.description IS 'Descrição da insígnia';
COMMENT ON COLUMN partner_badges.points IS 'Pontos ganhos ao conquistar esta insígnia';
COMMENT ON COLUMN partner_badges.icon_url IS 'URL do ícone da insígnia';
COMMENT ON COLUMN partner_badges.color IS 'Cor da insígnia em hexadecimal';
COMMENT ON COLUMN partner_badges.badge_type IS 'Tipo da insígnia (CONQUISTA, MILESTONE, etc)';
COMMENT ON COLUMN partner_badges.requirements IS 'Requisitos para conquistar esta insígnia';

-- Comentários partner_earned_badges
COMMENT ON COLUMN partner_earned_badges.partner_id IS 'ID do parceiro que conquistou';
COMMENT ON COLUMN partner_earned_badges.badge_id IS 'ID da insígnia conquistada';
COMMENT ON COLUMN partner_earned_badges.earned_at IS 'Data/hora da conquista';

-- Políticas de segurança RLS
ALTER TABLE partner_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_earned_badges ENABLE ROW LEVEL SECURITY;

-- Políticas para partner_levels
CREATE POLICY partner_levels_tenant_isolation ON partner_levels
    USING (client_id IN (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid()));

-- Políticas para partner_badges
CREATE POLICY partner_badges_tenant_isolation ON partner_badges
    USING (client_id IN (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid()));

-- Políticas para partner_earned_badges
CREATE POLICY partner_earned_badges_tenant_isolation ON partner_earned_badges
    USING (client_id IN (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid()));

COMMIT;

-- Rollback em caso de problemas
-- Para reverter, execute:
/*
BEGIN;
DROP TABLE IF EXISTS partner_earned_badges;
DROP TABLE IF EXISTS partner_badges;
DROP TABLE IF EXISTS partner_levels;
DROP FUNCTION IF EXISTS update_gamification_timestamp();
COMMIT;
*/ 