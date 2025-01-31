-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  razao_social VARCHAR(255),
  cnpj VARCHAR(14),
  description TEXT,
  categoria VARCHAR(100),
  origem VARCHAR(100),
  logo_url TEXT,
  
  -- Informações de Contato
  email VARCHAR(255),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  whatsapp VARCHAR(20),
  website VARCHAR(255),
  
  -- Endereço
  cep VARCHAR(8),
  pais VARCHAR(100) DEFAULT 'Brasil',
  estado VARCHAR(2),
  cidade VARCHAR(100),
  bairro VARCHAR(100),
  rua VARCHAR(255),
  numero VARCHAR(20),
  complemento TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Criar índices para melhor performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_cnpj ON companies(cnpj);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 