# Sistema de Histórico de Tarefas - Nexflow

## Visão Geral

O sistema de histórico de tarefas do Nexflow registra automaticamente todas as ações realizadas em tarefas, incluindo criação, edição, mudanças de status, atribuições e exclusões.

## Estrutura de Dados

### TaskHistoryEntry

```typescript
interface TaskHistoryEntry {
  id: string;
  task_id: string;
  user_id: string | null;
  action_type:
    | "created"
    | "updated"
    | "status_changed"
    | "assigned"
    | "deleted";
  description: string;
  field_changes?: any;
  old_values?: any;
  new_values?: any;
  metadata?: any;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}
```

## Dados Mock

### MockTaskData.js - Campo History

Cada tarefa no arquivo `MockTaskData.js` agora possui um campo `history` com dados fictícios:

```javascript
{
  id: 'task-1',
  title: 'Reunião',
  // ... outros campos da tarefa
  history: [
    {
      id: 'history-task-1-1',
      task_id: 'task-1',
      action_type: 'created',
      description: 'Tarefa criada: Reunião com cliente para apresentação da proposta',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Maria Santos', email: 'maria@nexflow.com' },
      metadata: { priority: 'high', assigned_to: 'João Silva' }
    },
    {
      id: 'history-task-1-2',
      action_type: 'assigned',
      description: 'Tarefa atribuída para João Silva',
      // ... mais dados
    }
  ]
}
```

## Hooks Disponíveis

### 1. useTaskHistory(taskId)

Busca o histórico completo de uma tarefa:

```typescript
const { data: history, isLoading, error } = useTaskHistory("task-1");
```

### 2. useTaskHistoryStats(taskId)

Busca estatísticas do histórico:

```typescript
const { data: stats } = useTaskHistoryStats("task-1");
// Retorna: { totalEntries, actionCounts, lastChange }
```

### 3. useTaskStatusChange()

Hook para registrar mudanças de status automaticamente:

```typescript
const { logStatusChange } = useTaskStatusChange();

// Uso:
logStatusChange("task-1", "pending", "completed", "João Silva");
```

### 4. useTaskPriorityChange()

Hook para registrar mudanças de prioridade:

```typescript
const { logPriorityChange } = useTaskPriorityChange();

// Uso:
logPriorityChange("task-1", "low", "high", "Maria Santos");
```

### 5. useTaskAssignment()

Hook para registrar atribuições de tarefas:

```typescript
const { logAssignment } = useTaskAssignment();

// Uso:
logAssignment("task-1", "João Silva", "Maria Santos", "Admin");
```

## Função Utilitária

### addTaskHistoryEntry()

Função para adicionar entradas customizadas ao histórico:

```typescript
addTaskHistoryEntry(
  taskId: string,
  actionType: 'created' | 'updated' | 'status_changed' | 'assigned' | 'deleted',
  description: string,
  fieldChanges?: any,
  oldValues?: any,
  newValues?: any,
  metadata?: any,
  userName?: string,
  userEmail?: string
);
```

## Exemplos de Uso

### 1. Registrar Criação de Tarefa

```typescript
// No NewTaskForm.tsx
addTaskHistoryEntry(
  taskId,
  "created",
  `Tarefa criada: ${formData.title}`,
  undefined,
  undefined,
  undefined,
  {
    priority: formData.priority,
    assigned_to: formData.responsible,
    type: formData.type,
  },
  "Usuário Atual"
);
```

### 2. Registrar Mudança de Status

```typescript
// No TaskCard.tsx
const { logStatusChange } = useTaskStatusChange();

const handleCompleteTask = () => {
  logStatusChange(task.id, "pending", "completed", "Usuário Atual");
  onCompleteTask(task.id);
};
```

### 3. Registrar Atribuição

```typescript
// Ao atribuir uma tarefa
const { logAssignment } = useTaskAssignment();
logAssignment("task-1", null, "João Silva", "Maria Santos");
```

## Tipos de Ação

| Tipo             | Descrição         | Cor      |
| ---------------- | ----------------- | -------- |
| `created`        | Tarefa criada     | Verde    |
| `updated`        | Tarefa atualizada | Azul     |
| `status_changed` | Status alterado   | Roxo     |
| `assigned`       | Tarefa atribuída  | Laranja  |
| `deleted`        | Tarefa excluída   | Vermelho |

## Interface Visual

### TaskHistoryTab Component

- Exibe histórico completo da tarefa
- Cards com timeline visual
- Estatísticas resumidas
- Detalhes expansíveis para mudanças de campo
- Formatação segura de datas

### Recursos Visuais

- ✅ Timeline com ícones coloridos
- ✅ Cards responsivos com hover effects
- ✅ Badges para tipos de ação
- ✅ Detalhes colapsáveis
- ✅ Avatares de usuários
- ✅ Formatação de data em português
- ✅ Tratamento de erros de data inválida

## Configuração

### Modo Mock vs Produção

```typescript
// Em useTaskHistory.ts
const USE_MOCK_DATA = true; // Para desenvolvimento
```

### Ordem de Prioridade dos Dados

1. **MockTaskData.js** - Campo `history` da tarefa
2. **mockHistoryData** - Dados hardcoded no hook
3. **Supabase** - Dados reais (quando USE_MOCK_DATA = false)

## Tratamento de Erros

### Datas Inválidas

O sistema possui tratamento robusto para datas inválidas:

```typescript
const formatSafeDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return "Data inválida";
  }
};
```

## Logs de Desenvolvimento

O sistema registra logs no console durante desenvolvimento:

```
📝 Histórico adicionado para task-1: Tarefa criada: Reunião
📝 Histórico adicionado para task-1: Status alterado de "A Fazer" para "Concluído"
```

## Próximos Passos

1. **Integração com Supabase**: Implementar persistência real
2. **Notificações**: Sistema de notificações para mudanças
3. **Filtros**: Filtrar histórico por tipo de ação
4. **Exportação**: Exportar histórico em PDF/Excel
5. **Auditoria**: Logs de auditoria completos
