-- =====================================================
-- MIGRAÇÃO: Reestruturação para Arquitetura CORE + WEB
-- =====================================================
-- 
-- CORE: Sistema base (tenants, usuários, licenças)
-- WEB: Módulo CRM (empresas, contatos, oportunidades, etc.)
--
-- Autor: Sistema Backstage
-- Data: 2024-12-21
-- =====================================================

-- Desabilitar RLS temporariamente para reestruturação
SET session_replication_role = replica;

-- =====================================================
-- SEÇÃO 1: TABELAS CORE (Sistema Base)
-- =====================================================

-- 1.1 CORE_CLIENTS (Tenants/Clientes)
-- Renomear tabela existente 'clients' para 'core_clients'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
        ALTER TABLE clients RENAME TO core_clients;
    END IF;
END $$;

-- Ajustar estrutura da tabela core_clients
ALTER TABLE core_clients 
  ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subdomain VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ALTER COLUMN company_name SET NOT NULL;

-- Criar índices para core_clients
CREATE INDEX IF NOT EXISTS idx_core_clients_subdomain ON core_clients(subdomain);
CREATE INDEX IF NOT EXISTS idx_core_clients_is_active ON core_clients(is_active);

-- 1.2 CORE_LICENSES (Planos Disponíveis)
CREATE TABLE IF NOT EXISTS core_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  max_users INTEGER DEFAULT 1,
  max_companies INTEGER DEFAULT 100,
  max_contacts INTEGER DEFAULT 1000,
  max_opportunities INTEGER DEFAULT 500,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 CORE_CLIENT_USERS (Usuários do Tenant)
-- Renomear tabela existente 'collaborators' para 'core_client_users'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaborators' AND table_schema = 'public') THEN
        ALTER TABLE collaborators RENAME TO core_client_users;
    END IF;
END $$;

-- Ajustar estrutura da tabela core_client_users
ALTER TABLE core_client_users 
  RENAME COLUMN client_id TO core_client_id,
  ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMP WITH TIME ZONE;

-- 1.4 CORE_CLIENT_LICENSE (Licença do Cliente)
-- Renomear tabela existente 'licenses' para 'core_client_license'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'licenses' AND table_schema = 'public') THEN
        ALTER TABLE licenses RENAME TO core_client_license;
    END IF;
END $$;

-- Ajustar estrutura da tabela core_client_license
ALTER TABLE core_client_license 
  RENAME COLUMN client_id TO core_client_id,
  ADD COLUMN IF NOT EXISTS core_license_id UUID REFERENCES core_licenses(id),
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- =====================================================
-- SEÇÃO 2: TABELAS WEB (Módulo CRM)
-- =====================================================

-- 2.1 WEB_CITIES (Cidades)
CREATE TABLE IF NOT EXISTS web_cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  core_client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  country VARCHAR(3) DEFAULT 'BRA',
  ibge_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 WEB_COMPANIES (Empresas)
-- Renomear tabela existente 'companies' para 'web_companies'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
        ALTER TABLE companies RENAME TO web_companies;
    END IF;
END $$;

-- Ajustar estrutura da tabela web_companies
ALTER TABLE web_companies 
  RENAME COLUMN client_id TO core_client_id,
  ADD COLUMN IF NOT EXISTS web_city_id UUID REFERENCES web_cities(id),
  ADD COLUMN IF NOT EXISTS company_size VARCHAR(20),
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}';

