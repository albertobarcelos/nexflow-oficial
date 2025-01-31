-- Remover políticas existentes
DROP POLICY IF EXISTS "Colaboradores podem ver deals do seu cliente" ON deals;
DROP POLICY IF EXISTS "Colaboradores podem gerenciar deals do seu cliente" ON deals;

-- Criar novas políticas
CREATE POLICY "Colaboradores podem ver deals do seu cliente"
ON deals FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.auth_user_id = auth.uid()
        AND collaborators.client_id = deals.client_id
    )
);

CREATE POLICY "Colaboradores podem inserir deals para seu cliente"
ON deals FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.auth_user_id = auth.uid()
        AND collaborators.client_id = deals.client_id
    )
);

CREATE POLICY "Colaboradores podem atualizar deals do seu cliente"
ON deals FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.auth_user_id = auth.uid()
        AND collaborators.client_id = deals.client_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.auth_user_id = auth.uid()
        AND collaborators.client_id = deals.client_id
    )
);

CREATE POLICY "Colaboradores podem deletar deals do seu cliente"
ON deals FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.auth_user_id = auth.uid()
        AND collaborators.client_id = deals.client_id
    )
); 