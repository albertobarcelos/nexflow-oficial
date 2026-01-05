-- =====================================================
-- SISTEMA DE COMISSÕES POR TIME
-- =====================================================
-- Este arquivo contém todas as migrações necessárias
-- para implementar o sistema de comissões por time
-- com divisão interna por níveis hierárquicos
--
-- NOTA: Todas as tabelas são criadas no schema 'public'
-- seguindo o padrão do sistema onde:
-- - Schema 'public': core_*, web_* (sistema base e CRM)
-- - Schema 'nexflow': nexflow.* (módulo de flows)
-- =====================================================

-- =====================================================
-- 1. ALTERAÇÕES EM TABELAS EXISTENTES
-- =====================================================

-- Adicionar campos de comissão padrão em core_teams
ALTER TABLE core_teams
ADD COLUMN IF NOT EXISTS default_commission_type VARCHAR(20) CHECK (default_commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS default_commission_value DECIMAL(10,2);

-- Adicionar campo de time em web_deals
ALTER TABLE web_deals
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES core_teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_team ON web_deals(team_id);

-- Adicionar campo de código em web_products
ALTER TABLE web_products
ADD COLUMN IF NOT EXISTS product_code VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_products_code ON web_products(product_code);

-- =====================================================
-- 2. TABELA: NÍVEIS HIERÁRQUICOS DOS TIMES
-- =====================================================

CREATE TABLE IF NOT EXISTS core_team_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Líder", "Sênior", "Pleno", "Júnior"
  level_order INTEGER NOT NULL, -- Ordem hierárquica (1 = mais alto)
  commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, level_order)
);

CREATE INDEX IF NOT EXISTS idx_team_levels_team_id ON core_team_levels(team_id);
CREATE INDEX IF NOT EXISTS idx_team_levels_client_id ON core_team_levels(client_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_team_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_levels_updated_at
  BEFORE UPDATE ON core_team_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 3. TABELA: VINCULAÇÃO DE MEMBROS A NÍVEIS
-- =====================================================

CREATE TABLE IF NOT EXISTS core_team_member_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID NOT NULL, -- Referência a core_team_members (sem FK para flexibilidade)
  level_id UUID NOT NULL REFERENCES core_team_levels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core_client_users(id) ON DELETE CASCADE,
  effective_from TIMESTAMPTZ DEFAULT NOW(), -- Data de início do nível
  effective_to TIMESTAMPTZ, -- Data de término (NULL = ativo)
  is_active BOOLEAN DEFAULT TRUE,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_member_levels_member ON core_team_member_levels(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_levels_user ON core_team_member_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_team_member_levels_level ON core_team_member_levels(level_id);
CREATE INDEX IF NOT EXISTS idx_team_member_levels_active ON core_team_member_levels(user_id, is_active) WHERE is_active = TRUE;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_team_member_levels_updated_at
  BEFORE UPDATE ON core_team_member_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 4. TABELA: COMISSÕES POR TIME E PRODUTO
-- =====================================================

CREATE TABLE IF NOT EXISTS core_team_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  product_id UUID REFERENCES web_products(id) ON DELETE SET NULL, -- NULL = todos os produtos
  product_code VARCHAR(100), -- Código do produto (ex: "XPTO") para busca rápida
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('percentage', 'fixed')), -- % ou valor fixo
  commission_value DECIMAL(10,2) NOT NULL CHECK (commission_value >= 0), -- Valor da comissão (% ou R$)
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Garantir que não haja duplicatas para mesma combinação
  CONSTRAINT unique_team_product_commission UNIQUE(team_id, COALESCE(product_id::text, ''), COALESCE(product_code, ''))
);

CREATE INDEX IF NOT EXISTS idx_team_commissions_team ON core_team_commissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_commissions_product ON core_team_commissions(product_id);
CREATE INDEX IF NOT EXISTS idx_team_commissions_code ON core_team_commissions(product_code);
CREATE INDEX IF NOT EXISTS idx_team_commissions_active ON core_team_commissions(team_id, is_active) WHERE is_active = TRUE;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_team_commissions_updated_at
  BEFORE UPDATE ON core_team_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 5. TABELA: ITENS DE NEGÓCIO (PRODUTOS VENDIDOS)
-- =====================================================

