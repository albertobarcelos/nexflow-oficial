-- =====================================================
-- SISTEMA DE PAGAMENTOS E INTEGRAÇÃO COM REVALYA
-- =====================================================
-- Tabelas para rastrear pagamentos recebidos do Revalya
-- e vincular a cards (nexflow.cards) para cálculo de comissões
-- =====================================================

-- =====================================================
-- 1. TABELA: PAGAMENTOS RECEBIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS web_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE, -- VINCULADO AO CARD
  payment_reference VARCHAR(255), -- Referência do pagamento no Revalya
  payment_date DATE NOT NULL, -- Data do recebimento
  payment_amount DECIMAL(10,2) NOT NULL CHECK (payment_amount > 0), -- Valor recebido
  payment_method VARCHAR(50), -- 'pix', 'boleto', 'credit_card', 'bank_transfer', etc.
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  
  -- Integração com Revalya
  revalya_payment_id VARCHAR(255) UNIQUE, -- ID do pagamento no Revalya
  revalya_sync_at TIMESTAMPTZ, -- Última sincronização com Revalya
  revalya_sync_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (revalya_sync_status IN ('pending', 'synced', 'error')),
  revalya_metadata JSONB DEFAULT '{}', -- Dados adicionais do Revalya
  
  -- Rastreamento
  confirmed_at TIMESTAMPTZ, -- Data/hora da confirmação do pagamento
  confirmed_by UUID REFERENCES core_client_users(id), -- Quem confirmou (se manual)
  notes TEXT, -- Observações sobre o pagamento
  
  -- Multi-tenant
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_card ON web_payments(card_id);
CREATE INDEX IF NOT EXISTS idx_payments_revalya_id ON web_payments(revalya_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON web_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON web_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_client ON web_payments(client_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON web_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_team_levels_updated_at();

-- =====================================================
-- 2. TABELA: LOG DE INTEGRAÇÃO COM REVALYA
-- =====================================================

CREATE TABLE IF NOT EXISTS revalya_integration_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados da sincronização
  sync_type VARCHAR(50) NOT NULL, -- 'payment_received', 'payment_updated', 'payment_cancelled'
  revalya_payment_id VARCHAR(255) NOT NULL,
  card_id UUID REFERENCES nexflow.cards(id),
  payment_id UUID REFERENCES web_payments(id),
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,
  
  -- Dados recebidos do Revalya
  revalya_data JSONB DEFAULT '{}',
  
  -- Multi-tenant
  client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revalya_log_payment ON revalya_integration_log(revalya_payment_id);
CREATE INDEX IF NOT EXISTS idx_revalya_log_card ON revalya_integration_log(card_id);
CREATE INDEX IF NOT EXISTS idx_revalya_log_status ON revalya_integration_log(status);
CREATE INDEX IF NOT EXISTS idx_revalya_log_sync_type ON revalya_integration_log(sync_type);

-- =====================================================
-- 3. AJUSTAR core_commission_calculations
-- =====================================================
-- Adicionar foreign key para web_payments

-- Adicionar constraint de foreign key (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'core_commission_calculations_payment_id_fkey'
  ) THEN
    ALTER TABLE core_commission_calculations
    ADD CONSTRAINT core_commission_calculations_payment_id_fkey
    FOREIGN KEY (payment_id) REFERENCES web_payments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 4. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS
ALTER TABLE web_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revalya_integration_log ENABLE ROW LEVEL SECURITY;

-- Políticas para web_payments
CREATE POLICY "Users can view payments of their client"
  ON web_payments FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage payments of their client"
  ON web_payments FOR ALL
  USING (
    client_id IN (
      SELECT client_id FROM core_client_users WHERE id = auth.uid()
    )
  );

-- Políticas para revalya_integration_log
CREATE POLICY "Administrators can view integration logs"
  ON revalya_integration_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core_client_users
      WHERE id = auth.uid()
      AND role = 'administrator'
      AND client_id = revalya_integration_log.client_id
    )
  );

-- =====================================================
-- 5. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE web_payments IS 'Pagamentos recebidos do Revalya vinculados a cards. Comissão só é calculada quando payment_status = confirmed';
COMMENT ON TABLE revalya_integration_log IS 'Log de sincronizações com Revalya para auditoria e debugging';

COMMENT ON COLUMN web_payments.card_id IS 'Card (nexflow.cards) ao qual o pagamento está vinculado';
COMMENT ON COLUMN web_payments.revalya_payment_id IS 'ID único do pagamento no sistema Revalya';
COMMENT ON COLUMN web_payments.payment_status IS 'Status: pending (aguardando), confirmed (confirmado - dispara cálculo de comissão), cancelled (cancelado), refunded (estornado)';
COMMENT ON COLUMN web_payments.payment_method IS 'Método de pagamento: pix, boleto, credit_card, bank_transfer, etc.';
COMMENT ON COLUMN revalya_integration_log.sync_type IS 'Tipo de sincronização: payment_received, payment_updated, payment_cancelled';
