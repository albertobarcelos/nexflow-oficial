-- =====================================================
-- TABELA: ITENS (PRODUTOS E SERVIÇOS)
-- =====================================================
-- Tabela para armazenar produtos e serviços que podem
-- ser vendidos e gerar comissões
-- =====================================================

CREATE TABLE IF NOT EXISTS web_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  item_code VARCHAR(100), -- Código único do item (ex: "XPTO")
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product', 'service')),
  billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('one_time', 'recurring')),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_items_client ON web_items(client_id);
CREATE INDEX IF NOT EXISTS idx_items_code ON web_items(item_code);
CREATE INDEX IF NOT EXISTS idx_items_type ON web_items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_billing_type ON web_items(billing_type);
CREATE INDEX IF NOT EXISTS idx_items_active ON web_items(is_active);

-- Constraint único para item_code por client_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_client_code_unique ON web_items(client_id, item_code) WHERE item_code IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_items_updated_at
  BEFORE UPDATE ON web_items
  FOR EACH ROW
  EXECUTE FUNCTION update_items_updated_at();

-- RLS Policies
ALTER TABLE web_items ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver itens do seu cliente
CREATE POLICY "Users can view items from their client"
  ON web_items FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

-- Policy: Usuários podem inserir itens no seu cliente
CREATE POLICY "Users can insert items in their client"
  ON web_items FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar itens do seu cliente
CREATE POLICY "Users can update items from their client"
  ON web_items FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

-- Policy: Usuários podem deletar itens do seu cliente
CREATE POLICY "Users can delete items from their client"
  ON web_items FOR DELETE
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE web_items IS 'Tabela de itens (produtos e serviços) que podem ser vendidos e gerar comissões';
COMMENT ON COLUMN web_items.item_code IS 'Código único do item para identificação rápida (ex: "XPTO")';
COMMENT ON COLUMN web_items.item_type IS 'Tipo do item: product (produto) ou service (serviço)';
COMMENT ON COLUMN web_items.billing_type IS 'Tipo de cobrança: one_time (único) ou recurring (recorrente)';
