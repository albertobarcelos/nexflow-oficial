-- =====================================================
-- MIGRAÇÃO: Sistema de Entidades Dinâmicas
-- Data: 2024-12-01
-- Descrição: Cria estrutura para bases personalizáveis
--            similar ao Pipefy, permitindo criar entidades
--            customizadas com campos e relacionamentos
-- =====================================================

-- 1. ENTIDADES DINÂMICAS (Bases Customizáveis)
CREATE TABLE IF NOT EXISTS web_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    icon VARCHAR(50) DEFAULT 'database',
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_entity_slug_per_client UNIQUE(client_id, slug),
    CONSTRAINT valid_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- 2. CAMPOS PERSONALIZADOS POR ENTIDADE
CREATE TABLE IF NOT EXISTS web_entity_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES web_entities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    is_unique BOOLEAN DEFAULT false,
    options JSONB DEFAULT '[]',
    validation_rules JSONB DEFAULT '{}',
    default_value JSONB,
    order_index INTEGER NOT NULL DEFAULT 0,
    layout_config JSONB DEFAULT '{"width": "full", "column": 1}',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_field_slug_per_entity UNIQUE(entity_id, slug),
    CONSTRAINT valid_field_type CHECK (field_type IN (
        'short_text', 'long_text', 'email', 'phone', 'url',
        'number', 'currency', 'percentage',
        'date', 'datetime', 'time',
        'single_select', 'multi_select', 'checkbox',
        'file', 'image', 'document',
        'entity_reference', 'user_reference',
        'address', 'coordinates'
    ))
);

-- 3. REGISTROS DINÂMICOS DAS ENTIDADES
CREATE TABLE IF NOT EXISTS web_entity_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES web_entities(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    tags JSONB DEFAULT '[]',
    created_by UUID REFERENCES core_client_users(id),
    updated_by UUID REFERENCES core_client_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- 4. RELACIONAMENTOS ENTRE ENTIDADES
CREATE TABLE IF NOT EXISTS web_entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES web_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES web_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    reverse_name VARCHAR(100),
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    cascade_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_relationship_type CHECK (relationship_type IN (
        'one_to_one', 'one_to_many', 'many_to_many'
    )),
    CONSTRAINT no_self_reference CHECK (source_entity_id != target_entity_id)
);

-- 5. VÍNCULOS ENTRE REGISTROS (Para Relacionamentos)
CREATE TABLE IF NOT EXISTS web_entity_record_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES web_entity_relationships(id) ON DELETE CASCADE,
    source_record_id UUID NOT NULL REFERENCES web_entity_records(id) ON DELETE CASCADE,
    target_record_id UUID NOT NULL REFERENCES web_entity_records(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_record_link UNIQUE(relationship_id, source_record_id, target_record_id)
);

-- 6. ATUALIZAR FUNIS PARA SUPORTAR ENTIDADES DINÂMICAS
ALTER TABLE web_funnels 
ADD COLUMN IF NOT EXISTS primary_entity_id UUID REFERENCES web_entities(id),
ADD COLUMN IF NOT EXISTS entity_config JSONB DEFAULT '{"allowed_entities": [], "required_fields": []}';

-- 7. CAMPOS PERSONALIZADOS EM OPORTUNIDADES
CREATE TABLE IF NOT EXISTS web_deal_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES web_deals(id) ON DELETE CASCADE,
    field_slug VARCHAR(50) NOT NULL,
    field_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_deal_field UNIQUE(deal_id, field_slug)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Entidades
CREATE INDEX idx_web_entities_client_id ON web_entities(client_id);
CREATE INDEX idx_web_entities_slug ON web_entities(client_id, slug);
CREATE INDEX idx_web_entities_active ON web_entities(client_id, is_active);

-- Campos de entidades
CREATE INDEX idx_web_entity_fields_entity_id ON web_entity_fields(entity_id);
CREATE INDEX idx_web_entity_fields_order ON web_entity_fields(entity_id, order_index);
CREATE INDEX idx_web_entity_fields_active ON web_entity_fields(entity_id, is_active);

-- Registros de entidades
CREATE INDEX idx_web_entity_records_entity_id ON web_entity_records(entity_id);
CREATE INDEX idx_web_entity_records_client_id ON web_entity_records(client_id);
CREATE INDEX idx_web_entity_records_title ON web_entity_records(entity_id, title);
CREATE INDEX idx_web_entity_records_status ON web_entity_records(entity_id, status);
CREATE INDEX idx_web_entity_records_created_at ON web_entity_records(entity_id, created_at);

