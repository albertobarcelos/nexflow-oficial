-- Migration: Add RLS policies for step visibility tables
-- Description: Cria políticas RLS para step_team_access e step_user_exclusions
-- IMPORTANTE: RLS permanece DESABILITADO para permitir acesso via Edge Functions com service role key

-- Políticas para step_team_access
-- Remover políticas existentes se houver (para evitar duplicatas)
DROP POLICY IF EXISTS "Permitir leitura step_team_access para usuários autenticados" ON nexflow.step_team_access;
DROP POLICY IF EXISTS "Permitir inserção step_team_access para usuários autenticados" ON nexflow.step_team_access;
DROP POLICY IF EXISTS "Permitir atualização step_team_access para usuários autenticados" ON nexflow.step_team_access;
DROP POLICY IF EXISTS "Permitir exclusão step_team_access para usuários autenticados" ON nexflow.step_team_access;

-- SELECT: Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura step_team_access para usuários autenticados"
ON nexflow.step_team_access
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção step_team_access para usuários autenticados"
ON nexflow.step_team_access
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização step_team_access para usuários autenticados"
ON nexflow.step_team_access
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão step_team_access para usuários autenticados"
ON nexflow.step_team_access
FOR DELETE
TO authenticated
USING (true);

-- Políticas para step_user_exclusions
-- Remover políticas existentes se houver (para evitar duplicatas)
DROP POLICY IF EXISTS "Usuário vê suas próprias exclusões de step" ON nexflow.step_user_exclusions;
DROP POLICY IF EXISTS "Permitir inserção step_user_exclusions para usuários autenticados" ON nexflow.step_user_exclusions;
DROP POLICY IF EXISTS "Permitir atualização step_user_exclusions para usuários autenticados" ON nexflow.step_user_exclusions;
DROP POLICY IF EXISTS "Permitir exclusão step_user_exclusions para usuários autenticados" ON nexflow.step_user_exclusions;

-- SELECT: Usuário vê suas próprias exclusões
CREATE POLICY "Usuário vê suas próprias exclusões de step"
ON nexflow.step_user_exclusions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção step_user_exclusions para usuários autenticados"
ON nexflow.step_user_exclusions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização step_user_exclusions para usuários autenticados"
ON nexflow.step_user_exclusions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão step_user_exclusions para usuários autenticados"
ON nexflow.step_user_exclusions
FOR DELETE
TO authenticated
USING (true);

-- Garantir que RLS está DESABILITADO nas tabelas
-- Isso permite que Edge Functions com service role key acessem as tabelas sem problemas
ALTER TABLE nexflow.step_team_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE nexflow.step_user_exclusions DISABLE ROW LEVEL SECURITY;

-- Conceder permissões para service_role (necessário para Edge Functions)
-- Mesmo padrão usado nas tabelas flow_team_access e flow_user_exclusions
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.step_team_access TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON nexflow.step_user_exclusions TO service_role;

