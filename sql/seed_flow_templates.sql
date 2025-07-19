-- =====================================================
-- TEMPLATES PRÉ-CONFIGURADOS PARA FLOWS MODULARES
-- =====================================================
-- AIDEV-NOTE: Templates que facilitam a criação de flows pelos usuários
-- mantendo a funcionalidade de duplicação entre etapas

-- Inserir templates do sistema
INSERT INTO web_flow_templates (id, name, description, category, is_system_template, template_data) VALUES

-- Template: Vendas Completo
('11111111-1111-1111-1111-111111111111', 
 'Vendas Completo', 
 'Flow completo de vendas com prospecção, qualificação e fechamento',
 'vendas',
 true,
 '{
   "flow": {
     "name": "Vendas Completo",
     "description": "Flow completo de vendas"
   },
   "stages": [
     {"name": "Lead", "description": "Novos leads capturados", "color": "#3B82F6", "order_index": 1, "stage_type": "active"},
     {"name": "Qualificação", "description": "Qualificando interesse e fit", "color": "#8B5CF6", "order_index": 2, "stage_type": "active"},
     {"name": "Reunião Agendada", "description": "Reunião marcada com prospect", "color": "#F59E0B", "order_index": 3, "stage_type": "active"},
     {"name": "Proposta", "description": "Proposta enviada", "color": "#EF4444", "order_index": 4, "stage_type": "active"},
     {"name": "Negociação", "description": "Em negociação", "color": "#F97316", "order_index": 5, "stage_type": "active"},
     {"name": "Ganho", "description": "Venda fechada", "color": "#10B981", "order_index": 6, "stage_type": "won", "is_final_stage": true},
     {"name": "Perdido", "description": "Oportunidade perdida", "color": "#6B7280", "order_index": 7, "stage_type": "lost", "is_final_stage": true}
   ],
   "automations": [
     {
       "name": "Duplicar para Closer",
       "description": "Quando chegar em Reunião Agendada, duplicar para flow de Closer",
       "source_stage": "Reunião Agendada",
       "automation_type": "duplicate",
       "trigger_condition": "stage_change",
       "visible_to_roles": ["closer", "administrator"]
     }
   ]
 }'),

-- Template: SDR - Prospecção
('22222222-2222-2222-2222-222222222222',
 'SDR - Prospecção',
 'Flow especializado para SDRs focado em captura e qualificação de leads',
 'vendas',
 true,
 '{
   "flow": {
     "name": "SDR - Prospecção",
     "description": "Flow para captura e qualificação de leads"
   },
   "stages": [
     {"name": "Novo Lead", "description": "Lead recém capturado", "color": "#3B82F6", "order_index": 1, "stage_type": "active"},
     {"name": "Pesquisa", "description": "Pesquisando empresa e contato", "color": "#8B5CF6", "order_index": 2, "stage_type": "active"},
     {"name": "Primeiro Contato", "description": "Primeiro contato realizado", "color": "#F59E0B", "order_index": 3, "stage_type": "active"},
     {"name": "Follow-up", "description": "Em follow-up", "color": "#EF4444", "order_index": 4, "stage_type": "active"},
     {"name": "Qualificado", "description": "Lead qualificado para Closer", "color": "#10B981", "order_index": 5, "stage_type": "won", "is_final_stage": true},
     {"name": "Não Qualificado", "description": "Lead não qualificado", "color": "#6B7280", "order_index": 6, "stage_type": "lost", "is_final_stage": true}
   ],
   "automations": [
     {
       "name": "Enviar para Closer",
       "description": "Quando qualificado, duplicar para flow de Closer",
       "source_stage": "Qualificado",
       "automation_type": "duplicate",
       "trigger_condition": "stage_change",
       "visible_to_roles": ["closer", "administrator"]
     }
   ]
 }'),

-- Template: Closer - Vendas
('33333333-3333-3333-3333-333333333333',
 'Closer - Vendas',
 'Flow especializado para Closers focado em reuniões e fechamento',
 'vendas',
 true,
 '{
   "flow": {
     "name": "Closer - Vendas",
     "description": "Flow para reuniões e fechamento de vendas"
   },
   "stages": [
     {"name": "Reunião Agendada", "description": "Reunião marcada com prospect", "color": "#F59E0B", "order_index": 1, "stage_type": "active"},
     {"name": "Reunião Realizada", "description": "Reunião de descoberta realizada", "color": "#8B5CF6", "order_index": 2, "stage_type": "active"},
     {"name": "Proposta", "description": "Proposta comercial enviada", "color": "#EF4444", "order_index": 3, "stage_type": "active"},
     {"name": "Negociação", "description": "Negociando condições", "color": "#F97316", "order_index": 4, "stage_type": "active"},
     {"name": "Contrato", "description": "Contrato enviado para assinatura", "color": "#06B6D4", "order_index": 5, "stage_type": "active"},
     {"name": "Fechado", "description": "Venda fechada com sucesso", "color": "#10B981", "order_index": 6, "stage_type": "won", "is_final_stage": true},
     {"name": "Perdido", "description": "Oportunidade perdida", "color": "#6B7280", "order_index": 7, "stage_type": "lost", "is_final_stage": true}
   ],
   "automations": [
     {
       "name": "Enviar para Pós-venda",
       "description": "Quando fechado, duplicar para flow de Pós-venda",
       "source_stage": "Fechado",
       "automation_type": "duplicate",
       "trigger_condition": "stage_change",
       "visible_to_roles": ["administrator", "partnership_director"]
     }
   ]
 }'),

