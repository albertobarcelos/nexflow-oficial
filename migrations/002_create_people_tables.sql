-- Dropar tabelas existentes
DROP TABLE IF EXISTS company_people CASCADE;
DROP TABLE IF EXISTS people CASCADE;

-- Criar tabela de pessoas
CREATE TABLE IF NOT EXISTS people (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id uuid REFERENCES clients(id) NOT NULL,
    name text NOT NULL,
    email text,
    whatsapp text,
    telefone text,
    celular text,
    cargo text,
    cpf text,
    categoria text,
    description text,
    aniversario text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),

    -- Endereço
    cep text,
    pais text DEFAULT 'Brasil',
    estado text,
    cidade text,
    bairro text,
    rua text,
    numero text,
    complemento text
);

-- Criar tabela de relacionamento entre empresas e pessoas
CREATE TABLE IF NOT EXISTS company_people (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    person_id uuid REFERENCES people(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, person_id)
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_client ON people(client_id);
CREATE INDEX IF NOT EXISTS idx_people_cpf ON people(cpf);
CREATE INDEX IF NOT EXISTS idx_company_people_company ON company_people(company_id);
CREATE INDEX IF NOT EXISTS idx_company_people_person ON company_people(person_id);

-- Trigger para atualizar updated_at em people
CREATE OR REPLACE FUNCTION update_people_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_people_updated_at ON people;

CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON people
    FOR EACH ROW
    EXECUTE FUNCTION update_people_updated_at_column();

-- Adicionar comentários para documentação
COMMENT ON TABLE people IS 'Tabela de pessoas/contatos';
COMMENT ON TABLE company_people IS 'Relacionamento entre empresas e pessoas';

COMMENT ON COLUMN people.id IS 'Identificador único da pessoa';
COMMENT ON COLUMN people.client_id IS 'ID do cliente ao qual a pessoa pertence';
COMMENT ON COLUMN people.name IS 'Nome da pessoa';
COMMENT ON COLUMN people.email IS 'Email da pessoa';
COMMENT ON COLUMN people.whatsapp IS 'Número do WhatsApp da pessoa';
COMMENT ON COLUMN people.telefone IS 'Telefone fixo da pessoa';
COMMENT ON COLUMN people.celular IS 'Telefone celular da pessoa';
COMMENT ON COLUMN people.cargo IS 'Cargo/função da pessoa';
COMMENT ON COLUMN people.cpf IS 'CPF da pessoa';
COMMENT ON COLUMN people.categoria IS 'Categoria da pessoa';
COMMENT ON COLUMN people.description IS 'Descrição ou observações sobre a pessoa';
COMMENT ON COLUMN people.aniversario IS 'Data de aniversário da pessoa';
COMMENT ON COLUMN people.cep IS 'CEP do endereço';
COMMENT ON COLUMN people.pais IS 'País do endereço';
COMMENT ON COLUMN people.estado IS 'Estado do endereço';
COMMENT ON COLUMN people.cidade IS 'Cidade do endereço';
COMMENT ON COLUMN people.bairro IS 'Bairro do endereço';
COMMENT ON COLUMN people.rua IS 'Rua do endereço';
COMMENT ON COLUMN people.numero IS 'Número do endereço';
COMMENT ON COLUMN people.complemento IS 'Complemento do endereço';

COMMENT ON COLUMN company_people.company_id IS 'ID da empresa';
COMMENT ON COLUMN company_people.person_id IS 'ID da pessoa';

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_people ENABLE ROW LEVEL SECURITY;

-- Política para pessoas: usuários só podem ver pessoas do seu próprio client_id
CREATE POLICY people_policy ON people
    USING (
        client_id IN (
            SELECT client_id 
            FROM collaborators 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para company_people: usuários só podem ver relacionamentos de empresas do seu client_id
CREATE POLICY company_people_policy ON company_people
    USING (
        company_id IN (
            SELECT c.id 
            FROM companies c
            JOIN collaborators col ON c.client_id = col.client_id
            WHERE col.auth_user_id = auth.uid()
        )
    ); 