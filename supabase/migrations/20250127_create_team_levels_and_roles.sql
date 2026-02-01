-- =====================================================
-- SISTEMA DE NÍVEIS E PAPÉIS DE TIME
-- =====================================================
-- Sistema configurável de níveis hierárquicos e papéis
-- dentro dos times para cálculo de comissões
-- =====================================================

-- =====================================================
-- 1. EXTENDER ENUM DE ROLES DO TIME
-- =====================================================
-- Adicionar novos papéis: EC, EV, SDR, EP

-- Verificar se enum existe e adicionar novos valores
DO $$
BEGIN
  -- Adicionar novos valores ao enum se não existirem
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ec' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role_type')) THEN
    ALTER TYPE team_role_type ADD VALUE 'ec';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ev' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role_type')) THEN
    ALTER TYPE team_role_type ADD VALUE 'ev';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sdr' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role_type')) THEN
    ALTER TYPE team_role_type ADD VALUE 'sdr';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ep' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role_type')) THEN
    ALTER TYPE team_role_type ADD VALUE 'ep';
  END IF;
END $$;

-- =====================================================
-- 2. AJUSTAR TABELA DE NÍVEIS PARA SUPORTAR TIPOS DE ITEM
-- =====================================================
-- Níveis agora têm percentuais diferentes para implantação e mensalidade

-- Adicionar campos de comissão por tipo de item
ALTER TABLE core_team_levels
ADD COLUMN IF NOT EXISTS commission_implantation_percentage DECIMAL(5,2) CHECK (commission_implantation_percentage >= 0 AND commission_implantation_percentage <= 100),
ADD COLUMN IF NOT EXISTS commission_recurring_percentage DECIMAL(5,2) CHECK (commission_recurring_percentage >= 0 AND commission_recurring_percentage <= 100);

-- Manter commission_percentage para compatibilidade (será usado como padrão se os específicos forem NULL)
COMMENT ON COLUMN core_team_levels.commission_percentage IS 'Percentual padrão de comissão (usado se commission_implantation_percentage ou commission_recurring_percentage forem NULL)';
COMMENT ON COLUMN core_team_levels.commission_implantation_percentage IS 'Percentual de comissão para itens de implantação (one_time)';
COMMENT ON COLUMN core_team_levels.commission_recurring_percentage IS 'Percentual de comissão para itens recorrentes (recurring)';

-- =====================================================
-- 3. TABELA: COMISSÕES POR PAPEL DO MEMBRO
-- =====================================================
-- Define comissão específica por papel (EC, EV, SDR, EP)
-- dentro de um time

CREATE TABLE IF NOT EXISTS core_team_role_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  role team_role_type NOT NULL, -- 'ec', 'ev', 'sdr', 'ep', etc.
  
  -- Comissão sobre recorrência
  recurring_commission_type VARCHAR(20) NOT NULL CHECK (recurring_commission_type IN ('percentage', 'fixed', 'team_percentage')),
  recurring_commission_value DECIMAL(10,2) CHECK (recurring_commission_value >= 0),
  -- Se team_percentage: percentual da comissão do time (ex: EV = 50% da comissão do time)
  
  -- Duração da comissão recorrente
  recurring_duration_months INTEGER, -- NULL = enquanto cliente estiver ativo
  recurring_while_active BOOLEAN DEFAULT TRUE, -- TRUE = enquanto cliente ativo
  
  -- Comissão sobre implantação
  implantation_commission_type VARCHAR(20) CHECK (implantation_commission_type IN ('percentage', 'fixed', 'team_percentage')),
  implantation_commission_value DECIMAL(10,2) CHECK (implantation_commission_value >= 0),
  
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, role)
);

CREATE INDEX IF NOT EXISTS idx_team_role_commissions_team ON core_team_role_commissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_role_commissions_role ON core_team_role_commissions(role);
CREATE INDEX IF NOT EXISTS idx_team_role_commissions_active ON core_team_role_commissions(team_id, is_active) WHERE is_active = TRUE;

CREATE TRIGGER trigger_update_team_role_commissions_updated_at
  BEFORE UPDATE ON core_team_role_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 4. TABELA: CARTERA DE CLIENTES POR TIME
