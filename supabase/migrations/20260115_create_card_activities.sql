-- =====================================================
-- SISTEMA DE ATIVIDADES DOS CARDS
-- =====================================================
-- Tabela para gerenciar atividades agendadas dentro de cards
-- com data/hora, responsável e status de conclusão
-- =====================================================

-- Tabela de atividades dos cards
CREATE TABLE IF NOT EXISTS public.card_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    activity_type_id UUID NOT NULL REFERENCES public.flow_activity_types(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    assignee_id UUID REFERENCES public.core_client_users(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES public.core_client_users(id) ON DELETE SET NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_id UUID NOT NULL,
    CONSTRAINT card_activities_title_not_empty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT card_activities_end_after_start CHECK (end_at > start_at)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_card_activities_card_id ON public.card_activities(card_id);
CREATE INDEX IF NOT EXISTS idx_card_activities_activity_type_id ON public.card_activities(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_card_activities_assignee_id ON public.card_activities(assignee_id);
CREATE INDEX IF NOT EXISTS idx_card_activities_creator_id ON public.card_activities(creator_id);
CREATE INDEX IF NOT EXISTS idx_card_activities_start_at ON public.card_activities(start_at);
CREATE INDEX IF NOT EXISTS idx_card_activities_completed ON public.card_activities(completed) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_card_activities_client_id ON public.card_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_card_activities_card_completed ON public.card_activities(card_id, completed);

-- Comentários
COMMENT ON TABLE public.card_activities IS 'Atividades agendadas dentro de cards';
COMMENT ON COLUMN public.card_activities.title IS 'Título da atividade';
COMMENT ON COLUMN public.card_activities.description IS 'Descrição detalhada da atividade (suporta rich text)';
COMMENT ON COLUMN public.card_activities.start_at IS 'Data e hora de início da atividade';
COMMENT ON COLUMN public.card_activities.end_at IS 'Data e hora de término da atividade';
COMMENT ON COLUMN public.card_activities.assignee_id IS 'Usuário responsável pela atividade (pode ser delegado)';
COMMENT ON COLUMN public.card_activities.creator_id IS 'Usuário que criou a atividade';
COMMENT ON COLUMN public.card_activities.completed IS 'Se a atividade foi concluída';
COMMENT ON COLUMN public.card_activities.completed_at IS 'Data e hora de conclusão da atividade';

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_card_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_card_activities_updated_at
    BEFORE UPDATE ON public.card_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_card_activities_updated_at();

-- Função para atualizar completed_at quando completed muda para true
CREATE OR REPLACE FUNCTION public.update_card_activity_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
        NEW.completed_at = timezone('utc'::text, now());
    ELSIF NEW.completed = false THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar completed_at
CREATE TRIGGER trigger_update_card_activity_completed_at
    BEFORE UPDATE ON public.card_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_card_activity_completed_at();

-- Desabilitar RLS para desenvolvimento (seguindo padrão do projeto)
ALTER TABLE public.card_activities DISABLE ROW LEVEL SECURITY;

-- Políticas RLS (preparadas para quando RLS for reativado)
-- Usuários podem ver atividades de cards que têm acesso
CREATE POLICY "Users can view activities of accessible cards"
    ON public.card_activities
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND client_id IN (
            SELECT client_id FROM public.core_client_users WHERE id = auth.uid()
        )
    );

-- Usuários podem criar atividades em cards que têm acesso
CREATE POLICY "Users can create activities in accessible cards"
    ON public.card_activities
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND client_id IN (
            SELECT client_id FROM public.core_client_users WHERE id = auth.uid()
        )
        AND creator_id = auth.uid()
    );

-- Usuários podem atualizar atividades que criaram ou que são responsáveis
-- Admins podem atualizar qualquer atividade
CREATE POLICY "Users can update their own activities or assigned activities"
    ON public.card_activities
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND client_id IN (
            SELECT client_id FROM public.core_client_users WHERE id = auth.uid()
        )
        AND (
            creator_id = auth.uid()
            OR assignee_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.core_client_users
                WHERE id = auth.uid()
                AND role IN ('administrator', 'admin')
                AND client_id = card_activities.client_id
            )
        )
    );

-- Apenas criador ou admin pode deletar atividade
CREATE POLICY "Creators and administrators can delete activities"
    ON public.card_activities
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND (
            creator_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.core_client_users
                WHERE id = auth.uid()
                AND role IN ('administrator', 'admin')
                AND client_id = card_activities.client_id
            )
        )
    );