-- Template: Pós-venda
('44444444-4444-4444-4444-444444444444',
 'Pós-venda',
 'Flow para onboarding e acompanhamento pós-venda',
 'onboarding',
 true,
 '{
   "flow": {
     "name": "Pós-venda",
     "description": "Flow para onboarding e implementação"
   },
   "stages": [
     {"name": "Boas-vindas", "description": "Cliente recém fechado", "color": "#10B981", "order_index": 1, "stage_type": "active"},
     {"name": "Documentação", "description": "Coletando documentos necessários", "color": "#3B82F6", "order_index": 2, "stage_type": "active"},
     {"name": "Implementação", "description": "Implementando solução", "color": "#8B5CF6", "order_index": 3, "stage_type": "active"},
     {"name": "Treinamento", "description": "Treinando equipe do cliente", "color": "#F59E0B", "order_index": 4, "stage_type": "active"},
     {"name": "Go-live", "description": "Solução em produção", "color": "#EF4444", "order_index": 5, "stage_type": "active"},
     {"name": "Acompanhamento", "description": "Acompanhamento pós go-live", "color": "#F97316", "order_index": 6, "stage_type": "active"},
     {"name": "Concluído", "description": "Onboarding concluído", "color": "#10B981", "order_index": 7, "stage_type": "won", "is_final_stage": true},
     {"name": "Cancelado", "description": "Cliente cancelou", "color": "#6B7280", "order_index": 8, "stage_type": "lost", "is_final_stage": true}
   ],
   "automations": []
 }'),

-- Template: Suporte ao Cliente
('55555555-5555-5555-5555-555555555555',
 'Suporte ao Cliente',
 'Flow para gestão de tickets de suporte',
 'suporte',
 true,
 '{
   "flow": {
     "name": "Suporte ao Cliente",
     "description": "Flow para gestão de tickets de suporte"
   },
   "stages": [
     {"name": "Novo Ticket", "description": "Ticket recém aberto", "color": "#EF4444", "order_index": 1, "stage_type": "active"},
     {"name": "Em Análise", "description": "Analisando o problema", "color": "#F59E0B", "order_index": 2, "stage_type": "active"},
     {"name": "Em Desenvolvimento", "description": "Desenvolvendo solução", "color": "#8B5CF6", "order_index": 3, "stage_type": "active"},
     {"name": "Aguardando Cliente", "description": "Aguardando retorno do cliente", "color": "#06B6D4", "order_index": 4, "stage_type": "active"},
     {"name": "Resolvido", "description": "Problema resolvido", "color": "#10B981", "order_index": 5, "stage_type": "won", "is_final_stage": true},
     {"name": "Fechado", "description": "Ticket fechado", "color": "#6B7280", "order_index": 6, "stage_type": "archived", "is_final_stage": true}
   ],
   "automations": []
 }'),

-- Template: Gestão de Projetos
('66666666-6666-6666-6666-666666666666',
 'Gestão de Projetos',
 'Flow para acompanhamento de projetos internos',
 'projetos',
 true,
 '{
   "flow": {
     "name": "Gestão de Projetos",
     "description": "Flow para acompanhamento de projetos"
   },
   "stages": [
     {"name": "Backlog", "description": "Projeto no backlog", "color": "#6B7280", "order_index": 1, "stage_type": "active"},
     {"name": "Planejamento", "description": "Planejando execução", "color": "#3B82F6", "order_index": 2, "stage_type": "active"},
     {"name": "Em Desenvolvimento", "description": "Projeto em execução", "color": "#F59E0B", "order_index": 3, "stage_type": "active"},
     {"name": "Revisão", "description": "Em revisão/teste", "color": "#8B5CF6", "order_index": 4, "stage_type": "active"},
     {"name": "Homologação", "description": "Em homologação", "color": "#EF4444", "order_index": 5, "stage_type": "active"},
     {"name": "Concluído", "description": "Projeto finalizado", "color": "#10B981", "order_index": 6, "stage_type": "won", "is_final_stage": true},
     {"name": "Cancelado", "description": "Projeto cancelado", "color": "#6B7280", "order_index": 7, "stage_type": "lost", "is_final_stage": true}
   ],
   "automations": []
 }'),

-- Template: Simples (3 etapas)
('77777777-7777-7777-7777-777777777777',
 'Flow Simples',
 'Template básico com 3 etapas para começar rapidamente',
 'custom',
 true,
 '{
   "flow": {
     "name": "Flow Simples",
     "description": "Template básico para começar"
   },
   "stages": [
     {"name": "Início", "description": "Etapa inicial", "color": "#3B82F6", "order_index": 1, "stage_type": "active"},
     {"name": "Em Andamento", "description": "Em processamento", "color": "#F59E0B", "order_index": 2, "stage_type": "active"},
     {"name": "Concluído", "description": "Finalizado", "color": "#10B981", "order_index": 3, "stage_type": "won", "is_final_stage": true}
   ],
   "automations": []
 }')

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE web_flow_templates IS 'Templates pré-configurados para facilitar criação de flows pelos usuários';
COMMENT ON COLUMN web_flow_templates.template_data IS 'Estrutura JSON completa do flow: stages, automations, configurações';
COMMENT ON COLUMN web_flow_templates.is_system_template IS 'true = template do sistema, false = template criado pelo usuário';
COMMENT ON COLUMN web_flow_templates.category IS 'Categoria: vendas, onboarding, suporte, projetos, custom';