-- Adicionar coluna responsavel_id na tabela people
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES collaborators(auth_user_id);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_people_responsavel_id ON people(responsavel_id);

-- Adicionar comentário para documentação
COMMENT ON COLUMN people.responsavel_id IS 'ID do colaborador responsável pela pessoa';

-- Atualizar política de segurança para incluir responsável
CREATE POLICY "Pessoas visíveis para responsáveis"
  ON people
  FOR ALL
  USING (
    auth.uid() = responsavel_id
  ); 