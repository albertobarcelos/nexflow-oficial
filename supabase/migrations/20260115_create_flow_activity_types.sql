-- =====================================================
-- SISTEMA DE TIPOS DE ATIVIDADE POR FLOW
-- =====================================================
-- Tabela para gerenciar tipos de atividade personalizados
-- por flow (ex: "Visita", "Ticket", "Reunião")
-- =====================================================

-- Tabela de tipos de atividade por flow
CREATE TABLE IF NOT EXISTS public.flow_activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT, -- Cor para UI (ex: "#3B82F6")
    icon TEXT, -- Nome do ícone do lucide-react (ex: "Calendar", "Phone")
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_id UUID NOT NULL,
    CONSTRAINT flow_activity_types_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_flow_activity_types_flow_id ON public.flow_activity_types(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_activity_types_client_id ON public.flow_activity_types(client_id);
CREATE INDEX IF NOT EXISTS idx_flow_activity_types_active ON public.flow_activity_types(active) WHERE active = true;

-- Comentários
COMMENT ON TABLE public.flow_activity_types IS 'Tipos de atividade personalizados por flow';
COMMENT ON COLUMN public.flow_activity_types.name IS 'Nome do tipo de atividade (ex: "Visita", "Ticket", "Reunião")';
COMMENT ON COLUMN public.flow_activity_types.color IS 'Cor hexadecimal para exibição na UI';
COMMENT ON COLUMN public.flow_activity_types.icon IS 'Nome do ícone do lucide-react para exibição';
COMMENT ON COLUMN public.flow_activity_types.active IS 'Se o tipo está ativo e disponível para uso';

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_flow_activity_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_flow_activity_types_updated_at
    BEFORE UPDATE ON public.flow_activity_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_flow_activity_types_updated_at();

-- Desabilitar RLS para desenvolvimento (seguindo padrão do projeto)
ALTER TABLE public.flow_activity_types DISABLE ROW LEVEL SECURITY;

-- Políticas RLS (preparadas para quando RLS for reativado)
-- Usuários podem ver tipos de atividade dos flows que têm acesso
CREATE POLICY "Users can view activity types of accessible flows"
    ON public.flow_activity_types
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND client_id IN (
            SELECT client_id FROM public.core_client_users WHERE id = auth.uid()
        )
    );

-- Usuários podem criar tipos de atividade em flows que têm acesso
CREATE POLICY "Users can create activity types in accessible flows"
    ON public.flow_activity_types
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND client_id IN (
            SELECT client_id FROM public.core_client_users WHERE id = auth.uid()
        )
    );

-- Usuários podem atualizar tipos de atividade em flows que têm acesso
CREATE POLICY "Users can update activity types in accessible flows"
    ON public.flow_activity_types
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND client_id IN (
            SELECT client_id FROM public.core_client_users WHERE id = auth.uid()
        )
    );

-- Apenas admins podem deletar tipos de atividade
CREATE POLICY "Administrators can delete activity types"
    ON public.flow_activity_types
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.core_client_users
            WHERE id = auth.uid()
            AND role = 'administrator'
            AND client_id = flow_activity_types.client_id
        )
    );
