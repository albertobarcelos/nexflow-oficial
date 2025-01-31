-- Atualiza a tabela companies com novos campos
ALTER TABLE companies
  -- Campos existentes mantidos:
  -- id uuid DEFAULT uuid_generate_v4() PRIMARY KEY
  -- client_id uuid REFERENCES clients(id)
  -- name text NOT NULL
  -- cnpj text
  -- description text
  -- created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
  -- updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())

  -- Campos básicos
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES collaborators(id),
  ADD COLUMN IF NOT EXISTS setor text,

  -- Informações de contato
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS celular text,
  ADD COLUMN IF NOT EXISTS fax text,
  ADD COLUMN IF NOT EXISTS ramal text,
  ADD COLUMN IF NOT EXISTS website text,

  -- Endereço
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS rua text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,

  -- Redes sociais
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS skype text,

  -- Privacidade
  ADD COLUMN IF NOT EXISTS privacidade text DEFAULT 'todos' CHECK (privacidade IN ('todos', 'somente-eu'));

-- Cria índices para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_responsavel ON companies(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_companies_cidade ON companies(cidade);
CREATE INDEX IF NOT EXISTS idx_companies_estado ON companies(estado);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas colunas para documentação
COMMENT ON COLUMN companies.logo_url IS 'URL do logotipo da empresa';
COMMENT ON COLUMN companies.razao_social IS 'Razão social da empresa';
COMMENT ON COLUMN companies.categoria IS 'Categoria da empresa';
COMMENT ON COLUMN companies.origem IS 'Origem da empresa';
COMMENT ON COLUMN companies.responsavel_id IS 'ID do colaborador responsável pela empresa';
COMMENT ON COLUMN companies.setor IS 'Setor de atuação da empresa';
COMMENT ON COLUMN companies.email IS 'Email principal da empresa';
COMMENT ON COLUMN companies.whatsapp IS 'Número do WhatsApp da empresa';
COMMENT ON COLUMN companies.telefone IS 'Telefone fixo da empresa';
COMMENT ON COLUMN companies.celular IS 'Telefone celular da empresa';
COMMENT ON COLUMN companies.fax IS 'Número de fax da empresa';
COMMENT ON COLUMN companies.ramal IS 'Ramal da empresa';
COMMENT ON COLUMN companies.website IS 'Site da empresa';
COMMENT ON COLUMN companies.cep IS 'CEP do endereço';
COMMENT ON COLUMN companies.pais IS 'País do endereço';
COMMENT ON COLUMN companies.estado IS 'Estado do endereço';
COMMENT ON COLUMN companies.cidade IS 'Cidade do endereço';
COMMENT ON COLUMN companies.bairro IS 'Bairro do endereço';
COMMENT ON COLUMN companies.rua IS 'Rua do endereço';
COMMENT ON COLUMN companies.numero IS 'Número do endereço';
COMMENT ON COLUMN companies.complemento IS 'Complemento do endereço';
COMMENT ON COLUMN companies.facebook IS 'URL do perfil no Facebook';
COMMENT ON COLUMN companies.twitter IS 'URL do perfil no Twitter';
COMMENT ON COLUMN companies.linkedin IS 'URL do perfil no LinkedIn';
COMMENT ON COLUMN companies.instagram IS 'URL do perfil no Instagram';
COMMENT ON COLUMN companies.skype IS 'Username do Skype';
COMMENT ON COLUMN companies.privacidade IS 'Configuração de privacidade: todos ou somente-eu'; 