CREATE TABLE IF NOT EXISTS web_deal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES web_deals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES web_products(id) ON DELETE SET NULL,
  product_code VARCHAR(100), -- Código do produto (ex: "XPTO")
  product_name VARCHAR(255) NOT NULL, -- Nome do produto (snapshot no momento da venda)
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0), -- quantity * unit_price
  description TEXT,
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_items_deal ON web_deal_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_product ON web_deal_items(product_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_code ON web_deal_items(product_code);

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_deal_items_updated_at
  BEFORE UPDATE ON web_deal_items
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- Trigger para calcular total_price automaticamente
CREATE OR REPLACE FUNCTION calculate_deal_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_deal_item_total
  BEFORE INSERT OR UPDATE ON web_deal_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_deal_item_total();

-- =====================================================
-- 6. TABELA: CÁLCULOS DE COMISSÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS core_commission_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES web_deals(id) ON DELETE CASCADE,
  deal_item_id UUID REFERENCES web_deal_items(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES core_teams(id) ON DELETE CASCADE,
  product_code VARCHAR(100), -- Código do produto (ex: "XPTO")
  
  -- Comissão do time
  team_commission_type VARCHAR(20) NOT NULL, -- 'percentage' ou 'fixed'
  team_commission_value DECIMAL(10,2) NOT NULL,
  team_commission_amount DECIMAL(10,2) NOT NULL CHECK (team_commission_amount >= 0), -- Valor calculado da comissão do time
  
  -- Distribuição interna
  total_distributed_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (total_distributed_percentage >= 0 AND total_distributed_percentage <= 100),
  total_distributed_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_distributed_amount >= 0),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES core_client_users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_calc_deal ON core_commission_calculations(deal_id);
CREATE INDEX IF NOT EXISTS idx_commission_calc_team ON core_commission_calculations(team_id);
CREATE INDEX IF NOT EXISTS idx_commission_calc_status ON core_commission_calculations(status);
CREATE INDEX IF NOT EXISTS idx_commission_calc_client ON core_commission_calculations(client_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_commission_calc_updated_at
  BEFORE UPDATE ON core_commission_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 7. TABELA: DISTRIBUIÇÃO DE COMISSÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS core_commission_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES core_commission_calculations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core_client_users(id) ON DELETE CASCADE,
  level_id UUID REFERENCES core_team_levels(id) ON DELETE SET NULL,
  
  -- Distribuição
  distribution_percentage DECIMAL(5,2) NOT NULL CHECK (distribution_percentage >= 0 AND distribution_percentage <= 100),
  distribution_amount DECIMAL(10,2) NOT NULL CHECK (distribution_amount >= 0), -- Valor que este usuário recebe
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_dist_calc ON core_commission_distributions(calculation_id);
CREATE INDEX IF NOT EXISTS idx_commission_dist_user ON core_commission_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_dist_status ON core_commission_distributions(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_commission_dist_updated_at
  BEFORE UPDATE ON core_commission_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 8. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para validar distribuição de comissão
CREATE OR REPLACE FUNCTION validate_commission_distribution(
  p_calculation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_total_percentage DECIMAL(5,2);
BEGIN
  SELECT COALESCE(SUM(distribution_percentage), 0)
  INTO v_total_percentage
  FROM core_commission_distributions
  WHERE calculation_id = p_calculation_id
    AND status != 'cancelled';
  
  RETURN v_total_percentage <= 100;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar comissão do time para um produto
CREATE OR REPLACE FUNCTION get_team_commission(
  p_team_id UUID,
  p_product_id UUID DEFAULT NULL,
  p_product_code VARCHAR DEFAULT NULL
) RETURNS TABLE (
  commission_type VARCHAR,
  commission_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.commission_type,
    tc.commission_value
  FROM core_team_commissions tc
  WHERE tc.team_id = p_team_id
    AND tc.is_active = TRUE
    AND (
      (p_product_id IS NOT NULL AND tc.product_id = p_product_id)
      OR (p_product_code IS NOT NULL AND tc.product_code = p_product_code)
      OR (tc.product_id IS NULL AND tc.product_code IS NULL) -- Comissão padrão
    )
  ORDER BY 
    CASE WHEN tc.product_id IS NOT NULL THEN 1 ELSE 2 END, -- Prioridade: produto específico
    CASE WHEN tc.product_code IS NOT NULL THEN 1 ELSE 2 END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE core_team_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_team_member_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_team_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_deal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commission_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commission_distributions ENABLE ROW LEVEL SECURITY;

-- Políticas para core_team_levels
CREATE POLICY "Users can view team levels of their client"
  ON core_team_levels FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Administrators can manage team levels"
  ON core_team_levels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = core_team_levels.client_id
    )
  );

-- Políticas para core_team_member_levels
CREATE POLICY "Users can view member levels of their client"
  ON core_team_member_levels FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Administrators can manage member levels"
  ON core_team_member_levels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = core_team_member_levels.client_id
    )
  );

-- Políticas para core_team_commissions
CREATE POLICY "Users can view team commissions of their client"
  ON core_team_commissions FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Administrators can manage team commissions"
  ON core_team_commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = core_team_commissions.client_id
    )
  );

-- Políticas para web_deal_items
CREATE POLICY "Users can view deal items of their client"
  ON web_deal_items FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage deal items of their client"
  ON web_deal_items FOR ALL
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

-- Políticas para core_commission_calculations
CREATE POLICY "Users can view commission calculations of their client"
  ON core_commission_calculations FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Administrators can manage commission calculations"
  ON core_commission_calculations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = core_commission_calculations.client_id
    )
  );

-- Políticas para core_commission_distributions
CREATE POLICY "Users can view their own commission distributions"
  ON core_commission_distributions FOR SELECT
  USING (
    user_id = auth.uid()
    OR client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Administrators can manage commission distributions"
  ON core_commission_distributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = core_commission_distributions.client_id
    )
  );

-- =====================================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE core_team_levels IS 'Níveis hierárquicos dentro de um time com percentuais de comissão';
COMMENT ON TABLE core_team_member_levels IS 'Vinculação de membros do time aos seus níveis hierárquicos';
COMMENT ON TABLE core_team_commissions IS 'Configuração de comissões por time e produto';
COMMENT ON TABLE web_deal_items IS 'Itens (produtos) vendidos em um negócio';
COMMENT ON TABLE core_commission_calculations IS 'Cálculos de comissão realizados para negócios fechados';
COMMENT ON TABLE core_commission_distributions IS 'Distribuição da comissão entre membros do time';

COMMENT ON COLUMN core_team_levels.level_order IS 'Ordem hierárquica: 1 = nível mais alto';
COMMENT ON COLUMN core_team_levels.commission_percentage IS 'Percentual de comissão deste nível (0-100)';
COMMENT ON COLUMN core_team_commissions.product_code IS 'Código do produto (ex: "XPTO") para busca rápida';
COMMENT ON COLUMN core_team_commissions.commission_type IS 'Tipo: "percentage" (percentual) ou "fixed" (valor fixo)';
COMMENT ON COLUMN web_deal_items.product_code IS 'Código do produto no momento da venda (snapshot)';
