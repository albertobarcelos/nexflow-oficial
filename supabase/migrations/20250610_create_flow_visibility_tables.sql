-- Migration: Create flow visibility tables
-- Description: Tables for managing flow visibility by team and user exclusions

-- Tabela para acesso por time
CREATE TABLE IF NOT EXISTS nexflow.flow_team_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID NOT NULL REFERENCES nexflow.flows(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.core_teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(flow_id, team_id)
);

-- Tabela para exclusões de usuários
CREATE TABLE IF NOT EXISTS nexflow.flow_user_exclusions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID NOT NULL REFERENCES nexflow.flows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.core_client_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(flow_id, user_id)
);

-- Adicionar coluna visibility_type na tabela flows se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nexflow' 
        AND table_name = 'flows' 
        AND column_name = 'visibility_type'
    ) THEN
        ALTER TABLE nexflow.flows 
        ADD COLUMN visibility_type TEXT NOT NULL DEFAULT 'company';
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_flow_team_access_flow_id ON nexflow.flow_team_access(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_team_access_team_id ON nexflow.flow_team_access(team_id);
CREATE INDEX IF NOT EXISTS idx_flow_user_exclusions_flow_id ON nexflow.flow_user_exclusions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_user_exclusions_user_id ON nexflow.flow_user_exclusions(user_id);

-- Comentários
COMMENT ON TABLE nexflow.flow_team_access IS 'Times que têm acesso a um flow específico';
COMMENT ON TABLE nexflow.flow_user_exclusions IS 'Usuários explicitamente excluídos de um flow';
COMMENT ON COLUMN nexflow.flows.visibility_type IS 'Tipo de visibilidade: company (todos da empresa), team (por time), user (time com exclusões)';



