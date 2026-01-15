-- =====================================================
-- TABELA: card_step_values
-- =====================================================
-- Armazena snapshots dos valores dos campos quando
-- um card sai de uma etapa, permitindo visualizar
-- histórico de campos preenchidos em etapas anteriores
-- =====================================================

CREATE TABLE IF NOT EXISTS public.card_step_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.steps(id) ON DELETE CASCADE,
    field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_id UUID NOT NULL REFERENCES public.core_clients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Garantir que não haja duplicatas para a mesma combinação card_id + step_id
    UNIQUE(card_id, step_id)
);

-- Índices para otimizar queries
CREATE INDEX IF NOT EXISTS idx_card_step_values_card_id ON public.card_step_values(card_id);
CREATE INDEX IF NOT EXISTS idx_card_step_values_step_id ON public.card_step_values(step_id);
CREATE INDEX IF NOT EXISTS idx_card_step_values_client_id ON public.card_step_values(client_id);
CREATE INDEX IF NOT EXISTS idx_card_step_values_card_step ON public.card_step_values(card_id, step_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_card_step_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_card_step_values_updated_at
    BEFORE UPDATE ON public.card_step_values
    FOR EACH ROW
    EXECUTE FUNCTION public.update_card_step_values_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.card_step_values IS 'Snapshots dos valores dos campos quando um card sai de uma etapa';
COMMENT ON COLUMN public.card_step_values.card_id IS 'ID do card';
COMMENT ON COLUMN public.card_step_values.step_id IS 'ID da etapa onde os valores foram preenchidos';
COMMENT ON COLUMN public.card_step_values.field_values IS 'Snapshot dos valores dos campos (JSONB)';
COMMENT ON COLUMN public.card_step_values.client_id IS 'ID do cliente (multi-tenant)';

-- RLS Policies
ALTER TABLE public.card_step_values ENABLE ROW LEVEL SECURITY;

-- Policy: Membros do time podem ler valores de cards do mesmo client_id
CREATE POLICY "card_step_values_select_policy"
    ON public.card_step_values
    FOR SELECT
    USING (
        client_id IN (
            SELECT client_id 
            FROM public.core_client_users 
            WHERE id = auth.uid()
        )
    );

-- Policy: INSERT/UPDATE apenas via trigger (service role)
-- Não criamos policy para INSERT/UPDATE pois será feito via trigger com service role
