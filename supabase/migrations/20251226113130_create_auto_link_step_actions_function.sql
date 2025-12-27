-- =====================================================
-- FUNÇÕES E TRIGGERS PARA VINCULAÇÃO AUTOMÁTICA
-- =====================================================
-- Vincula automaticamente os processos (step_actions) de uma etapa aos cards
-- quando eles são criados ou movidos para aquela etapa

-- Função para vincular step_actions ao criar um card
CREATE OR REPLACE FUNCTION nexflow.auto_link_step_actions_to_card()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir vinculações para todas as step_actions da etapa
    INSERT INTO nexflow.card_step_actions (card_id, step_action_id, step_id, scheduled_date)
    SELECT 
        NEW.id,
        sa.id,
        NEW.step_id,
        (NEW.created_at + (sa.day_offset || ' days')::INTERVAL)::TIMESTAMPTZ
    FROM nexflow.step_actions sa
    WHERE sa.step_id = NEW.step_id
    ON CONFLICT (card_id, step_action_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar vinculações automaticamente ao inserir um card
CREATE TRIGGER trigger_auto_link_step_actions_on_card_create
    AFTER INSERT ON nexflow.cards
    FOR EACH ROW
    EXECUTE FUNCTION nexflow.auto_link_step_actions_to_card();

-- Função para atualizar vinculações quando um card muda de etapa
CREATE OR REPLACE FUNCTION nexflow.handle_card_step_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o step_id mudou, atualizar vinculações
    IF OLD.step_id IS DISTINCT FROM NEW.step_id THEN
        -- Remover vinculações antigas da etapa anterior
        DELETE FROM nexflow.card_step_actions 
        WHERE card_id = NEW.id AND step_id = OLD.step_id;
        
        -- Criar novas vinculações para a nova etapa
        INSERT INTO nexflow.card_step_actions (card_id, step_action_id, step_id, scheduled_date)
        SELECT 
            NEW.id,
            sa.id,
            NEW.step_id,
            (COALESCE(NEW.updated_at, NOW()) + (sa.day_offset || ' days')::INTERVAL)::TIMESTAMPTZ
        FROM nexflow.step_actions sa
        WHERE sa.step_id = NEW.step_id
        ON CONFLICT (card_id, step_action_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar vinculações quando um card muda de etapa
CREATE TRIGGER trigger_handle_card_step_change
    AFTER UPDATE OF step_id ON nexflow.cards
    FOR EACH ROW
    WHEN (OLD.step_id IS DISTINCT FROM NEW.step_id)
    EXECUTE FUNCTION nexflow.handle_card_step_change();

-- Comentários para documentação
COMMENT ON FUNCTION nexflow.auto_link_step_actions_to_card() IS 'Vincula automaticamente todas as step_actions de uma etapa ao criar um card';
COMMENT ON FUNCTION nexflow.handle_card_step_change() IS 'Atualiza vinculações de step_actions quando um card muda de etapa';

