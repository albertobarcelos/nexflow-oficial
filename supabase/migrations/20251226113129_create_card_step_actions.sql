-- =====================================================
-- TABELA DE RELACIONAMENTO ENTRE CARDS E STEP_ACTIONS
-- =====================================================
-- Permite rastrear quais processos (step_actions) estão vinculados a cada card
-- e seu status de execução

CREATE TABLE IF NOT EXISTS nexflow.card_step_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE,
    step_action_id UUID NOT NULL REFERENCES nexflow.step_actions(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES nexflow.steps(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    scheduled_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    execution_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(card_id, step_action_id)
);

-- Índices para otimizar queries
CREATE INDEX IF NOT EXISTS idx_card_step_actions_card_id ON nexflow.card_step_actions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_step_actions_step_action_id ON nexflow.card_step_actions(step_action_id);
CREATE INDEX IF NOT EXISTS idx_card_step_actions_status ON nexflow.card_step_actions(status);
CREATE INDEX IF NOT EXISTS idx_card_step_actions_scheduled_date ON nexflow.card_step_actions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_card_step_actions_step_id ON nexflow.card_step_actions(step_id);

-- Comentários para documentação
COMMENT ON TABLE nexflow.card_step_actions IS 'Vincula processos (step_actions) aos cards, permitindo rastreamento de execução';
COMMENT ON COLUMN nexflow.card_step_actions.status IS 'Status da execução: pending, in_progress, completed, skipped';
COMMENT ON COLUMN nexflow.card_step_actions.scheduled_date IS 'Data calculada baseada em created_at do card + day_offset da action';
COMMENT ON COLUMN nexflow.card_step_actions.execution_data IS 'Dados específicos da execução (ex: resultado de chamada, email enviado, etc)';