-- =====================================================
-- Rastreia quais clientes (cards completados) pertencem a cada time
-- e seu status (ativo/cancelado)

CREATE TABLE IF NOT EXISTS core_team_client_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE,
  
  -- Status do cliente
  client_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (client_status IN ('active', 'canceled', 'suspended')),
  
  -- Datas importantes
  closed_at TIMESTAMPTZ NOT NULL, -- Data que o card foi completado (cliente fechado)
  activated_at TIMESTAMPTZ, -- Data de ativação do cliente
  canceled_at TIMESTAMPTZ, -- Data de cancelamento (se cancelado)
  
  -- Informações do fechamento
  total_implantation_value DECIMAL(10,2), -- Valor total de implantação
  monthly_recurring_value DECIMAL(10,2), -- Valor mensal recorrente
  
  -- Rastreamento
  notes TEXT,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_team_portfolio_team ON core_team_client_portfolio(team_id);
CREATE INDEX IF NOT EXISTS idx_team_portfolio_card ON core_team_client_portfolio(card_id);
CREATE INDEX IF NOT EXISTS idx_team_portfolio_status ON core_team_client_portfolio(client_status);
CREATE INDEX IF NOT EXISTS idx_team_portfolio_active ON core_team_client_portfolio(team_id, client_status) WHERE client_status = 'active';

CREATE TRIGGER trigger_update_team_portfolio_updated_at
  BEFORE UPDATE ON core_team_client_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 5. AJUSTAR TABELA DE DISTRIBUIÇÃO DE COMISSÕES
-- =====================================================
-- Adicionar campos para rastrear papel do membro e tipo de item

ALTER TABLE core_commission_distributions
ADD COLUMN IF NOT EXISTS member_role team_role_type,
ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) CHECK (item_type IN ('implantation', 'recurring')),
ADD COLUMN IF NOT EXISTS recurring_month_number INTEGER, -- Para comissões recorrentes: qual mês (1, 2, 3...)
ADD COLUMN IF NOT EXISTS is_recurring_while_active BOOLEAN DEFAULT FALSE; -- TRUE = comissão enquanto cliente ativo

COMMENT ON COLUMN core_commission_distributions.member_role IS 'Papel do membro no time (EC, EV, SDR, EP)';
COMMENT ON COLUMN core_commission_distributions.item_type IS 'Tipo do item: implantation (implantação) ou recurring (recorrente)';
COMMENT ON COLUMN core_commission_distributions.recurring_month_number IS 'Número do mês para comissão recorrente (1, 2, 3...)';
COMMENT ON COLUMN core_commission_distributions.is_recurring_while_active IS 'TRUE = comissão enquanto cliente estiver ativo';

-- =====================================================
-- 6. POLÍTICAS RLS
-- =====================================================

ALTER TABLE core_team_role_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_team_client_portfolio ENABLE ROW LEVEL SECURITY;

-- Políticas para core_team_role_commissions
CREATE POLICY "Users can view role commissions of their client"
  ON core_team_role_commissions FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Administrators can manage role commissions"
  ON core_team_role_commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = core_team_role_commissions.client_id
    )
  );

-- Políticas para core_team_client_portfolio
CREATE POLICY "Users can view portfolio of their client"
  ON core_team_client_portfolio FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage portfolio of their client"
  ON core_team_client_portfolio FOR ALL
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 7. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE core_team_role_commissions IS 'Configuração de comissões por papel do membro (EC, EV, SDR, EP) dentro de um time';
COMMENT ON TABLE core_team_client_portfolio IS 'Carteira de clientes por time - rastreia clientes fechados e seu status (ativo/cancelado)';

COMMENT ON COLUMN core_team_role_commissions.recurring_commission_type IS 'Tipo: percentage (%), fixed (R$), team_percentage (% da comissão do time)';
COMMENT ON COLUMN core_team_role_commissions.recurring_duration_months IS 'Duração em meses (NULL = enquanto cliente ativo)';
COMMENT ON COLUMN core_team_role_commissions.recurring_while_active IS 'TRUE = comissão enquanto cliente estiver ativo';
COMMENT ON COLUMN core_team_client_portfolio.client_status IS 'Status: active (ativo), canceled (cancelado), suspended (suspenso)';
