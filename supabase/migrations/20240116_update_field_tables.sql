-- Atualiza a tabela field_definitions
ALTER TABLE field_definitions
  ALTER COLUMN client_id SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN field_type SET NOT NULL,
  ALTER COLUMN target_type SET NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Atualiza o tipo da coluna field_type para ENUM
ALTER TABLE field_definitions 
  DROP CONSTRAINT IF EXISTS field_type_check,
  ADD CONSTRAINT field_type_check 
    CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'url'));

-- Atualiza o tipo da coluna target_type para ENUM
ALTER TABLE field_definitions 
  DROP CONSTRAINT IF EXISTS target_type_check,
  ADD CONSTRAINT target_type_check 
    CHECK (target_type IN ('company', 'person', 'partner'));

-- Atualiza a tabela field_values
ALTER TABLE field_values
  ALTER COLUMN client_id SET NOT NULL,
  ALTER COLUMN field_id SET NOT NULL,
  ALTER COLUMN target_id SET NOT NULL,
  ALTER COLUMN value SET NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adiciona a trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para field_definitions
DROP TRIGGER IF EXISTS update_field_definitions_updated_at ON field_definitions;
CREATE TRIGGER update_field_definitions_updated_at
    BEFORE UPDATE ON field_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para field_values
DROP TRIGGER IF EXISTS update_field_values_updated_at ON field_values;
CREATE TRIGGER update_field_values_updated_at
    BEFORE UPDATE ON field_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Atualiza as políticas de segurança (RLS)
ALTER TABLE field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_values ENABLE ROW LEVEL SECURITY;

-- Políticas para field_definitions
DROP POLICY IF EXISTS "Usuários podem ver definições de campos do seu client_id" ON field_definitions;
CREATE POLICY "Usuários podem ver definições de campos do seu client_id"
ON field_definitions FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuários podem inserir definições de campos no seu client_id" ON field_definitions;
CREATE POLICY "Usuários podem inserir definições de campos no seu client_id"
ON field_definitions FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar definições de campos do seu client_id" ON field_definitions;
CREATE POLICY "Usuários podem atualizar definições de campos do seu client_id"
ON field_definitions FOR UPDATE
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuários podem deletar definições de campos do seu client_id" ON field_definitions;
CREATE POLICY "Usuários podem deletar definições de campos do seu client_id"
ON field_definitions FOR DELETE
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Políticas para field_values
DROP POLICY IF EXISTS "Usuários podem ver valores de campos do seu client_id" ON field_values;
CREATE POLICY "Usuários podem ver valores de campos do seu client_id"
ON field_values FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuários podem inserir valores de campos no seu client_id" ON field_values;
CREATE POLICY "Usuários podem inserir valores de campos no seu client_id"
ON field_values FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar valores de campos do seu client_id" ON field_values;
CREATE POLICY "Usuários podem atualizar valores de campos do seu client_id"
ON field_values FOR UPDATE
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuários podem deletar valores de campos do seu client_id" ON field_values;
CREATE POLICY "Usuários podem deletar valores de campos do seu client_id"
ON field_values FOR DELETE
USING (
  client_id IN (
    SELECT client_id FROM collaborators 
    WHERE auth_user_id = auth.uid()
  )
); 