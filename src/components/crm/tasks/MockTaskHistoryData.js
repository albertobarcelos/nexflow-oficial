// Dados mock para histórico das tarefas
export const mockTaskHistory = [
    {
        id: '1',
        task_id: 'task-1',
        user_id: 'user-1',
        action_type: 'created',
        description: 'Tarefa criada: Reunião com cliente ABC',
        field_changes: {
            created: true
        },
        new_values: {
            title: 'Reunião com cliente ABC',
            priority: 'high',
            due_date: '2024-01-20T14:00:00Z'
        },
        metadata: {
            created_at: '2024-01-18T10:30:00Z',
            task_type: 'meeting'
        },
        created_at: '2024-01-18T10:30:00Z',
        user: {
            name: 'João Silva',
            email: 'joao@empresa.com'
        }
    },
    {
        id: '2',
        task_id: 'task-1',
        user_id: 'user-2',
        action_type: 'updated',
        description: 'Tarefa editada: 2 campos atualizados: priority, due_date',
        field_changes: {
            priority: {
                old: 'medium',
                new: 'high'
            },
            due_date: {
                old: '2024-01-22T14:00:00Z',
                new: '2024-01-20T14:00:00Z'
            }
        },
        old_values: {
            priority: 'medium',
            due_date: '2024-01-22T14:00:00Z'
        },
        new_values: {
            priority: 'high',
            due_date: '2024-01-20T14:00:00Z'
        },
        metadata: {
            task_title: 'Reunião com cliente ABC',
            fields_changed: ['priority', 'due_date'],
            updated_at: '2024-01-18T11:15:00Z'
        },
        created_at: '2024-01-18T11:15:00Z',
        user: {
            name: 'Maria Santos',
            email: 'maria@empresa.com'
        }
    },
    {
        id: '3',
        task_id: 'task-1',
        user_id: 'user-1',
        action_type: 'status_changed',
        description: 'Status alterado de "A Fazer" para "Em Andamento"',
        field_changes: {
            status: {
                old: 'todo',
                new: 'doing'
            }
        },
        old_values: {
            status: 'todo'
        },
        new_values: {
            status: 'doing'
        },
        metadata: {
            task_title: 'Reunião com cliente ABC',
            changed_at: '2024-01-18T14:30:00Z'
        },
        created_at: '2024-01-18T14:30:00Z',
        user: {
            name: 'João Silva',
            email: 'joao@empresa.com'
        }
    },
    {
        id: '4',
        task_id: 'task-1',
        user_id: 'user-3',
        action_type: 'assigned',
        description: 'Tarefa atribuída',
        field_changes: {
            assigned_to: {
                old: null,
                new: 'user-3'
            }
        },
        old_values: {
            assigned_to: null
        },
        new_values: {
            assigned_to: 'user-3'
        },
        metadata: {
            task_title: 'Reunião com cliente ABC',
            assigned_at: '2024-01-18T15:45:00Z'
        },
        created_at: '2024-01-18T15:45:00Z',
        user: {
            name: 'Pedro Costa',
            email: 'pedro@empresa.com'
        }
    },
    {
        id: '5',
        task_id: 'task-1',
        user_id: 'user-3',
        action_type: 'status_changed',
        description: 'Status alterado de "Em Andamento" para "Concluído"',
        field_changes: {
            status: {
                old: 'doing',
                new: 'done'
            }
        },
        old_values: {
            status: 'doing'
        },
        new_values: {
            status: 'done'
        },
        metadata: {
            task_title: 'Reunião com cliente ABC',
            changed_at: '2024-01-20T16:00:00Z',
            completion_time: '2024-01-20T16:00:00Z'
        },
        created_at: '2024-01-20T16:00:00Z',
        user: {
            name: 'Pedro Costa',
            email: 'pedro@empresa.com'
        }
    }
];

// Mock de estatísticas do histórico
export const mockHistoryStats = {
    totalEntries: 5,
    actionCounts: {
        created: 1,
        updated: 1,
        status_changed: 2,
        assigned: 1,
        deleted: 0
    },
    lastChange: {
        created_at: '2024-01-20T16:00:00Z',
        description: 'Status alterado de "Em Andamento" para "Concluído"',
        action_type: 'status_changed'
    }
};

// Função para simular busca de histórico por tarefa
export function getMockHistoryByTaskId(taskId) {
    // Para demonstração, retornamos os dados mock para qualquer taskId
    return mockTaskHistory.map(entry => ({
        ...entry,
        task_id: taskId
    }));
}

// Função para simular estatísticas por tarefa
export function getMockStatsByTaskId(taskId) {
    return {
        ...mockHistoryStats,
        taskId
    };
} 