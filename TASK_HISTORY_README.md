# Sistema de Histórico de Tarefas

Este sistema foi implementado para rastrear todas as alterações feitas nas tarefas do CRM. Ele registra automaticamente criações, edições, mudanças de status e exclusões.

## 🔥 Funcionalidades Implementadas

### 1. Migração do Banco de Dados

- **Arquivo**: `migrations/020_create_task_history.sql`
- **Tabela**: `task_history`
- **Campos principais**:
  - `task_id`: ID da tarefa
  - `action_type`: Tipo de ação ('created', 'updated', 'status_changed', 'assigned', 'deleted')
  - `description`: Descrição legível da alteração
  - `field_changes`: JSON com campos alterados (antes/depois)
  - `old_values`: Valores anteriores
  - `new_values`: Novos valores
  - `metadata`: Informações adicionais

### 2. Triggers Automáticos

- **Função**: `log_task_changes()`
- **Registro automático** de:
  - Criação de tarefas
  - Edições de campos
  - Mudanças de status
  - Atribuições
  - Exclusões

### 3. Hook Personalizado

- **Arquivo**: `src/hooks/useTaskHistory.ts`
- **Funções**:
  - `useTaskHistory(taskId)`: Busca histórico de uma tarefa
  - `useTaskHistoryStats(taskId)`: Estatísticas do histórico
  - `useAddTaskHistory()`: Adiciona entrada manual ao histórico
  - `formatFieldChange()`: Formata mudanças de campos
  - `getActionConfig()`: Configuração de ícones e cores

### 4. Componente de Interface

- **Arquivo**: `src/components/crm/tasks/TaskHistoryTab.tsx`
- **Funcionalidades**:
  - Timeline visual das alterações
  - Estatísticas resumidas
  - Detalhes expansíveis das mudanças
  - Avatares dos usuários
  - Ícones por tipo de ação

### 5. Modal Atualizado

- **Arquivo**: `src/components/crm/tasks/TaskDetailsDialog.tsx`
- **Nova aba**: "Histórico" ao lado de "Detalhes"
- **Layout responsivo** com abas

### 6. Integração Automática

- **Arquivo**: `src/pages/crm/tasks/Tasks.tsx`
- **Registro automático** em:
  - `handleSaveTask()`: Nova tarefa
  - `handleStatusChange()`: Mudança de status
  - `handleSaveEditedTask()`: Edição de tarefa
  - `handleTaskDelete()`: Exclusão

## 🎨 Componentes Visuais

### Timeline do Histórico

- **Linha temporal** vertical
- **Ícones coloridos** por tipo de ação:
  - 🟢 Verde: Criação
  - 🔵 Azul: Edição
  - 🟣 Roxo: Mudança de status
  - 🟠 Laranja: Atribuição
  - 🔴 Vermelho: Exclusão

### Estatísticas

- **Contador total** de alterações
- **Contadores por tipo** de ação
- **Última alteração** com timestamp

### Detalhes Expansíveis

- **Botão "Ver detalhes"** para cada entrada
- **Campos alterados** com antes/depois
- **Metadados** adicionais em JSON

## 📝 Dados Mock para Desenvolvimento

### Arquivo de Dados

- **Arquivo**: `src/components/crm/tasks/MockTaskHistoryData.js`
- **Funções**:
  - `getMockHistoryByTaskId(taskId)`
  - `getMockStatsByTaskId(taskId)`

### Configuração Mock

- **Variável**: `USE_MOCK_DATA = true` em `useTaskHistory.ts`
- **Para usar dados reais**: Mudar para `false`

## 🚀 Como Usar

### 1. Visualizar Histórico

```tsx
// No modal de detalhes da tarefa
<TaskDetailsDialog task={selectedTask} open={isOpen} onClose={onClose} />
// A aba "Histórico" aparecerá automaticamente
```

### 2. Registrar Entrada Manual

```tsx
const addHistory = useAddTaskHistory();

await addHistory.mutateAsync({
  taskId: "task-123",
  actionType: "updated",
  description: "Campo prioridade alterado",
  fieldChanges: {
    priority: { old: "low", new: "high" },
  },
});
```

### 3. Buscar Histórico

```tsx
const { data: history, isLoading } = useTaskHistory("task-123");
const { data: stats } = useTaskHistoryStats("task-123");
```

## 🛠️ Configuração do Banco

### 1. Executar Migração

```sql
-- Aplicar o arquivo migrations/020_create_task_history.sql
-- Isso criará:
-- - Tabela task_history
-- - Triggers automáticos
-- - Políticas RLS
-- - Índices de performance
```

### 2. Verificar Funcionamento

```sql
-- Verificar se os triggers estão funcionando
INSERT INTO tasks (title, description, due_date, client_id)
VALUES ('Teste', 'Descrição teste', '2024-01-20', 'client-id');

-- Verificar se foi registrado no histórico
SELECT * FROM task_history WHERE action_type = 'created';
```

## 🎯 Tipos de Ações Rastreadas

### Automáticas (via Triggers)

- ✅ **created**: Tarefa criada
- ✅ **updated**: Campos editados
- ✅ **status_changed**: Status alterado (completed/pending)
- ✅ **assigned**: Responsável atribuído
- ✅ **deleted**: Tarefa excluída

### Manuais (via Interface)

- ✅ **status_changed**: Mudança de status no kanban
- ✅ **updated**: Edição via modal
- ✅ **created**: Nova tarefa via formulário

## 📊 Formatação de Mudanças

### Campos Suportados

- **title**: Título da tarefa
- **description**: Descrição
- **priority**: Prioridade (low/medium/high)
- **due_date**: Data de vencimento
- **completed**: Status de conclusão
- **assigned_to**: Responsável

### Exemplo de Formatação

```typescript
formatFieldChange("priority", "low", "high");
// Retorna: "Prioridade: Baixa → Alta"

formatFieldChange("due_date", "2024-01-20", "2024-01-22");
// Retorna: "Data de vencimento: 20/01/2024 → 22/01/2024"
```

## 🔧 Customização

### Adicionar Novos Tipos de Ação

1. Adicionar em `TaskHistoryEntry['action_type']`
2. Adicionar em `getActionConfig()`
3. Adicionar tratamento nos triggers SQL

### Personalizar Cores e Ícones

```typescript
// Em getActionConfig()
const configs = {
  meu_tipo: {
    icon: "MeuIcone",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    label: "Minha Ação",
  },
};
```

## ⚡ Performance

### Otimizações Implementadas

- **Índices** em campos de busca frequente
- **RLS policies** para segurança
- **staleTime** de 5 minutos no cache
- **Paginação** automática no componente

### Monitoramento

- **Logs** detalhados de erros
- **Fallback** para dados mock em desenvolvimento
- **Tratamento** de erros em todas as operações

## 🎉 Pronto para Uso!

O sistema está completamente implementado e funcional. Basta:

1. ✅ Executar a migração `020_create_task_history.sql`
2. ✅ Configurar `USE_MOCK_DATA = false` para dados reais
3. ✅ Usar o modal de tarefas normalmente
4. ✅ O histórico será exibido automaticamente na aba "Histórico"

**Todas as alterações são registradas automaticamente!** 🎯