-- 2.3 WEB_CONTACTS (Contatos/Pessoas)
CREATE TABLE IF NOT EXISTS web_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  core_client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
  web_company_id UUID REFERENCES web_companies(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  whatsapp VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  notes TEXT,
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 WEB_OPPORTUNITIES (Oportunidades)
-- Renomear tabela existente 'opportunities' para 'web_opportunities'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities' AND table_schema = 'public') THEN
        ALTER TABLE opportunities RENAME TO web_opportunities;
    END IF;
END $$;

-- Ajustar estrutura da tabela web_opportunities
ALTER TABLE web_opportunities 
  RENAME COLUMN client_id TO core_client_id,
  ADD COLUMN IF NOT EXISTS web_company_id UUID REFERENCES web_companies(id),
  ADD COLUMN IF NOT EXISTS web_contact_id UUID REFERENCES web_contacts(id),
  ADD COLUMN IF NOT EXISTS source VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- 2.5 WEB_TASKS (Tarefas)
-- Renomear tabela existente 'tasks' para 'web_tasks'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
        ALTER TABLE tasks RENAME TO web_tasks;
    END IF;
END $$;

-- Ajustar estrutura da tabela web_tasks
ALTER TABLE web_tasks 
  RENAME COLUMN client_id TO core_client_id,
  RENAME COLUMN opportunity_id TO web_opportunity_id,
  ADD COLUMN IF NOT EXISTS web_company_id UUID REFERENCES web_companies(id),
  ADD COLUMN IF NOT EXISTS web_contact_id UUID REFERENCES web_contacts(id);

-- =====================================================
-- SEÇÃO 3: ÍNDICES E CONSTRAINTS
-- =====================================================

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_web_cities_core_client_id ON web_cities(core_client_id);
CREATE INDEX IF NOT EXISTS idx_web_companies_core_client_id ON web_companies(core_client_id);
CREATE INDEX IF NOT EXISTS idx_web_contacts_core_client_id ON web_contacts(core_client_id);
CREATE INDEX IF NOT EXISTS idx_web_contacts_web_company_id ON web_contacts(web_company_id);
CREATE INDEX IF NOT EXISTS idx_web_opportunities_core_client_id ON web_opportunities(core_client_id);
CREATE INDEX IF NOT EXISTS idx_web_tasks_core_client_id ON web_tasks(core_client_id);

-- =====================================================
-- SEÇÃO 4: TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_core_clients_updated_at BEFORE UPDATE ON core_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_core_licenses_updated_at BEFORE UPDATE ON core_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_core_client_users_updated_at BEFORE UPDATE ON core_client_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_core_client_license_updated_at BEFORE UPDATE ON core_client_license FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_cities_updated_at BEFORE UPDATE ON web_cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_companies_updated_at BEFORE UPDATE ON web_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_contacts_updated_at BEFORE UPDATE ON web_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_opportunities_updated_at BEFORE UPDATE ON web_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_tasks_updated_at BEFORE UPDATE ON web_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEÇÃO 5: DADOS INICIAIS
-- =====================================================

-- Inserir licenças padrão
INSERT INTO core_licenses (name, description, price_monthly, price_yearly, max_users, max_companies, max_contacts, max_opportunities, features) 
VALUES 
  ('Starter', 'Plano básico para pequenas empresas', 29.90, 299.00, 3, 100, 500, 200, '{"crm": true, "reports": false, "api": false}'),
  ('Professional', 'Plano profissional para empresas em crescimento', 79.90, 799.00, 10, 500, 2000, 1000, '{"crm": true, "reports": true, "api": true, "automations": true}'),
  ('Enterprise', 'Plano empresarial com recursos avançados', 199.90, 1999.00, -1, -1, -1, -1, '{"crm": true, "reports": true, "api": true, "automations": true, "custom_fields": true, "integrations": true}')
ON CONFLICT DO NOTHING;

-- Reabilitar RLS
SET session_replication_role = DEFAULT;

-- =====================================================
-- SEÇÃO 6: POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE core_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_client_license ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas para core_client_users
CREATE POLICY "Usuários podem ver dados do seu tenant" ON core_client_users
  FOR SELECT USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

-- Políticas para web_companies
CREATE POLICY "Usuários podem ver empresas do seu tenant" ON web_companies
  FOR SELECT USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem gerenciar empresas do seu tenant" ON web_companies
  FOR ALL USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

-- Políticas para web_contacts
CREATE POLICY "Usuários podem ver contatos do seu tenant" ON web_contacts
  FOR SELECT USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem gerenciar contatos do seu tenant" ON web_contacts
  FOR ALL USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

-- Políticas para web_opportunities
CREATE POLICY "Usuários podem ver oportunidades do seu tenant" ON web_opportunities
  FOR SELECT USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem gerenciar oportunidades do seu tenant" ON web_opportunities
  FOR ALL USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

-- Políticas para web_tasks
CREATE POLICY "Usuários podem ver tarefas do seu tenant" ON web_tasks
  FOR SELECT USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem gerenciar tarefas do seu tenant" ON web_tasks
  FOR ALL USING (core_client_id IN (
    SELECT core_client_id FROM core_client_users WHERE auth_user_id = auth.uid()
  ));

-- =====================================================
-- FIM DA MIGRAÇÃO
-- ===================================================== 