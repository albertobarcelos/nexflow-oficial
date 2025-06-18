-- Create web_flow_templates table
CREATE TABLE IF NOT EXISTS web_flow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create web_flow_template_stages table
CREATE TABLE IF NOT EXISTS web_flow_template_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES web_flow_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed templates
INSERT INTO web_flow_templates (id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Funil de Vendas', 'Template para pipeline de vendas'),
    ('22222222-2222-2222-2222-222222222222', 'Onboarding de Clientes', 'Template para onboarding de clientes'),
    ('33333333-3333-3333-3333-333333333333', 'Gestão de Tarefas da Equipe', 'Template para gestão de tarefas da equipe')
ON CONFLICT DO NOTHING;

-- Seed stages for Funil de Vendas
INSERT INTO web_flow_template_stages (template_id, name, position) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Prospecção', 1),
    ('11111111-1111-1111-1111-111111111111', 'Apresentação', 2),
    ('11111111-1111-1111-1111-111111111111', 'Proposta', 3),
    ('11111111-1111-1111-1111-111111111111', 'Negociação', 4),
    ('11111111-1111-1111-1111-111111111111', 'Follow Up', 5),
    ('11111111-1111-1111-1111-111111111111', 'Ganho', 6),
    ('11111111-1111-1111-1111-111111111111', 'Perdido', 7)
ON CONFLICT DO NOTHING;

-- Seed stages for Onboarding de Clientes
INSERT INTO web_flow_template_stages (template_id, name, position) VALUES
    ('22222222-2222-2222-2222-222222222222', 'Boas-vindas', 1),
    ('22222222-2222-2222-2222-222222222222', 'Implementação', 2),
    ('22222222-2222-2222-2222-222222222222', 'Treinamento/Acompanhamento', 3),
    ('22222222-2222-2222-2222-222222222222', 'Finalização', 4),
    ('22222222-2222-2222-2222-222222222222', 'Concluído', 5),
    ('22222222-2222-2222-2222-222222222222', 'Arquivado', 6)
ON CONFLICT DO NOTHING;

-- Seed stages for Gestão de Tarefas da Equipe
INSERT INTO web_flow_template_stages (template_id, name, position) VALUES
    ('33333333-3333-3333-3333-333333333333', 'Backlog', 1),
    ('33333333-3333-3333-3333-333333333333', 'Fazendo', 2),
    ('33333333-3333-3333-3333-333333333333', 'Pausado', 3),
    ('33333333-3333-3333-3333-333333333333', 'Feito', 4),
    ('33333333-3333-3333-3333-333333333333', 'Arquivado', 5)
ON CONFLICT DO NOTHING; 