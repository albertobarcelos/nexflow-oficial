-- =====================================================
-- MIGRATION: Recriar Triggers do Nexflow no Schema Public
-- =====================================================
-- Recria todos os triggers que referenciam tabelas e funções
-- migradas para o schema public
-- =====================================================

-- =====================================================
-- 1. Triggers para user_notification_settings
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_user_notification_settings_updated_at ON public.user_notification_settings;
CREATE TRIGGER trigger_update_user_notification_settings_updated_at
    BEFORE UPDATE ON public.user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_notification_settings_updated_at();

-- =====================================================
-- 2. Triggers para card_messages
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_card_messages_updated_at ON public.card_messages;
CREATE TRIGGER trigger_update_card_messages_updated_at
    BEFORE UPDATE ON public.card_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_card_messages_updated_at();

DROP TRIGGER IF EXISTS trigger_notify_message_mention ON public.card_messages;
CREATE TRIGGER trigger_notify_message_mention
    AFTER INSERT ON public.card_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_message_mention();

-- =====================================================
-- 3. Triggers para cards
-- =====================================================

DROP TRIGGER IF EXISTS trigger_notify_card_assigned ON public.cards;
CREATE TRIGGER trigger_notify_card_assigned
    AFTER INSERT OR UPDATE OF assigned_to ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_card_assigned();

DROP TRIGGER IF EXISTS trigger_notify_new_card_in_stage ON public.cards;
CREATE TRIGGER trigger_notify_new_card_in_stage
    AFTER INSERT ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_card_in_stage();

DROP TRIGGER IF EXISTS trigger_auto_link_step_actions_on_card_create ON public.cards;
CREATE TRIGGER trigger_auto_link_step_actions_on_card_create
    AFTER INSERT ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_step_actions_to_card();

DROP TRIGGER IF EXISTS trigger_handle_card_step_change ON public.cards;
CREATE TRIGGER trigger_handle_card_step_change
    AFTER UPDATE OF step_id ON public.cards
    FOR EACH ROW
    WHEN (OLD.step_id IS DISTINCT FROM NEW.step_id)
    EXECUTE FUNCTION public.handle_card_step_change();

DROP TRIGGER IF EXISTS trigger_create_child_card_on_step_entry ON public.cards;
CREATE TRIGGER trigger_create_child_card_on_step_entry
    AFTER UPDATE OF step_id ON public.cards
    FOR EACH ROW
    WHEN (OLD.step_id IS DISTINCT FROM NEW.step_id)
    EXECUTE FUNCTION public.create_child_card_on_step_entry();

DROP TRIGGER IF EXISTS trigger_update_contact_related_cards ON public.cards;
CREATE TRIGGER trigger_update_contact_related_cards
    AFTER INSERT ON public.cards
    FOR EACH ROW
    WHEN (NEW.contact_id IS NOT NULL)
    EXECUTE FUNCTION public.update_contact_related_cards();

-- =====================================================
-- 4. Triggers para contacts
-- =====================================================

-- Trigger moddatetime para updated_at (já existe, apenas garantir)
DROP TRIGGER IF EXISTS handle_updated_at ON public.contacts;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime('updated_at');

DROP TRIGGER IF EXISTS trigger_auto_create_cards_from_contact ON public.contacts;
CREATE TRIGGER trigger_auto_create_cards_from_contact
    AFTER INSERT ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_cards_from_contact();

-- =====================================================
-- 5. Triggers para contact_automations
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_contact_automations_updated_at ON public.contact_automations;
CREATE TRIGGER trigger_update_contact_automations_updated_at
    BEFORE UPDATE ON public.contact_automations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_contact_automations_updated_at();

-- =====================================================
-- 6. Triggers para step_child_card_automations
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_step_child_card_automations_updated_at ON public.step_child_card_automations;
CREATE TRIGGER trigger_update_step_child_card_automations_updated_at
    BEFORE UPDATE ON public.step_child_card_automations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_step_child_card_automations_updated_at();

-- =====================================================
-- 7. Triggers para card_items (se existirem)
-- =====================================================
-- Nota: Estes triggers podem estar em outras migrations
-- Verificar se existem antes de recriar

-- Trigger para calcular total_price (se existir função calculate_card_item_total)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_card_item_total') THEN
        DROP TRIGGER IF EXISTS trigger_calculate_card_item_total ON public.card_items;
        CREATE TRIGGER trigger_calculate_card_item_total
            BEFORE INSERT OR UPDATE OF quantity, unit_price ON public.card_items
            FOR EACH ROW
            EXECUTE FUNCTION calculate_card_item_total();
    END IF;
END $$;

-- Trigger para updated_at (se existir função update_team_levels_updated_at)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_team_levels_updated_at') THEN
        DROP TRIGGER IF EXISTS trigger_update_card_items_updated_at ON public.card_items;
        CREATE TRIGGER trigger_update_card_items_updated_at
            BEFORE UPDATE ON public.card_items
            FOR EACH ROW
            EXECUTE FUNCTION update_team_levels_updated_at();
    END IF;
END $$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON SCHEMA public IS 'Schema principal contendo todas as tabelas, funções e triggers do sistema';


