-- =====================================================
-- MIGRATION: Opportunity-Card Integration
-- =====================================================
-- Adiciona coluna opportunity_id na tabela cards
-- Cria tabela opportunity_automations para regras de automação

-- 1. Adicionar coluna opportunity_id na tabela nexflow.cards
ALTER TABLE nexflow.cards
ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES nexflow.opportunities(id) ON DELETE SET NULL;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_nexflow_cards_opportunity_id ON nexflow.cards(opportunity_id);

-- 3. Criar tabela para configuração de automação
CREATE TABLE IF NOT EXISTS nexflow.opportunity_automations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  target_flow_id uuid NOT NULL REFERENCES nexflow.flows(id) ON DELETE CASCADE,
  target_step_id uuid NOT NULL REFERENCES nexflow.steps(id) ON DELETE CASCADE,
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_opportunity_automations_client_id ON nexflow.opportunity_automations(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_automations_active ON nexflow.opportunity_automations(client_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_opportunity_automations_flow_step ON nexflow.opportunity_automations(target_flow_id, target_step_id);

-- 5. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION nexflow.update_opportunity_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para updated_at
CREATE TRIGGER trigger_update_opportunity_automations_updated_at
  BEFORE UPDATE ON nexflow.opportunity_automations
  FOR EACH ROW
  EXECUTE FUNCTION nexflow.update_opportunity_automations_updated_at();

-- 7. Comentários para documentação
COMMENT ON TABLE nexflow.opportunity_automations IS 'Configuração de regras de automação para criação automática de cards a partir de oportunidades';
COMMENT ON COLUMN nexflow.opportunity_automations.trigger_conditions IS 'Condições adicionais para disparar a automação (ex: tags, origem, etc.) - formato JSONB';
COMMENT ON COLUMN nexflow.cards.opportunity_id IS 'Referência à oportunidade que originou este card';







