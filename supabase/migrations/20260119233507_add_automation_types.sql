-- =====================================================
-- MIGRATION: Adicionar Tipos de Automação
-- =====================================================
-- Adiciona suporte para diferentes tipos de automação:
-- - simple: Automação simples (sempre cria)
-- - field_conditional: Automação baseada em campo
-- - contact_type: Automação baseada em tipo de contato

-- 1. Adicionar coluna automation_type na tabela contact_automations
ALTER TABLE public.contact_automations
ADD COLUMN IF NOT EXISTS automation_type VARCHAR(20) DEFAULT 'simple'
CHECK (automation_type IN ('simple', 'field_conditional', 'contact_type'));

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_contact_automations_type 
ON public.contact_automations(client_id, automation_type, is_active) 
WHERE is_active = true;

-- 3. Atualizar função auto_create_cards_from_contact() para suportar diferentes tipos
CREATE OR REPLACE FUNCTION public.auto_create_cards_from_contact()
RETURNS TRIGGER AS $$
DECLARE
  automation_record RECORD;
  new_card_id UUID;
  field_value TEXT;
  condition_met BOOLEAN;
  target_flow_id_val UUID;
  target_step_id_val UUID;
  trigger_conditions_json JSONB;
BEGIN
  -- Buscar automações ativas para este client_id
  FOR automation_record IN
    SELECT * FROM public.contact_automations
    WHERE client_id = NEW.client_id
      AND is_active = true
  LOOP
    -- Inicializar variáveis
    condition_met := false;
    target_flow_id_val := NULL;
    target_step_id_val := NULL;
    trigger_conditions_json := automation_record.trigger_conditions;

    -- Processar baseado no tipo de automação
    CASE automation_record.automation_type
      WHEN 'simple' THEN
        -- Automação simples: sempre cria no flow/step configurado
        target_flow_id_val := automation_record.target_flow_id;
        target_step_id_val := automation_record.target_step_id;
        condition_met := true;

      WHEN 'field_conditional' THEN
        -- Automação condicional por campo
        -- Estrutura esperada em trigger_conditions:
        -- {
        --   "fieldName": "nome_do_campo",
        --   "conditionValue": "Y",
        --   "trueFlowId": "uuid",
        --   "trueStepId": "uuid",
        --   "falseFlowId": "uuid",
        --   "falseStepId": "uuid"
        -- }
        IF trigger_conditions_json IS NOT NULL THEN
          DECLARE
            field_name TEXT;
            condition_value TEXT;
            true_flow_id TEXT;
            true_step_id TEXT;
            false_flow_id TEXT;
            false_step_id TEXT;
          BEGIN
            field_name := trigger_conditions_json->>'fieldName';
            condition_value := trigger_conditions_json->>'conditionValue';
            true_flow_id := trigger_conditions_json->>'trueFlowId';
            true_step_id := trigger_conditions_json->>'trueStepId';
            false_flow_id := trigger_conditions_json->>'falseFlowId';
            false_step_id := trigger_conditions_json->>'falseStepId';

            -- Obter valor do campo do contato
            CASE field_name
              WHEN 'client_name' THEN
                field_value := NEW.client_name;
              WHEN 'main_contact' THEN
                field_value := NEW.main_contact;
              WHEN 'assigned_team_id' THEN
                field_value := NEW.assigned_team_id::TEXT;
              ELSE
                field_value := NULL;
            END CASE;

            -- Comparar valor e definir flow/step apropriado
            IF field_value = condition_value THEN
              target_flow_id_val := true_flow_id::UUID;
              target_step_id_val := true_step_id::UUID;
              condition_met := true;
            ELSIF false_flow_id IS NOT NULL AND false_step_id IS NOT NULL THEN
              target_flow_id_val := false_flow_id::UUID;
              target_step_id_val := false_step_id::UUID;
              condition_met := true;
            END IF;
          END;
        END IF;

      WHEN 'contact_type' THEN
        -- Automação baseada em tipo de contato
        -- Estrutura esperada em trigger_conditions:
        -- {
        --   "contactType": "parceiro" ou "cliente"
        -- }
        IF trigger_conditions_json IS NOT NULL THEN
          DECLARE
            required_type TEXT;
          BEGIN
            required_type := trigger_conditions_json->>'contactType';
            
            -- Verificar se o array contact_type contém o tipo requerido
            IF NEW.contact_type IS NOT NULL AND required_type = ANY(NEW.contact_type) THEN
              target_flow_id_val := automation_record.target_flow_id;
              target_step_id_val := automation_record.target_step_id;
              condition_met := true;
            END IF;
          END;
        END IF;

      ELSE
        -- Tipo desconhecido, pular
        CONTINUE;
    END CASE;

    -- Criar card se condição foi atendida e flow/step foram definidos
    IF condition_met AND target_flow_id_val IS NOT NULL AND target_step_id_val IS NOT NULL THEN
      -- Verificar se o flow e step existem e pertencem ao mesmo client_id
      IF EXISTS (
        SELECT 1 
        FROM public.flows f
        INNER JOIN public.steps s ON s.flow_id = f.id
        WHERE f.id = target_flow_id_val
          AND s.id = target_step_id_val
          AND f.client_id = NEW.client_id
      ) THEN
        -- Criar card no flow e step configurados
        INSERT INTO public.cards (
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
          target_flow_id_val,
          target_step_id_val,
          COALESCE(NEW.client_name, 'Novo Contato'),
          NEW.main_contact,
          NEW.assigned_team_id,
          NEW.id,
          NOW()
        )
        RETURNING id INTO new_card_id;

        -- Atualizar related_card_ids no contact
        UPDATE public.contacts
        SET related_card_ids = COALESCE(related_card_ids, ARRAY[]::uuid[]) || new_card_id
        WHERE id = NEW.id
          AND (related_card_ids IS NULL OR NOT (new_card_id = ANY(related_card_ids)));
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar comentário da função
COMMENT ON FUNCTION public.auto_create_cards_from_contact() IS 
'Cria cards automaticamente quando um contato é inserido, baseado nas regras de automação ativas. Suporta três tipos: simple (sempre cria), field_conditional (baseado em valor de campo), e contact_type (baseado em tipo de contato)';

-- 5. Comentários para documentação
COMMENT ON COLUMN public.contact_automations.automation_type IS 
'Tipo de automação: simple (sempre cria), field_conditional (condicional por campo), ou contact_type (por tipo de contato)';
