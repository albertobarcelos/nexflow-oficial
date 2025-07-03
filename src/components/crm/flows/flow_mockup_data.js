// Flow de exemplo para testes de front

export const mockFlow = {
    id: 'flow-mock-001',
    name: 'Funil de Vendas',
    description: 'Pipeline de vendas padrão para times comerciais.',
    created_by: 'user-mock-001',
    created_at: '2024-04-27T12:00:00Z',
    allowed_entities: ["companies", "people", "partners"],
    stages: [
        {
            id: 'stage-1',
            name: 'Prospecção',
            color: '#2563eb',
            description: 'Primeiro contato com o lead.',
            order_index: 1,
        },
        {
            id: 'stage-2',
            name: 'Apresentação',
            color: '#0ea5e9',
            description: 'Demonstração do produto/serviço.',
            order_index: 2,
        },
        {
            id: 'stage-3',
            name: 'Proposta',
            color: '#f59e42',
            description: 'Envio de proposta comercial.',
            order_index: 3,
        },
        {
            id: 'stage-4',
            name: 'Negociação',
            color: '#fbbf24',
            description: 'Ajustes de valores e condições.',
            order_index: 4,
        },
        {
            id: 'stage-5',
            name: 'Fechamento',
            color: '#22c55e',
            description: 'Contrato fechado e onboarding.',
            order_index: 5,
        },
        {
            id: 'stage-6',
            name: 'Perdido',
            color: '#ef4444',
            description: 'Oportunidade perdida.',
            order_index: 6,
        },
    ],
    deals: [
        {
            id: 'deal-1',
            title: 'Venda para ACME S.A.',
            value: 15000,
            company_id: 'company-1',
            person_id: 'person-1',
            stage_id: 'stage-1',
            position: 1000,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
            updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
            tags: ['WhatsApp', 'Importante'],
            temperature: 'warm',
            probability: 65,
            responsible_name: 'João Silva',
            responsible_id: 'user-1',
            responsibles: [
                { id: 'user-1', name: 'João Silva' },
                { id: 'user-2', name: 'Maria Santos' }
            ],
            notes: 'Cliente interessado em solução completa',
            last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
            id: 'deal-2',
            title: 'Proposta para Beta Ltda.',
            value: 8000,
            company_id: 'company-2',
            person_id: 'person-2',
            stage_id: 'stage-3',
            position: 1000,
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
            updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min atrás
            tags: ['Instagram', 'Urgente'],
            temperature: 'hot',
            probability: 85,
            responsible_name: 'Maria Santos',
            responsible_id: 'user-2',
            responsibles: [
                { id: 'user-2', name: 'Maria Santos' }
            ],
            notes: 'Precisa da proposta até amanhã',
            last_activity: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        {
            id: 'deal-3',
            title: 'Negociação com Gamma Inc.',
            value: 12000,
            company_id: 'company-3',
            person_id: 'person-3',
            stage_id: 'stage-4',
            position: 1000,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
            updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
            tags: ['Live', 'CLP'],
            temperature: 'warm',
            probability: 72,
            responsible_name: 'Pedro Costa',
            responsible_id: 'user-3',
            responsibles: [
                { id: 'user-3', name: 'Pedro Costa' },
                { id: 'user-4', name: 'Ana Silva' }
            ],
            notes: 'Aguardando aprovação do orçamento',
            last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'deal-4',
            title: 'Fechamento com Delta S/A',
            value: 20000,
            company_id: 'company-4',
            person_id: 'person-4',
            stage_id: 'stage-5',
            position: 1000,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
            updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min atrás
            tags: ['VIP', 'WhatsApp'],
            temperature: 'hot',
            probability: 95,
            responsible_name: 'Ana Silva',
            responsible_id: 'user-4',
            responsibles: [
                { id: 'user-4', name: 'Ana Silva' }
            ],
            notes: 'Pronto para assinatura do contrato',
            last_activity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
            id: 'deal-5',
            title: 'Apresentação para Epsilon Corp.',
            value: 6500,
            company_id: 'company-5',
            person_id: 'person-5',
            stage_id: 'stage-2',
            position: 1000,
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
            updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
            tags: ['Instagram', 'Live'],
            temperature: 'cold',
            probability: 45,
            responsible_name: 'Carlos Oliveira',
            responsible_id: 'user-5',
            responsibles: [
                { id: 'user-5', name: 'Carlos Oliveira' }
            ],
            notes: 'Demonstração agendada para quinta-feira',
            last_activity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'deal-6',
            title: 'Prospecção Zeta Solutions',
            value: 18000,
            company_id: 'company-6',
            person_id: 'person-6',
            stage_id: 'stage-1',
            position: 2000,
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min atrás
            updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 min atrás
            tags: ['CLP', 'Importante'],
            temperature: 'warm',
            probability: 55,
            responsible_name: 'Fernanda Lima',
            responsible_id: 'user-6',
            responsibles: [
                { id: 'user-6', name: 'Fernanda Lima' }
            ],
            notes: 'Lead qualificado, fazer contato hoje',
            last_activity: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        },
        {
            id: 'deal-7',
            title: 'Proposta para Theta Group',
            value: 9500,
            company_id: 'company-7',
            person_id: 'person-7',
            stage_id: 'stage-3',
            position: 2000,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
            tags: ['WhatsApp', 'VIP'],
            temperature: 'hot',
            probability: 78,
            responsible_name: 'Ricardo Mendes',
            responsible_id: 'user-7',
            responsibles: [
                { id: 'user-7', name: 'Ricardo Mendes' }
            ],
            notes: 'Cliente VIP, dar prioridade',
            last_activity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'deal-8',
            title: 'Negociação Iota Ltda.',
            value: 14000,
            company_id: 'company-8',
            person_id: 'person-8',
            stage_id: 'stage-4',
            position: 2000,
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min atrás
            updated_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min atrás
            tags: ['Live', 'Urgente'],
            temperature: 'warm',
            probability: 68,
            responsible_name: 'Juliana Pereira',
            responsible_id: 'user-8',
            responsibles: [
                { id: 'user-8', name: 'Juliana Pereira' }
            ],
            notes: 'Negociação em andamento, resposta até sexta',
            last_activity: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        },
    ],
    bases: ['Empresas', 'Contatos'],
};
