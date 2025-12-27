-- =====================================================
-- TRIGGER: Auto-create Cards from Opportunities
-- =====================================================
-- Cria cards automaticamente quando uma oportunidade é criada,
-- baseado nas regras de automação configuradas

-- Função para criar cards automaticamente a partir de uma oportunidade
CREATE OR REPLACE FUNCTION nexflow.auto_create_cards_from_opportunity()
RETURNS TRIGGER AS $$
DECLARE
  automation_record RECORD;
  new_card_id uuid;
  max_position integer;
BEGIN
  -- Buscar todas as regras de automação ativas para o client_id da oportunidade
  FOR automation_record IN
    SELECT 
      id,
      target_flow_id,
      target_step_id,
      trigger_conditions
    FROM nexflow.opportunity_automations
    WHERE client_id = NEW.client_id
      AND is_active = true
  LOOP
    -- Verificar se o flow e step existem e pertencem ao mesmo client_id
    -- (validação adicional de segurança)
    IF EXISTS (
      SELECT 1 
      FROM nexflow.flows f
      INNER JOIN nexflow.steps s ON s.flow_id = f.id
      WHERE f.id = automation_record.target_flow_id
        AND s.id = automation_record.target_step_id
        AND f.client_id = NEW.client_id
    ) THEN
      -- Calcular a próxima posição para o card
      SELECT COALESCE(MAX(position), 0) + 1000
      INTO max_position
      FROM nexflow.cards
      WHERE step_id = automation_record.target_step_id;
      
      -- Criar o card vinculado à oportunidade
      INSERT INTO nexflow.cards (
        flow_id,
        step_id,
        client_id,
        title,
        opportunity_id,
        position,
        field_values,
        checklist_progress
      )
      VALUES (
        automation_record.target_flow_id,
        automation_record.target_step_id,
        NEW.client_id,
        COALESCE(NEW.name, 'Nova Oportunidade'),
        NEW.id,
        max_position,
        '{}'::jsonb,
        '{}'::jsonb
      )
      RETURNING id INTO new_card_id;
      
      -- Log da criação (opcional - pode ser usado para auditoria)
      -- INSERT INTO nexflow.card_history (card_id, client_id, action_type, details)
      -- VALUES (new_card_id, NEW.client_id, 'auto_created_from_opportunity', 
      --   jsonb_build_object('opportunity_id', NEW.id, 'automation_id', automation_record.id));
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função quando uma oportunidade é criada
CREATE TRIGGER trigger_auto_create_cards_from_opportunity
  AFTER INSERT ON nexflow.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION nexflow.auto_create_cards_from_opportunity();

-- Comentários para documentação
COMMENT ON FUNCTION nexflow.auto_create_cards_from_opportunity() IS 'Cria cards automaticamente quando uma oportunidade é inserida, baseado nas regras de automação ativas';


