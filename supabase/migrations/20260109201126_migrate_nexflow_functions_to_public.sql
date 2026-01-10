-- =====================================================
-- MIGRATION: Recriar Funções SQL do Nexflow no Schema Public
-- =====================================================
-- Recria todas as funções SQL do schema nexflow no schema public,
-- atualizando todas as referências internas de nexflow.* para public.*
-- =====================================================

-- =====================================================
-- 1. Função: update_user_notification_settings_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_user_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_user_notification_settings_updated_at() IS 'Atualiza updated_at em user_notification_settings';

-- =====================================================
-- 2. Função: update_card_messages_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_card_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_card_messages_updated_at() IS 'Atualiza updated_at em card_messages';

-- =====================================================
-- 3. Função: notify_card_assigned
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_card_assigned()
RETURNS TRIGGER AS $$
DECLARE
    card_title TEXT;
    card_flow_name TEXT;
    card_step_name TEXT;
    user_name TEXT;
BEGIN
    -- Verificar se assigned_to mudou e não é NULL
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
        -- Buscar informações do card
        SELECT c.title, f.name, s.title
        INTO card_title, card_flow_name, card_step_name
        FROM public.cards c
        JOIN public.flows f ON c.flow_id = f.id
        JOIN public.steps s ON c.step_id = s.id
        WHERE c.id = NEW.id;
        
        -- Buscar nome do usuário atribuído
        SELECT COALESCE(cu.name || ' ' || cu.surname, cu.email, 'Usuário')
        INTO user_name
        FROM public.core_client_users cu
        WHERE cu.id = NEW.assigned_to;
        
        -- Verificar se o usuário quer receber notificações de cards atribuídos
        IF EXISTS (
            SELECT 1 FROM public.user_notification_settings
            WHERE user_id = NEW.assigned_to
            AND notify_card_assigned = true
        ) THEN
            -- Criar notificação
            INSERT INTO public.notifications (
                user_id,
                card_id,
                type,
                title,
                message,
                metadata,
                client_id
            ) VALUES (
                NEW.assigned_to,
                NEW.id,
                'card_assigned',
                'Card atribuído a você',
                COALESCE(card_title, 'Card sem título') || ' foi atribuído a você no fluxo ' || COALESCE(card_flow_name, '') || ', etapa ' || COALESCE(card_step_name, ''),
                jsonb_build_object(
                    'flow_id', NEW.flow_id,
                    'step_id', NEW.step_id,
                    'card_title', card_title
                ),
                NEW.client_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.notify_card_assigned() IS 'Cria notificação quando um card é atribuído a um usuário';

-- =====================================================
-- 4. Função: notify_message_mention
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_message_mention()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user_id UUID;
    card_title TEXT;
    sender_name TEXT;
    message_preview TEXT;
BEGIN
    -- Se há menções na mensagem
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        -- Buscar título do card
        SELECT c.title INTO card_title
        FROM public.cards c
        WHERE c.id = NEW.card_id;
        
        -- Buscar nome do remetente
        SELECT COALESCE(cu.name || ' ' || cu.surname, cu.email, 'Usuário')
        INTO sender_name
        FROM public.core_client_users cu
        WHERE cu.id = NEW.user_id;
        
        -- Preview da mensagem (primeiros 100 caracteres)
        message_preview := LEFT(COALESCE(NEW.content, ''), 100);
        IF LENGTH(COALESCE(NEW.content, '')) > 100 THEN
            message_preview := message_preview || '...';
        END IF;
        
        -- Criar notificação para cada usuário mencionado
        FOREACH mentioned_user_id IN ARRAY NEW.mentions
        LOOP
            -- Verificar se o usuário quer receber notificações de menções
            IF EXISTS (
                SELECT 1 FROM public.user_notification_settings
                WHERE user_id = mentioned_user_id
                AND notify_mentions = true
            ) AND mentioned_user_id != NEW.user_id THEN -- Não notificar o próprio remetente
                INSERT INTO public.notifications (
                    user_id,
                    card_id,
                    message_id,
                    type,
                    title,
                    message,
                    metadata,
                    client_id
                ) VALUES (
                    mentioned_user_id,
                    NEW.card_id,
                    NEW.id,
                    'message_mention',
                    'Você foi mencionado',
                    sender_name || ' mencionou você em ' || COALESCE(card_title, 'um card') || ': ' || message_preview,
                    jsonb_build_object(
                        'card_id', NEW.card_id,
                        'message_id', NEW.id,
                        'sender_id', NEW.user_id,
                        'sender_name', sender_name
                    ),
                    NEW.client_id
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.notify_message_mention() IS 'Cria notificações quando usuários são mencionados em mensagens';

-- =====================================================
-- 5. Função: notify_new_card_in_stage
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_new_card_in_stage()
RETURNS TRIGGER AS $$
DECLARE
    user_setting RECORD;
    step_id_in_array BOOLEAN;
    card_title TEXT;
    flow_name TEXT;
    step_name TEXT;
BEGIN
    -- Para cada usuário com configurações de notificação
    FOR user_setting IN
        SELECT * FROM public.user_notification_settings
        WHERE client_id = NEW.client_id
        AND notify_new_cards_in_stages IS NOT NULL
        AND jsonb_array_length(notify_new_cards_in_stages) > 0
    LOOP
        -- Verificar se o step_id está no array de notificações
        step_id_in_array := EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(user_setting.notify_new_cards_in_stages) AS step_id_text
            WHERE step_id_text::uuid = NEW.step_id
        );
        
        IF step_id_in_array THEN
            -- Buscar informações do card, flow e step
            SELECT c.title, f.name, s.title
            INTO card_title, flow_name, step_name
            FROM public.cards c
            JOIN public.flows f ON c.flow_id = f.id
            JOIN public.steps s ON c.step_id = s.id
            WHERE c.id = NEW.id;
            
            -- Criar notificação
            INSERT INTO public.notifications (
                user_id,
                card_id,
                type,
                title,
                message,
                metadata,
                client_id
            ) VALUES (
                user_setting.user_id,
                NEW.id,
                'new_card_in_stage',
                'Novo card na etapa ' || COALESCE(step_name, ''),
                'Um novo card "' || COALESCE(card_title, 'sem título') || '" foi criado na etapa "' || COALESCE(step_name, '') || '" do fluxo "' || COALESCE(flow_name, '') || '"',
                jsonb_build_object(
                    'flow_id', NEW.flow_id,
                    'step_id', NEW.step_id,
                    'card_title', card_title
                ),
                NEW.client_id
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.notify_new_card_in_stage() IS 'Cria notificações quando novos cards são criados em etapas configuradas pelo usuário';

-- =====================================================
-- 6. Função: auto_create_cards_from_contact
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_create_cards_from_contact()
RETURNS TRIGGER AS $$
DECLARE
  automation_record RECORD;
  new_card_id UUID;
BEGIN
  -- Buscar automações ativas para este client_id
  FOR automation_record IN
    SELECT * FROM public.contact_automations
    WHERE client_id = NEW.client_id
      AND is_active = true
  LOOP
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
      automation_record.target_flow_id,
      automation_record.target_step_id,
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
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_create_cards_from_contact() IS 'Cria cards automaticamente quando um contato é inserido, baseado nas regras de automação ativas';

-- =====================================================
-- 7. Função: update_contact_related_cards
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_contact_related_cards()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar related_card_ids na tabela contacts quando um card é criado
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET related_card_ids = COALESCE(related_card_ids, ARRAY[]::uuid[]) || NEW.id
    WHERE id = NEW.contact_id
      AND (related_card_ids IS NULL OR NOT (NEW.id = ANY(related_card_ids)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_contact_related_cards() IS 'Atualiza related_card_ids na tabela contacts quando um card é criado';

-- =====================================================
-- 8. Função: update_step_child_card_automations_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_step_child_card_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_step_child_card_automations_updated_at() IS 'Atualiza updated_at em step_child_card_automations';

-- =====================================================
-- 9. Função: create_child_card_on_step_entry
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_child_card_on_step_entry()
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
      FROM public.step_child_card_automations
      WHERE step_id = NEW.step_id
        AND is_active = true
        AND client_id = NEW.client_id
    LOOP
      -- Verificar se o flow e step de destino existem e pertencem ao mesmo client_id
      IF EXISTS (
        SELECT 1 
        FROM public.flows f
        INNER JOIN public.steps s ON s.flow_id = f.id
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
          contact_id
        INTO parent_card
        FROM public.cards
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
        FROM public.cards
        WHERE step_id = automation_record.target_step_id;
        
        -- Criar o card filho
        INSERT INTO public.cards (
          flow_id,
          step_id,
          client_id,
          title,
          parent_card_id,
          contact_id,
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
          parent_card.contact_id,
          max_position,
          child_field_values,
          '{}'::jsonb,
          child_assigned_to,
          child_assigned_team_id,
          child_agents
        )
        RETURNING id INTO new_card_id;
        
        -- Registrar no histórico do card pai
        INSERT INTO public.card_history (
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

COMMENT ON FUNCTION public.create_child_card_on_step_entry() IS 'Cria cards filhos automaticamente quando um card entra em uma etapa com automação configurada';

-- =====================================================
-- 10. Função: auto_link_step_actions_to_card
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_link_step_actions_to_card()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir vinculações para todas as step_actions da etapa
    INSERT INTO public.card_step_actions (card_id, step_action_id, step_id, scheduled_date)
    SELECT 
        NEW.id,
        sa.id,
        NEW.step_id,
        (NEW.created_at + (sa.day_offset || ' days')::INTERVAL)::TIMESTAMPTZ
    FROM public.step_actions sa
    WHERE sa.step_id = NEW.step_id
    ON CONFLICT (card_id, step_action_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_link_step_actions_to_card() IS 'Vincula automaticamente todas as step_actions de uma etapa ao criar um card';

-- =====================================================
-- 11. Função: handle_card_step_change
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_card_step_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o step_id mudou, atualizar vinculações
    IF OLD.step_id IS DISTINCT FROM NEW.step_id THEN
        -- Remover vinculações antigas da etapa anterior
        DELETE FROM public.card_step_actions 
        WHERE card_id = NEW.id AND step_id = OLD.step_id;
        
        -- Criar novas vinculações para a nova etapa
        INSERT INTO public.card_step_actions (card_id, step_action_id, step_id, scheduled_date)
        SELECT 
            NEW.id,
            sa.id,
            NEW.step_id,
            (COALESCE(NEW.updated_at, NOW()) + (sa.day_offset || ' days')::INTERVAL)::TIMESTAMPTZ
        FROM public.step_actions sa
        WHERE sa.step_id = NEW.step_id
        ON CONFLICT (card_id, step_action_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_card_step_change() IS 'Atualiza vinculações de step_actions quando um card muda de etapa';

-- =====================================================
-- 12. Função: update_contact_automations_updated_at
-- =====================================================
-- (anteriormente update_opportunity_automations_updated_at)

CREATE OR REPLACE FUNCTION public.update_contact_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_contact_automations_updated_at() IS 'Atualiza updated_at em contact_automations';

-- =====================================================
-- Remover funções antigas do schema nexflow
-- =====================================================

DROP FUNCTION IF EXISTS nexflow.update_user_notification_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS nexflow.update_card_messages_updated_at() CASCADE;
DROP FUNCTION IF EXISTS nexflow.notify_card_assigned() CASCADE;
DROP FUNCTION IF EXISTS nexflow.notify_message_mention() CASCADE;
DROP FUNCTION IF EXISTS nexflow.notify_new_card_in_stage() CASCADE;
DROP FUNCTION IF EXISTS nexflow.auto_create_cards_from_contact() CASCADE;
DROP FUNCTION IF EXISTS nexflow.update_contact_related_cards() CASCADE;
DROP FUNCTION IF EXISTS nexflow.update_step_child_card_automations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS nexflow.create_child_card_on_step_entry() CASCADE;
DROP FUNCTION IF EXISTS nexflow.auto_link_step_actions_to_card() CASCADE;
DROP FUNCTION IF EXISTS nexflow.handle_card_step_change() CASCADE;
DROP FUNCTION IF EXISTS nexflow.update_opportunity_automations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS nexflow.update_contact_automations_updated_at() CASCADE;

