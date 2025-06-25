export const mockTasks = [
    {
        id: 'task-1',
        title: 'Reunião',
        description: 'Reunião com cliente para apresentação da proposta',
        type: 'Reunião',
        status: 'pending',
        priority: 'high',
        due_date: new Date().toISOString(),
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'João Silva',
        opportunity_id: 'deal-1',
        opportunity_name: 'Venda para ACME S.A.',
        created_by: 'Maria Santos',
        responsible: 'João Silva',
        completed: false,
        history: [
            {
                id: 'history-task-1-1',
                task_id: 'task-1',
                user_id: 'user-1',
                action_type: 'created',
                description: 'Tarefa criada: Reunião com cliente para apresentação da proposta',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Maria Santos', email: 'maria@nexflow.com' },
                metadata: { priority: 'high', assigned_to: 'João Silva' }
            },
            {
                id: 'history-task-1-2',
                task_id: 'task-1',
                user_id: 'user-2',
                action_type: 'assigned',
                description: 'Tarefa atribuída para João Silva',
                created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Maria Santos', email: 'maria@nexflow.com' },
                field_changes: { assigned_to: { old: null, new: 'João Silva' } }
            }
        ]
    },
    {
        id: 'task-2',
        title: 'Ligação de follow-up',
        description: 'Ligar para cliente após envio da proposta',
        type: 'Ligação',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Pedro Costa',
        opportunity_id: 'deal-2',
        opportunity_name: 'Proposta para Beta Ltda.',
        created_by: 'Ana Silva',
        responsible: 'Pedro Costa',
        completed: false,
        history: [
            {
                id: 'history-task-2-1',
                task_id: 'task-2',
                user_id: 'user-3',
                action_type: 'created',
                description: 'Tarefa criada: Ligação de follow-up após envio da proposta',
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Ana Silva', email: 'ana@nexflow.com' },
                metadata: { priority: 'medium', assigned_to: 'Pedro Costa' }
            },
            {
                id: 'history-task-2-2',
                task_id: 'task-2',
                user_id: 'user-4',
                action_type: 'updated',
                description: 'Prazo da tarefa alterado',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                user: { name: 'Pedro Costa', email: 'pedro@nexflow.com' },
                field_changes: { due_date: { old: '2024-01-15', new: '2024-01-16' } }
            }
        ]
    },
    {
        id: 'task-3',
        title: 'Enviar e-mail de proposta',
        description: 'Enviar proposta comercial por e-mail',
        type: 'E-mail',
        status: 'completed',
        priority: 'high',
        due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Carlos Oliveira',
        opportunity_id: 'deal-3',
        opportunity_name: 'Negociação com Gamma Inc.',
        created_by: 'Fernanda Lima',
        responsible: 'Carlos Oliveira',
        completed: true,
        history: [
            {
                id: 'history-task-3-1',
                task_id: 'task-3',
                user_id: 'user-5',
                action_type: 'created',
                description: 'Tarefa criada: Enviar proposta comercial por e-mail',
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Fernanda Lima', email: 'fernanda@nexflow.com' },
                metadata: { priority: 'high', assigned_to: 'Carlos Oliveira' }
            },
            {
                id: 'history-task-3-2',
                task_id: 'task-3',
                user_id: 'user-6',
                action_type: 'status_changed',
                description: 'Status alterado de "A Fazer" para "Concluído"',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Carlos Oliveira', email: 'carlos@nexflow.com' },
                field_changes: { status: { old: 'pending', new: 'completed' } },
                old_values: { status: 'pending' },
                new_values: { status: 'completed' }
            }
        ]
    },
    {
        id: 'task-4',
        title: 'Follow-up com cliente',
        description: 'Realizar follow-up após reunião',
        type: 'Follow-up',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        assigned_to: 'Ana Silva',
        opportunity_id: 'deal-4',
        opportunity_name: 'Fechamento com Delta S/A',
        created_by: 'Ricardo Mendes',
        responsible: 'Ana Silva',
        completed: false,
        history: [
            {
                id: 'history-task-4-1',
                task_id: 'task-4',
                user_id: 'user-7',
                action_type: 'created',
                description: 'Tarefa criada: Realizar follow-up após reunião',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                user: { name: 'Ricardo Mendes', email: 'ricardo@nexflow.com' },
                metadata: { priority: 'high', assigned_to: 'Ana Silva' }
            }
        ]
    },
    {
        id: 'task-5',
        title: 'Demonstração do produto',
        description: 'Apresentar demo ao cliente',
        type: 'Demonstração',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Juliana Pereira',
        opportunity_id: 'deal-5',
        opportunity_name: 'Apresentação para Epsilon Corp.',
        created_by: 'João Silva',
        responsible: 'Juliana Pereira',
        completed: false,
        history: [
            {
                id: 'history-task-5-1',
                task_id: 'task-5',
                user_id: 'user-1',
                action_type: 'created',
                description: 'Tarefa criada: Apresentar demo ao cliente',
                created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                user: { name: 'João Silva', email: 'joao@nexflow.com' },
                metadata: { priority: 'medium', assigned_to: 'Juliana Pereira' }
            },
            {
                id: 'history-task-5-2',
                task_id: 'task-5',
                user_id: 'user-8',
                action_type: 'updated',
                description: 'Descrição da tarefa atualizada',
                created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Juliana Pereira', email: 'juliana@nexflow.com' },
                field_changes: { description: { old: 'Demo simples', new: 'Apresentar demo completo ao cliente' } }
            }
        ]
    },
    {
        id: 'task-6',
        title: 'Preparar proposta comercial',
        description: 'Gerar documento de proposta para cliente',
        type: 'Proposta',
        status: 'pending',
        priority: 'low',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Lucas Martins',
        opportunity_id: 'deal-6',
        opportunity_name: 'Proposta para Zeta Ltda.',
        created_by: 'Juliana Pereira',
        responsible: 'Lucas Martins',
        completed: false,
        history: [
            {
                id: 'history-task-6-1',
                task_id: 'task-6',
                user_id: 'user-8',
                action_type: 'created',
                description: 'Tarefa criada: Gerar documento de proposta para cliente',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Juliana Pereira', email: 'juliana@nexflow.com' },
                metadata: { priority: 'low', assigned_to: 'Lucas Martins' }
            }
        ]
    },
    {
        id: 'task-7',
        title: 'Negociação com cliente',
        description: 'Discutir condições comerciais',
        type: 'Negociação',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Marina Souza',
        opportunity_id: 'deal-7',
        opportunity_name: 'Negociação com Omega Ltda.',
        created_by: 'Pedro Costa',
        responsible: 'Marina Souza',
        completed: false,
        history: [
            {
                id: 'history-task-7-1',
                task_id: 'task-7',
                user_id: 'user-4',
                action_type: 'created',
                description: 'Tarefa criada: Discutir condições comerciais',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Pedro Costa', email: 'pedro@nexflow.com' },
                metadata: { priority: 'medium', assigned_to: 'Marina Souza' }
            },
            {
                id: 'history-task-7-2',
                task_id: 'task-7',
                user_id: 'user-9',
                action_type: 'updated',
                description: 'Prioridade alterada de baixa para média',
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                user: { name: 'Marina Souza', email: 'marina@nexflow.com' },
                field_changes: { priority: { old: 'low', new: 'medium' } },
                old_values: { priority: 'low' },
                new_values: { priority: 'medium' }
            }
        ]
    }
];

export const taskTypes = [
    { id: 'Reunião', name: 'Reunião', icon: 'Users' },
    { id: 'E-mail', name: 'E-mail', icon: 'Mail' },
    { id: 'Negociação', name: 'Negociação', icon: 'Handshake' },
    { id: 'Proposta', name: 'Proposta', icon: 'FileText' },
    { id: 'Ligação', name: 'Ligação', icon: 'Phone' },
    { id: 'Follow-up', name: 'Follow-up', icon: 'Clock' },
    { id: 'Demonstração', name: 'Demonstração', icon: 'Monitor' }
]; 