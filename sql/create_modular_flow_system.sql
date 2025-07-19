-- =====================================================
-- SISTEMA MODULAR DE FLOWS E VISUALIZAÇÕES DUPLICADAS
-- =====================================================
-- AIDEV-NOTE: Sistema que permite ao usuário criar flows personalizados
-- com etapas configuráveis e automações de duplicação entre flows

-- Tabela para estágios/etapas dos flows (já existe, mas vamos garantir)
CREATE TABLE IF NOT EXISTS web_flow_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES web_flows(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Cor hex para o estágio
    order_index INTEGER NOT NULL DEFAULT 1,
    is_final_stage BOOLEAN DEFAULT false, -- Indica se é estágio final (ganho/perdido)
    stage_type VARCHAR(20) DEFAULT 'active' CHECK (stage_type IN ('active', 'won', 'lost', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir ordem única por flow
    UNIQUE(flow_id, order_index)
);

-- Tabela para visualizações duplicadas de deals entre flows
CREATE TABLE IF NOT EXISTS web_deal_flow_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL, -- Referência ao deal principal (web_deals)
    flow_id UUID NOT NULL REFERENCES web_flows(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES web_flow_stages(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- Indica se é a visualização principal
    is_duplicate BOOLEAN DEFAULT true, -- Indica se é visualização duplicada
    visible_to_roles TEXT[] DEFAULT '{}', -- Array de papéis com acesso
    auto_sync BOOLEAN DEFAULT true, -- Sincronização automática ativada
    sync_fields TEXT[] DEFAULT '{}', -- Campos que sincronizam automaticamente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que um deal só aparece uma vez por flow
    UNIQUE(deal_id, flow_id)
);

-- Tabela para automações entre flows (regras de duplicação)
CREATE TABLE IF NOT EXISTS web_flow_automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Flow e estágio de origem (trigger)
    source_flow_id UUID NOT NULL REFERENCES web_flows(id) ON DELETE CASCADE,
    source_stage_id UUID NOT NULL REFERENCES web_flow_stages(id) ON DELETE CASCADE,
    
    -- Flow e estágio de destino (ação)
    target_flow_id UUID NOT NULL REFERENCES web_flows(id) ON DELETE CASCADE,
    target_stage_id UUID NOT NULL REFERENCES web_flow_stages(id) ON DELETE CASCADE,
    
    -- Configurações da automação
    automation_type VARCHAR(20) DEFAULT 'duplicate' CHECK (automation_type IN ('duplicate', 'move', 'copy')),
    trigger_condition VARCHAR(20) DEFAULT 'stage_change' CHECK (trigger_condition IN ('stage_change', 'field_update', 'time_based')),
    
    -- Condições adicionais (JSON)
    conditions JSONB DEFAULT '{}',
    
    -- Ações a executar (JSON)
    actions JSONB DEFAULT '{}',
    
    -- Papéis que podem ver a duplicação
    visible_to_roles TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para templates de flows (flows pré-configurados)
CREATE TABLE IF NOT EXISTS web_flow_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'custom', -- vendas, onboarding, suporte, custom
    is_system_template BOOLEAN DEFAULT false, -- Templates do sistema vs usuário
    template_data JSONB NOT NULL, -- Estrutura completa do flow (stages, automations, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de duplicação por papel/usuário
CREATE TABLE IF NOT EXISTS web_flow_role_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES web_flows(id) ON DELETE CASCADE,
    user_role VARCHAR(50) NOT NULL, -- administrator, closer, sdr, etc
    
    -- Configurações de visibilidade
    can_view_all_stages BOOLEAN DEFAULT false,
    visible_stages UUID[] DEFAULT '{}', -- Array de stage_ids visíveis
    can_edit_deals BOOLEAN DEFAULT true,
    can_move_deals BOOLEAN DEFAULT true,
    can_create_deals BOOLEAN DEFAULT true,
    
    -- Configurações de duplicação
    auto_duplicate_to_flows UUID[] DEFAULT '{}', -- Flows para duplicação automática
    notification_preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir configuração única por flow/papel
    UNIQUE(flow_id, user_role)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para web_flow_stages
CREATE INDEX IF NOT EXISTS idx_web_flow_stages_flow_id ON web_flow_stages(flow_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_stages_client_id ON web_flow_stages(client_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_stages_order ON web_flow_stages(flow_id, order_index);

-- Índices para web_deal_flow_views
CREATE INDEX IF NOT EXISTS idx_web_deal_flow_views_deal_id ON web_deal_flow_views(deal_id);
CREATE INDEX IF NOT EXISTS idx_web_deal_flow_views_flow_id ON web_deal_flow_views(flow_id);
CREATE INDEX IF NOT EXISTS idx_web_deal_flow_views_stage_id ON web_deal_flow_views(stage_id);
CREATE INDEX IF NOT EXISTS idx_web_deal_flow_views_client_id ON web_deal_flow_views(client_id);
CREATE INDEX IF NOT EXISTS idx_web_deal_flow_views_primary ON web_deal_flow_views(deal_id, is_primary);

-- Índices para web_flow_automations
CREATE INDEX IF NOT EXISTS idx_web_flow_automations_source_flow ON web_flow_automations(source_flow_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_automations_target_flow ON web_flow_automations(target_flow_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_automations_source_stage ON web_flow_automations(source_stage_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_automations_target_stage ON web_flow_automations(target_stage_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_automations_active ON web_flow_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_web_flow_automations_client_id ON web_flow_automations(client_id);

-- Índices para web_flow_role_configs
CREATE INDEX IF NOT EXISTS idx_web_flow_role_configs_flow_id ON web_flow_role_configs(flow_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_role_configs_client_id ON web_flow_role_configs(client_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_role_configs_role ON web_flow_role_configs(user_role);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- RLS para web_flow_stages
ALTER TABLE web_flow_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stages from their client" ON web_flow_stages
    FOR SELECT USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage stages from their client" ON web_flow_stages
    FOR ALL USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- RLS para web_deal_flow_views
ALTER TABLE web_deal_flow_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal flow views from their client" ON web_deal_flow_views
    FOR SELECT USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage deal flow views from their client" ON web_deal_flow_views
    FOR ALL USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- RLS para web_flow_automations
ALTER TABLE web_flow_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automations from their client" ON web_flow_automations
    FOR SELECT USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage automations from their client" ON web_flow_automations
    FOR ALL USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- RLS para web_flow_role_configs
ALTER TABLE web_flow_role_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view role configs from their client" ON web_flow_role_configs
    FOR SELECT USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage role configs from their client" ON web_flow_role_configs
    FOR ALL USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- RLS para web_flow_templates (apenas leitura para todos)
ALTER TABLE web_flow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view flow templates" ON web_flow_templates
    FOR SELECT USING (true);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE web_flow_stages IS 'Estágios/etapas configuráveis dos flows criados pelo usuário';
COMMENT ON TABLE web_deal_flow_views IS 'Visualizações duplicadas de deals entre múltiplos flows';
COMMENT ON TABLE web_flow_automations IS 'Automações configuráveis para duplicação entre flows';
COMMENT ON TABLE web_flow_templates IS 'Templates pré-configurados de flows para facilitar criação';
COMMENT ON TABLE web_flow_role_configs IS 'Configurações de visibilidade e permissões por papel/usuário';

COMMENT ON COLUMN web_flow_stages.stage_type IS 'Tipo do estágio: active, won, lost, archived';
COMMENT ON COLUMN web_deal_flow_views.is_primary IS 'Indica se é a visualização principal do deal';
COMMENT ON COLUMN web_deal_flow_views.visible_to_roles IS 'Array de papéis que podem ver esta visualização';
COMMENT ON COLUMN web_flow_automations.automation_type IS 'Tipo: duplicate (duplicar), move (mover), copy (copiar)';
COMMENT ON COLUMN web_flow_automations.trigger_condition IS 'Condição: stage_change, field_update, time_based';
COMMENT ON COLUMN web_flow_templates.template_data IS 'Estrutura completa do flow em JSON';
COMMENT ON COLUMN web_flow_role_configs.visible_stages IS 'Array de UUIDs dos estágios visíveis para o papel';