-- Relacionamentos
CREATE INDEX idx_web_entity_relationships_source ON web_entity_relationships(source_entity_id);
CREATE INDEX idx_web_entity_relationships_target ON web_entity_relationships(target_entity_id);
CREATE INDEX idx_web_entity_relationships_client ON web_entity_relationships(client_id);

-- Vínculos entre registros
CREATE INDEX idx_web_entity_record_links_source ON web_entity_record_links(source_record_id);
CREATE INDEX idx_web_entity_record_links_target ON web_entity_record_links(target_record_id);
CREATE INDEX idx_web_entity_record_links_relationship ON web_entity_record_links(relationship_id);

-- Campos personalizados de deals
CREATE INDEX idx_web_deal_custom_fields_deal_id ON web_deal_custom_fields(deal_id);
CREATE INDEX idx_web_deal_custom_fields_slug ON web_deal_custom_fields(deal_id, field_slug);

-- Funis com entidades
CREATE INDEX idx_web_funnels_primary_entity ON web_funnels(primary_entity_id);

-- =====================================================
-- INSERIR ENTIDADES PADRÃO DO SISTEMA
-- =====================================================

-- Função para inserir entidades padrão para cada cliente
CREATE OR REPLACE FUNCTION create_default_entities_for_client(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Inserir entidades padrão
    INSERT INTO web_entities (client_id, name, slug, icon, description, is_system, color) VALUES
    (p_client_id, 'Empresas', 'companies', 'building2', 'Empresas e organizações', true, '#3b82f6'),
    (p_client_id, 'Pessoas', 'people', 'users', 'Contatos e pessoas físicas', true, '#10b981'),
    (p_client_id, 'Parceiros', 'partners', 'handshake', 'Parceiros de negócio', true, '#f59e0b')
    ON CONFLICT (client_id, slug) DO NOTHING;
    
    -- Buscar IDs das entidades criadas
    DECLARE
        company_entity_id UUID;
        people_entity_id UUID;
        partner_entity_id UUID;
    BEGIN
        SELECT id INTO company_entity_id FROM web_entities WHERE client_id = p_client_id AND slug = 'companies';
        SELECT id INTO people_entity_id FROM web_entities WHERE client_id = p_client_id AND slug = 'people';
        SELECT id INTO partner_entity_id FROM web_entities WHERE client_id = p_client_id AND slug = 'partners';
        
        -- Campos padrão para Empresas
        INSERT INTO web_entity_fields (entity_id, name, slug, field_type, is_required, order_index, is_system) VALUES
        (company_entity_id, 'Nome', 'name', 'short_text', true, 0, true),
        (company_entity_id, 'CNPJ', 'cnpj', 'short_text', false, 1, true),
        (company_entity_id, 'Email', 'email', 'email', false, 2, true),
        (company_entity_id, 'Telefone', 'phone', 'phone', false, 3, true),
        (company_entity_id, 'Website', 'website', 'url', false, 4, true)
        ON CONFLICT (entity_id, slug) DO NOTHING;
        
        -- Campos padrão para Pessoas
        INSERT INTO web_entity_fields (entity_id, name, slug, field_type, is_required, order_index, is_system) VALUES
        (people_entity_id, 'Nome', 'name', 'short_text', true, 0, true),
        (people_entity_id, 'Email', 'email', 'email', false, 1, true),
        (people_entity_id, 'Telefone', 'phone', 'phone', false, 2, true),
        (people_entity_id, 'Cargo', 'role', 'short_text', false, 3, true)
        ON CONFLICT (entity_id, slug) DO NOTHING;
        
        -- Campos padrão para Parceiros
        INSERT INTO web_entity_fields (entity_id, name, slug, field_type, is_required, order_index, is_system) VALUES
        (partner_entity_id, 'Nome', 'name', 'short_text', true, 0, true),
        (partner_entity_id, 'Email', 'email', 'email', false, 1, true),
        (partner_entity_id, 'Telefone', 'phone', 'phone', false, 2, true),
        (partner_entity_id, 'Tipo', 'type', 'single_select', false, 3, true)
        ON CONFLICT (entity_id, slug) DO NOTHING;
        
        -- Relacionamento padrão: Empresa -> Pessoas
        INSERT INTO web_entity_relationships (client_id, source_entity_id, target_entity_id, relationship_type, name, reverse_name) VALUES
        (p_client_id, company_entity_id, people_entity_id, 'one_to_many', 'Funcionários', 'Empresa')
        ON CONFLICT DO NOTHING;
    END;
END;
$$ LANGUAGE plpgsql;

-- Criar entidades padrão para clientes existentes
DO $$
DECLARE
    client_record RECORD;
BEGIN
    FOR client_record IN SELECT id FROM core_clients LOOP
        PERFORM create_default_entities_for_client(client_record.id);
    END LOOP;
END $$;

-- =====================================================
-- TRIGGERS E FUNÇÕES
-- =====================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_web_entities_updated_at BEFORE UPDATE ON web_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_entity_fields_updated_at BEFORE UPDATE ON web_entity_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_entity_records_updated_at BEFORE UPDATE ON web_entity_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_deal_custom_fields_updated_at BEFORE UPDATE ON web_deal_custom_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar entidades padrão para novos clientes
CREATE OR REPLACE FUNCTION create_default_entities_for_new_client()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_entities_for_client(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_entities_trigger
    AFTER INSERT ON core_clients
    FOR EACH ROW
    EXECUTE FUNCTION create_default_entities_for_new_client();

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE web_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_entity_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_entity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_entity_record_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_deal_custom_fields ENABLE ROW LEVEL SECURITY;

-- Políticas para web_entities
CREATE POLICY "Users can view entities from their client" ON web_entities
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage entities from their client" ON web_entities
    FOR ALL USING (
        client_id IN (
            SELECT client_id FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- Políticas para web_entity_fields
CREATE POLICY "Users can view entity fields from their client" ON web_entity_fields
    FOR SELECT USING (
        entity_id IN (
            SELECT id FROM web_entities 
            WHERE client_id IN (
                SELECT client_id FROM core_client_users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage entity fields from their client" ON web_entity_fields
    FOR ALL USING (
        entity_id IN (
            SELECT id FROM web_entities 
            WHERE client_id IN (
                SELECT client_id FROM core_client_users 
                WHERE id = auth.uid()
            )
        )
    );

-- Políticas para web_entity_records
CREATE POLICY "Users can view records from their client" ON web_entity_records
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage records from their client" ON web_entity_records
    FOR ALL USING (
        client_id IN (
            SELECT client_id FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- Políticas para web_entity_relationships
CREATE POLICY "Users can view relationships from their client" ON web_entity_relationships
    FOR SELECT USING (
        client_id IN (
            SELECT client_id FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage relationships from their client" ON web_entity_relationships
    FOR ALL USING (
        client_id IN (
            SELECT client_id FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- Políticas para web_entity_record_links
CREATE POLICY "Users can view record links from their client" ON web_entity_record_links
    FOR SELECT USING (
        relationship_id IN (
            SELECT id FROM web_entity_relationships 
            WHERE client_id IN (
                SELECT client_id FROM core_client_users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage record links from their client" ON web_entity_record_links
    FOR ALL USING (
        relationship_id IN (
            SELECT id FROM web_entity_relationships 
            WHERE client_id IN (
                SELECT client_id FROM core_client_users 
                WHERE id = auth.uid()
            )
        )
    );

-- Políticas para web_deal_custom_fields
CREATE POLICY "Users can view deal custom fields from their client" ON web_deal_custom_fields
    FOR SELECT USING (
        deal_id IN (
            SELECT id FROM web_deals 
            WHERE client_id IN (
                SELECT client_id FROM core_client_users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage deal custom fields from their client" ON web_deal_custom_fields
    FOR ALL USING (
        deal_id IN (
            SELECT id FROM web_deals 
            WHERE client_id IN (
                SELECT client_id FROM core_client_users 
                WHERE id = auth.uid()
            )
        )
    );

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE web_entities IS 'Entidades dinâmicas customizáveis (Bases do sistema)';
COMMENT ON TABLE web_entity_fields IS 'Campos personalizados para cada entidade';
COMMENT ON TABLE web_entity_records IS 'Registros/dados das entidades dinâmicas';
COMMENT ON TABLE web_entity_relationships IS 'Relacionamentos configuráveis entre entidades';
COMMENT ON TABLE web_entity_record_links IS 'Vínculos específicos entre registros de entidades';
COMMENT ON TABLE web_deal_custom_fields IS 'Campos personalizados em oportunidades baseados no flow';

COMMENT ON COLUMN web_entities.slug IS 'Identificador único da entidade (usado em URLs e APIs)';
COMMENT ON COLUMN web_entities.is_system IS 'Indica se é uma entidade padrão do sistema (não pode ser deletada)';
COMMENT ON COLUMN web_entity_fields.field_type IS 'Tipo do campo baseado nos tipos disponíveis no sistema';
COMMENT ON COLUMN web_entity_fields.layout_config IS 'Configurações de layout do campo no formulário';
COMMENT ON COLUMN web_entity_records.data IS 'Dados dinâmicos baseados nos campos da entidade';
COMMENT ON COLUMN web_entity_relationships.relationship_type IS 'Tipo de relacionamento: one_to_one, one_to_many, many_to_many'; 