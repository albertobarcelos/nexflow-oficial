-- =====================================================
-- MIGRATION: Renomear opportunities para contacts
-- =====================================================
-- Renomeia a tabela nexflow.opportunities para nexflow.contacts
-- e atualiza todas as referências (FKs, índices, triggers, etc.)

-- 1. Renomear a tabela
ALTER TABLE nexflow.opportunities RENAME TO contacts;

-- 2. Renomear constraints e índices relacionados
ALTER INDEX IF EXISTS idx_nexflow_cards_opportunity_id RENAME TO idx_nexflow_cards_contact_id;

-- 3. Renomear coluna opportunity_id em nexflow.cards
ALTER TABLE nexflow.cards RENAME COLUMN opportunity_id TO contact_id;

-- 4. Atualizar constraint FK em nexflow.cards
ALTER TABLE nexflow.cards 
  DROP CONSTRAINT IF EXISTS cards_opportunity_id_fkey,
  ADD CONSTRAINT cards_contact_id_fkey 
    FOREIGN KEY (contact_id) 
    REFERENCES nexflow.contacts(id) 
    ON DELETE SET NULL;

-- 5. Renomear constraint FK em core_teams
ALTER TABLE public.core_teams 
  DROP CONSTRAINT IF EXISTS opportunities_assigned_team_id_fkey,
  ADD CONSTRAINT contacts_assigned_team_id_fkey 
    FOREIGN KEY (assigned_team_id) 
    REFERENCES public.core_teams(id) 
    ON DELETE SET NULL;

-- 6. Atualizar constraint FK em core_clients
ALTER TABLE nexflow.contacts 
  DROP CONSTRAINT IF EXISTS opportunities_client_id_fkey,
  ADD CONSTRAINT contacts_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES public.core_clients(id) 
    ON DELETE CASCADE;

-- 7. Renomear tabela de automações
ALTER TABLE nexflow.opportunity_automations RENAME TO contact_automations;

-- 8. Atualizar constraint FK em contact_automations
ALTER TABLE nexflow.contact_automations 
  DROP CONSTRAINT IF EXISTS opportunity_automations_target_flow_id_fkey,
  ADD CONSTRAINT contact_automations_target_flow_id_fkey 
    FOREIGN KEY (target_flow_id) 
    REFERENCES nexflow.flows(id) 
    ON DELETE CASCADE;

ALTER TABLE nexflow.contact_automations 
  DROP CONSTRAINT IF EXISTS opportunity_automations_target_step_id_fkey,
  ADD CONSTRAINT contact_automations_target_step_id_fkey 
    FOREIGN KEY (target_step_id) 
    REFERENCES nexflow.steps(id) 
    ON DELETE CASCADE;

-- 9. Renomear função de automação
ALTER FUNCTION nexflow.auto_create_cards_from_opportunity() RENAME TO auto_create_cards_from_contact;

-- 10. Atualizar trigger para usar novo nome
DROP TRIGGER IF EXISTS trigger_auto_create_cards_from_opportunity ON nexflow.contacts;
CREATE TRIGGER trigger_auto_create_cards_from_contact
  AFTER INSERT ON nexflow.contacts
  FOR EACH ROW
  EXECUTE FUNCTION nexflow.auto_create_cards_from_contact();

-- 11. Atualizar função para usar novo nome da tabela
CREATE OR REPLACE FUNCTION nexflow.auto_create_cards_from_contact()
RETURNS TRIGGER AS $$
DECLARE
  automation_record RECORD;
  new_card_id UUID;
BEGIN
  -- Buscar automações ativas para este client_id
  FOR automation_record IN
    SELECT * FROM nexflow.contact_automations
    WHERE client_id = NEW.client_id
      AND is_active = true
  LOOP
    -- Criar card no flow e step configurados
    INSERT INTO nexflow.cards (
      client_id,
      flow_id,
      step_id,
      title,
      lead,
      assigned_team_id,
      contact_id,
      created_at
    ) VALUES (
      NEW.client_id,
      automation_record.target_flow_id,
      automation_record.target_step_id,
      COALESCE(NEW.client_name, 'Novo Contato'),
      NEW.main_contact,
      NEW.assigned_team_id,
      NEW.id,
      NOW()
    )
    RETURNING id INTO new_card_id;

    -- Atualizar related_card_ids na oportunidade (agora contact)
    UPDATE nexflow.contacts
    SET related_card_ids = COALESCE(related_card_ids, ARRAY[]::uuid[]) || new_card_id
    WHERE id = NEW.id
      AND (related_card_ids IS NULL OR NOT (new_card_id = ANY(related_card_ids)));
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Atualizar trigger em step_child_card_automations
CREATE OR REPLACE FUNCTION nexflow.update_contact_related_cards()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar related_card_ids na tabela contacts quando um card é criado
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE nexflow.contacts
    SET related_card_ids = COALESCE(related_card_ids, ARRAY[]::uuid[]) || NEW.id
    WHERE id = NEW.contact_id
      AND (related_card_ids IS NULL OR NOT (NEW.id = ANY(related_card_ids)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Atualizar comentários
COMMENT ON TABLE nexflow.contacts IS 'Contatos capturados através de formulários públicos ou outras fontes';
COMMENT ON COLUMN nexflow.cards.contact_id IS 'Referência ao contato que originou este card';
COMMENT ON FUNCTION nexflow.auto_create_cards_from_contact() IS 'Cria cards automaticamente quando um contato é inserido, baseado nas regras de automação ativas';
