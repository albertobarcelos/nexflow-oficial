-- =====================================================
-- MIGRATION: Step Child Card Automations
-- =====================================================
-- Cria sistema de automação para gerar cards filhos
-- quando um card entra em uma etapa específica

-- 1. Criar tabela para configurações de automação
CREATE TABLE IF NOT EXISTS nexflow.step_child_card_automations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id uuid NOT NULL REFERENCES nexflow.steps(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  target_flow_id uuid NOT NULL REFERENCES nexflow.flows(id) ON DELETE CASCADE,
  target_step_id uuid NOT NULL REFERENCES nexflow.steps(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  copy_field_values boolean DEFAULT false,
  copy_assignment boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_step_child_card_automations_step_id ON nexflow.step_child_card_automations(step_id);
CREATE INDEX IF NOT EXISTS idx_step_child_card_automations_client_id ON nexflow.step_child_card_automations(client_id);
CREATE INDEX IF NOT EXISTS idx_step_child_card_automations_active ON nexflow.step_child_card_automations(step_id, is_active) WHERE is_active = true;

-- 3. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION nexflow.update_step_child_card_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para updated_at
CREATE TRIGGER trigger_update_step_child_card_automations_updated_at
  BEFORE UPDATE ON nexflow.step_child_card_automations
  FOR EACH ROW
  EXECUTE FUNCTION nexflow.update_step_child_card_automations_updated_at();

-- 5. Função para atualizar related_card_ids na opportunity
CREATE OR REPLACE FUNCTION nexflow.update_opportunity_related_card_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o card filho tem opportunity_id (herdado do pai), atualizar related_card_ids
  IF NEW.opportunity_id IS NOT NULL AND NEW.parent_card_id IS NOT NULL THEN
    -- Adicionar o ID do card filho ao array related_card_ids da opportunity
    UPDATE nexflow.opportunities
    SET related_card_ids = COALESCE(related_card_ids, ARRAY[]::uuid[]) || NEW.id
    WHERE id = NEW.opportunity_id
      AND (related_card_ids IS NULL OR NOT (NEW.id = ANY(related_card_ids)));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar related_card_ids quando card filho é criado
CREATE TRIGGER trigger_update_opportunity_related_card_ids
  AFTER INSERT ON nexflow.cards
  FOR EACH ROW
  WHEN (NEW.parent_card_id IS NOT NULL AND NEW.opportunity_id IS NOT NULL)
  EXECUTE FUNCTION nexflow.update_opportunity_related_card_ids();

-- 7. Função principal para criar card filho quando card entra em etapa
CREATE OR REPLACE FUNCTION nexflow.create_child_card_on_step_entry()
RETURNS TRIGGER AS $$
DECLARE
  automation_record RECORD;
  parent_card RECORD;
  new_card_id uuid;
  max_position integer;
  child_field_values jsonb;
  child_assigned_to uuid;
  child_assigned_team_id uuid;
  child_agents uuid[];
BEGIN
  -- Só processar se o step_id mudou
  IF OLD.step_id IS DISTINCT FROM NEW.step_id THEN
    -- Buscar automações ativas para a nova etapa
    FOR automation_record IN
      SELECT 
        id,
        target_flow_id,
        target_step_id,
        copy_field_values,
        copy_assignment
      FROM nexflow.step_child_card_automations
      WHERE step_id = NEW.step_id
        AND is_active = true
        AND client_id = NEW.client_id
    LOOP
      -- Verificar se o flow e step de destino existem e pertencem ao mesmo client_id
      IF EXISTS (
        SELECT 1 
        FROM nexflow.flows f
        INNER JOIN nexflow.steps s ON s.flow_id = f.id
        WHERE f.id = automation_record.target_flow_id
          AND s.id = automation_record.target_step_id
          AND f.client_id = NEW.client_id
      ) THEN
        -- Buscar dados do card pai
        SELECT 
          field_values,
          assigned_to,
          assigned_team_id,
          agents,
          opportunity_id
        INTO parent_card
        FROM nexflow.cards
        WHERE id = NEW.id;
        
        -- Preparar valores do card filho
        IF automation_record.copy_field_values AND parent_card.field_values IS NOT NULL THEN
          child_field_values := parent_card.field_values;
        ELSE
          child_field_values := '{}'::jsonb;
        END IF;
        
        IF automation_record.copy_assignment THEN
          child_assigned_to := parent_card.assigned_to;
          child_assigned_team_id := parent_card.assigned_team_id;
          child_agents := parent_card.agents;
        ELSE
          child_assigned_to := NULL;
          child_assigned_team_id := NULL;
          child_agents := NULL;
        END IF;
        
        -- Calcular a próxima posição para o card filho
        SELECT COALESCE(MAX(position), 0) + 1000
        INTO max_position
        FROM nexflow.cards
        WHERE step_id = automation_record.target_step_id;
        
        -- Criar o card filho
        INSERT INTO nexflow.cards (
          flow_id,
          step_id,
          client_id,
          title,
          parent_card_id,
          opportunity_id,
          position,
          field_values,
          checklist_progress,
          assigned_to,
          assigned_team_id,
          agents
        )
        VALUES (
          automation_record.target_flow_id,
          automation_record.target_step_id,
          NEW.client_id,
          NEW.title || ' (Filho)',
          NEW.id,
          parent_card.opportunity_id,
          max_position,
          child_field_values,
          '{}'::jsonb,
          child_assigned_to,
          child_assigned_team_id,
          child_agents
        )
        RETURNING id INTO new_card_id;
        
        -- Registrar no histórico do card pai
        INSERT INTO nexflow.card_history (
          card_id,
          client_id,
          from_step_id,
          to_step_id,
          action_type,
          details
        )
        VALUES (
          NEW.id,
          NEW.client_id,
          OLD.step_id,
          NEW.step_id,
          'child_card_created',
          jsonb_build_object(
            'child_card_id', new_card_id,
            'automation_id', automation_record.id,
            'target_flow_id', automation_record.target_flow_id,
            'target_step_id', automation_record.target_step_id
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para executar a função quando um card muda de etapa
CREATE TRIGGER trigger_create_child_card_on_step_entry
  AFTER UPDATE OF step_id ON nexflow.cards
  FOR EACH ROW
  WHEN (OLD.step_id IS DISTINCT FROM NEW.step_id)
  EXECUTE FUNCTION nexflow.create_child_card_on_step_entry();

-- 9. Comentários para documentação
COMMENT ON TABLE nexflow.step_child_card_automations IS 'Configurações de automação para criar cards filhos quando um card entra em uma etapa específica';
COMMENT ON FUNCTION nexflow.create_child_card_on_step_entry() IS 'Cria cards filhos automaticamente quando um card entra em uma etapa com automação configurada';
COMMENT ON FUNCTION nexflow.update_opportunity_related_card_ids() IS 'Atualiza related_card_ids na opportunity quando um card filho é criado';

