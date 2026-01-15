-- =====================================================
-- TRIGGER: Salvar snapshot de valores ao mudar etapa
-- =====================================================
-- Quando um card muda de etapa (step_id), salva um snapshot
-- dos valores dos campos (field_values) na etapa anterior
-- =====================================================

-- Função para salvar snapshot dos valores quando card muda de etapa
CREATE OR REPLACE FUNCTION public.save_step_values_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- Só processar se step_id mudou
    IF OLD.step_id IS DISTINCT FROM NEW.step_id THEN
        -- Se OLD.step_id não for NULL (não é criação inicial)
        -- e field_values não estiver vazio, salvar snapshot
        IF OLD.step_id IS NOT NULL AND OLD.field_values IS NOT NULL THEN
            -- Usar UPSERT para atualizar se já existir snapshot daquela etapa
            INSERT INTO public.card_step_values (
                card_id,
                step_id,
                field_values,
                client_id,
                created_at,
                updated_at
            )
            VALUES (
                OLD.id,
                OLD.step_id,
                OLD.field_values,
                OLD.client_id,
                NOW(),
                NOW()
            )
            ON CONFLICT (card_id, step_id)
            DO UPDATE SET
                field_values = EXCLUDED.field_values,
                updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que dispara antes de atualizar o card
CREATE TRIGGER trigger_save_step_values_on_stage_change
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    WHEN (OLD.step_id IS DISTINCT FROM NEW.step_id)
    EXECUTE FUNCTION public.save_step_values_snapshot();

-- Comentários para documentação
COMMENT ON FUNCTION public.save_step_values_snapshot() IS 'Salva snapshot dos valores dos campos quando card muda de etapa';
COMMENT ON TRIGGER trigger_save_step_values_on_stage_change ON public.cards IS 'Dispara antes de atualizar step_id para salvar snapshot da etapa anterior';

-- =====================================================
-- TRIGGER: Salvar snapshot de valores ao atualizar campos
-- =====================================================
-- Quando um card tem seus valores atualizados na mesma etapa,
-- salva/atualiza o snapshot dos valores da etapa atual
-- =====================================================

-- Função para salvar snapshot quando field_values é atualizado na mesma etapa
CREATE OR REPLACE FUNCTION public.save_step_values_on_field_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se step_id não mudou mas field_values mudou
    IF OLD.step_id = NEW.step_id 
       AND OLD.field_values IS DISTINCT FROM NEW.field_values
       AND NEW.step_id IS NOT NULL 
       AND NEW.field_values IS NOT NULL THEN
        -- Salvar/atualizar snapshot da etapa atual
        INSERT INTO public.card_step_values (
            card_id,
            step_id,
            field_values,
            client_id,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.step_id,
            NEW.field_values,
            NEW.client_id,
            NOW(),
            NOW()
        )
        ON CONFLICT (card_id, step_id)
        DO UPDATE SET
            field_values = EXCLUDED.field_values,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que dispara antes de atualizar o card quando apenas field_values muda
CREATE TRIGGER trigger_save_step_values_on_field_update
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    WHEN (OLD.step_id = NEW.step_id AND OLD.field_values IS DISTINCT FROM NEW.field_values)
    EXECUTE FUNCTION public.save_step_values_on_field_update();

-- Comentários para documentação
COMMENT ON FUNCTION public.save_step_values_on_field_update() IS 'Salva snapshot dos valores dos campos quando field_values é atualizado na mesma etapa';
COMMENT ON TRIGGER trigger_save_step_values_on_field_update ON public.cards IS 'Dispara antes de atualizar field_values para salvar/atualizar snapshot da etapa atual';
