import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";
import { mockTasks } from "@/components/crm/tasks/MockTaskData.js";
import {
  mockTaskHistory,
  getMockHistoryByTaskId as getHistoryFromMockFile,
  getMockStatsByTaskId as getStatsFromMockFile,
} from "@/components/crm/tasks/MockTaskHistoryData.js";

export interface TaskHistoryEntry {
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

export interface TaskHistoryMutationData {
  taskId: string;
  actionType: TaskHistoryEntry["action_type"];
  description: string;
  fieldChanges?: any;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

// Configuração para usar dados mock (definir como false para usar dados reais)
const USE_MOCK_DATA = true;

// Dados mock de histórico para cada tarefa
const mockHistoryData: Record<string, TaskHistoryEntry[]> = {
  "task-1": [
    {
      id: "history-task-1-1",
      task_id: "task-1",
      user_id: "user-1",
      action_type: "created",
      description:
        "Tarefa criada: Reunião com cliente para apresentação da proposta",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: "Maria Santos", email: "maria@nexflow.com" },
      metadata: { priority: "high", assigned_to: "João Silva" },
    },
    {
      id: "history-task-1-2",
      task_id: "task-1",
      user_id: "user-2",
      action_type: "assigned",
      description: "Tarefa atribuída para João Silva",
      created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      user: { name: "Maria Santos", email: "maria@nexflow.com" },
      field_changes: { assigned_to: { old: null, new: "João Silva" } },
    },
  ],
  "task-2": [
    {
      id: "history-task-2-1",
      task_id: "task-2",
      user_id: "user-3",
      action_type: "created",
      description: "Tarefa criada: Ligação de follow-up após envio da proposta",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      user: { name: "Ana Silva", email: "ana@nexflow.com" },
      metadata: { priority: "medium", assigned_to: "Pedro Costa" },
    },
    {
      id: "history-task-2-2",
      task_id: "task-2",
      user_id: "user-4",
      action_type: "updated",
      description: "Prazo da tarefa alterado",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { name: "Pedro Costa", email: "pedro@nexflow.com" },
      field_changes: { due_date: { old: "2024-01-15", new: "2024-01-16" } },
    },
  ],
  "task-3": [
    {
      id: "history-task-3-1",
      task_id: "task-3",
      user_id: "user-5",
      action_type: "created",
      description: "Tarefa criada: Enviar proposta comercial por e-mail",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: { name: "Fernanda Lima", email: "fernanda@nexflow.com" },
      metadata: { priority: "high", assigned_to: "Carlos Oliveira" },
    },
    {
      id: "history-task-3-2",
      task_id: "task-3",
      user_id: "user-6",
      action_type: "status_changed",
      description: 'Status alterado de "A Fazer" para "Concluído"',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user: { name: "Carlos Oliveira", email: "carlos@nexflow.com" },
      field_changes: { status: { old: "todo", new: "done" } },
      old_values: { status: "todo" },
      new_values: { status: "done" },
    },
  ],
  "task-4": [
    {
      id: "history-task-4-1",
      task_id: "task-4",
      user_id: "user-7",
      action_type: "created",
      description: "Tarefa criada: Realizar follow-up após reunião",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { name: "Ricardo Mendes", email: "ricardo@nexflow.com" },
      metadata: { priority: "high", assigned_to: "Ana Silva" },
    },
  ],
  "task-5": [
    {
      id: "history-task-5-1",
      task_id: "task-5",
      user_id: "user-1",
      action_type: "created",
      description: "Tarefa criada: Apresentar demo ao cliente",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      user: { name: "João Silva", email: "joao@nexflow.com" },
      metadata: { priority: "medium", assigned_to: "Juliana Pereira" },
    },
    {
      id: "history-task-5-2",
      task_id: "task-5",
      user_id: "user-8",
      action_type: "updated",
      description: "Descrição da tarefa atualizada",
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { name: "Juliana Pereira", email: "juliana@nexflow.com" },
      field_changes: {
        description: {
          old: "Demo simples",
          new: "Apresentar demo completo ao cliente",
        },
      },
    },
  ],
  "task-6": [
    {
      id: "history-task-6-1",
      task_id: "task-6",
      user_id: "user-8",
      action_type: "created",
      description: "Tarefa criada: Gerar documento de proposta para cliente",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: "Juliana Pereira", email: "juliana@nexflow.com" },
      metadata: { priority: "low", assigned_to: "Lucas Martins" },
    },
  ],
  "task-7": [
    {
      id: "history-task-7-1",
      task_id: "task-7",
      user_id: "user-4",
      action_type: "created",
      description: "Tarefa criada: Discutir condições comerciais",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: "Pedro Costa", email: "pedro@nexflow.com" },
      metadata: { priority: "medium", assigned_to: "Marina Souza" },
    },
    {
      id: "history-task-7-2",
      task_id: "task-7",
      user_id: "user-9",
      action_type: "updated",
      description: "Prioridade alterada de baixa para média",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      user: { name: "Marina Souza", email: "marina@nexflow.com" },
      field_changes: { priority: { old: "low", new: "medium" } },
      old_values: { priority: "low" },
      new_values: { priority: "medium" },
    },
  ],
};

// Funções mock para desenvolvimento
const getMockHistoryByTaskId = (taskId: string): TaskHistoryEntry[] => {
  // Primeiro, tentar buscar do arquivo MockTaskHistoryData.js
  const historyFromFile = getHistoryFromMockFile(taskId);
  if (historyFromFile && historyFromFile.length > 0) {
    return historyFromFile;
  }

  // Segundo, tentar buscar o histórico do MockTaskData.js
  const task = mockTasks.find((t) => t.id === taskId);
  if (task && task.history && task.history.length > 0) {
    return task.history;
  }

  // Se não encontrar em nenhum lugar, usar o histórico hardcoded
  return (
    mockHistoryData[taskId] || [
      {
        id: `history-${taskId}-1`,
        task_id: taskId,
        user_id: "user-1",
        action_type: "created",
        description: `Tarefa criada`,
        created_at: new Date().toISOString(),
        user: {
          name: "Sistema",
          email: "sistema@nexflow.com",
        },
      },
    ]
  );
};

const getMockStatsByTaskId = (taskId: string) => {
  // Primeiro, tentar buscar do arquivo MockTaskHistoryData.js
  const statsFromFile = getStatsFromMockFile(taskId);
  if (statsFromFile) {
    return {
      totalEntries: statsFromFile.totalEntries,
      lastChange: statsFromFile.lastChange,
      actionCounts: statsFromFile.actionCounts,
    };
  }

  // Segundo, tentar buscar o histórico do MockTaskData.js
  const task = mockTasks.find((t) => t.id === taskId);
  let history = [];

  if (task && task.history && task.history.length > 0) {
    history = task.history;
  } else {
    history = mockHistoryData[taskId] || [];
  }

  if (history.length === 0) {
    return {
      totalEntries: 1,
      lastChange: {
        created_at: new Date().toISOString(),
        description: "Tarefa criada",
        action_type: "created",
      },
      actionCounts: {
        created: 1,
        updated: 0,
        status_changed: 0,
        assigned: 0,
        deleted: 0,
      },
    };
  }

  // Contar ações por tipo
  const actionCounts = history.reduce((counts, entry) => {
    counts[entry.action_type] = (counts[entry.action_type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  // Última mudança
  const sortedHistory = history.sort((a, b) => {
    try {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
      return dateB.getTime() - dateA.getTime();
    } catch {
      return 0;
    }
  });

  const lastEntry = sortedHistory[0];
  const lastChange = lastEntry
    ? {
        created_at: lastEntry.created_at,
        description: lastEntry.description,
        action_type: lastEntry.action_type,
      }
    : {
        created_at: new Date().toISOString(),
        description: "Tarefa criada",
        action_type: "created",
      };

  return {
    totalEntries: history.length,
    lastChange,
    actionCounts: {
      created: actionCounts.created || 0,
      updated: actionCounts.updated || 0,
      status_changed: actionCounts.status_changed || 0,
      assigned: actionCounts.assigned || 0,
      deleted: actionCounts.deleted || 0,
    },
  };
};

// Hook para buscar histórico de uma tarefa
export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: ["task-history", taskId],
    queryFn: async (): Promise<TaskHistoryEntry[]> => {
      if (!taskId) return [];

      // Usar dados mock se configurado
      if (USE_MOCK_DATA) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simular delay de rede
          return getMockHistoryByTaskId(taskId);
        } catch (error) {
          console.error("Erro ao buscar histórico mock:", error);
          return [];
        }
      }

      // Dados reais do Supabase
      try {
        const collaborator = await getCurrentUserData();

        const { data, error } = await supabase
          .from("task_history")
          .select(
            `
            *,
            user:auth.users!task_history_user_id_fkey (
              email
            )
          `
          )
          .eq("task_id", taskId)
          .eq("client_id", collaborator.client_id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar histórico da tarefa:", error);
          throw error;
        }

        // Mapear dados do usuário
        return (data || []).map((entry) => ({
          ...entry,
          user: entry.user
            ? {
                email: entry.user.email,
                name: entry.user.email?.split("@")[0] || "Usuário",
                avatar_url: null,
              }
            : undefined,
        }));
      } catch (error) {
        console.error("Erro ao buscar histórico da tarefa:", error);
        return [];
      }
    },
    enabled: !!taskId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para adicionar entrada ao histórico
export function useAddTaskHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskHistoryMutationData) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const collaborator = await getCurrentUserData();

        const { data: historyEntry, error } = await supabase
          .from("task_history")
          .insert({
            task_id: data.taskId,
            user_id: user.id,
            action_type: data.actionType,
            description: data.description,
            field_changes: data.fieldChanges,
            old_values: data.oldValues,
            new_values: data.newValues,
            metadata: data.metadata,
            client_id: collaborator.client_id,
          })
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar entrada ao histórico:", error);
          throw error;
        }

        return historyEntry;
      } catch (error) {
        console.error("Erro ao adicionar entrada ao histórico:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar cache do histórico da tarefa
      queryClient.invalidateQueries(["task-history", variables.taskId]);
    },
    onError: (error) => {
      console.error("Erro na mutação de histórico:", error);
    },
  });
}

// Hook para buscar estatísticas do histórico
export function useTaskHistoryStats(taskId: string) {
  return useQuery({
    queryKey: ["task-history-stats", taskId],
    queryFn: async () => {
      if (!taskId) return null;

      // Usar dados mock se configurado
      if (USE_MOCK_DATA) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300)); // Simular delay de rede
          return getMockStatsByTaskId(taskId);
        } catch (error) {
          console.error("Erro ao buscar estatísticas mock:", error);
          return null;
        }
      }

      // Dados reais do Supabase
      try {
        const collaborator = await getCurrentUserData();

        // Buscar contagem por tipo de ação
        const { data: actionCounts, error: countError } = await supabase
          .from("task_history")
          .select("action_type")
          .eq("task_id", taskId)
          .eq("client_id", collaborator.client_id);

        if (countError) throw countError;

        // Buscar última alteração
        const { data: lastChange, error: lastError } = await supabase
          .from("task_history")
          .select("created_at, description, action_type")
          .eq("task_id", taskId)
          .eq("client_id", collaborator.client_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (lastError && lastError.code !== "PGRST116") throw lastError;

        const stats = (actionCounts || []).reduce((acc, entry) => {
          acc[entry.action_type] = (acc[entry.action_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalEntries: actionCounts?.length || 0,
          actionCounts: stats,
          lastChange: lastChange || null,
        };
      } catch (error) {
        console.error("Erro ao buscar estatísticas do histórico:", error);
        return null;
      }
    },
    enabled: !!taskId,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Função helper para formatar mudanças de campo
export function formatFieldChange(
  fieldName: string,
  oldValue: any,
  newValue: any
): string {
  const fieldLabels: Record<string, string> = {
    title: "Título",
    description: "Descrição",
    completed: "Status",
    assigned_to: "Responsável",
    due_date: "Data de vencimento",
    priority: "Prioridade",
    status: "Status",
  };

  const label = fieldLabels[fieldName] || fieldName;

  // Formatação específica por tipo de campo
  if (fieldName === "completed") {
    return `${label}: ${oldValue ? "Concluída" : "Pendente"} → ${
      newValue ? "Concluída" : "Pendente"
    }`;
  }

  if (fieldName === "due_date") {
    const formatSafeDate = (dateValue: any): string => {
      if (!dateValue) return "Não definida";
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "Data inválida";
        return date.toLocaleDateString("pt-BR");
      } catch {
        return "Data inválida";
      }
    };

    const oldDate = formatSafeDate(oldValue);
    const newDate = formatSafeDate(newValue);
    return `${label}: ${oldDate} → ${newDate}`;
  }

  if (fieldName === "priority") {
    const priorities: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
    };
    return `${label}: ${priorities[oldValue] || oldValue} → ${
      priorities[newValue] || newValue
    }`;
  }

  // Formatação padrão
  const oldStr = oldValue || "Vazio";
  const newStr = newValue || "Vazio";
  return `${label}: ${oldStr} → ${newStr}`;
}

// Função helper para obter ícone e cor baseado no tipo de ação
export function getActionConfig(actionType: TaskHistoryEntry["action_type"]) {
  const configs = {
    created: {
      icon: "Plus",
      color: "text-green-600",
      bgColor: "bg-green-50",
      label: "Criada",
    },
    updated: {
      icon: "Edit",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      label: "Atualizada",
    },
    status_changed: {
      icon: "CheckCircle",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      label: "Status alterado",
    },
    assigned: {
      icon: "User",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      label: "Atribuída",
    },
    deleted: {
      icon: "Trash2",
      color: "text-red-600",
      bgColor: "bg-red-50",
      label: "Excluída",
    },
  };

  return (
    configs[actionType] || {
      icon: "Clock",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      label: "Alteração",
    }
  );
}

// Função utilitária para adicionar entrada ao histórico automaticamente
export function addTaskHistoryEntry(
  taskId: string,
  actionType: TaskHistoryEntry["action_type"],
  description: string,
  fieldChanges?: any,
  oldValues?: any,
  newValues?: any,
  metadata?: any,
  userName: string = "Sistema",
  userEmail: string = "sistema@nexflow.com"
) {
  // Em ambiente de desenvolvimento, podemos adicionar ao MockTaskData
  if (USE_MOCK_DATA) {
    const task = mockTasks.find((t) => t.id === taskId);
    if (task) {
      if (!task.history) {
        task.history = [];
      }

      const newEntry: TaskHistoryEntry = {
        id: `history-${taskId}-${Date.now()}`,
        task_id: taskId,
        user_id: `user-${Date.now()}`,
        action_type: actionType,
        description,
        created_at: new Date().toISOString(),
        user: { name: userName, email: userEmail },
        field_changes: fieldChanges,
        old_values: oldValues,
        new_values: newValues,
        metadata,
      };

      task.history.unshift(newEntry); // Adicionar no início (mais recente primeiro)
      console.log(`📝 Histórico adicionado para ${taskId}:`, description);
    }
  }
}

// Hook para registrar mudanças de status automaticamente
export function useTaskStatusChange() {
  return {
    logStatusChange: (
      taskId: string,
      oldStatus: string,
      newStatus: string,
      userName?: string
    ) => {
      const statusLabels = {
        pending: "A Fazer",
        in_progress: "Em Andamento",
        completed: "Concluído",
        cancelled: "Cancelado",
      };

      const oldLabel =
        statusLabels[oldStatus as keyof typeof statusLabels] || oldStatus;
      const newLabel =
        statusLabels[newStatus as keyof typeof statusLabels] || newStatus;

      addTaskHistoryEntry(
        taskId,
        "status_changed",
        `Status alterado de "${oldLabel}" para "${newLabel}"`,
        { status: { old: oldStatus, new: newStatus } },
        { status: oldStatus },
        { status: newStatus },
        { timestamp: new Date().toISOString() },
        userName
      );
    },
  };
}

// Hook para registrar mudanças de prioridade
export function useTaskPriorityChange() {
  return {
    logPriorityChange: (
      taskId: string,
      oldPriority: string,
      newPriority: string,
      userName?: string
    ) => {
      const priorityLabels = {
        low: "Baixa",
        medium: "Média",
        high: "Alta",
      };

      const oldLabel =
        priorityLabels[oldPriority as keyof typeof priorityLabels] ||
        oldPriority;
      const newLabel =
        priorityLabels[newPriority as keyof typeof priorityLabels] ||
        newPriority;

      addTaskHistoryEntry(
        taskId,
        "updated",
        `Prioridade alterada de "${oldLabel}" para "${newLabel}"`,
        { priority: { old: oldPriority, new: newPriority } },
        { priority: oldPriority },
        { priority: newPriority },
        { timestamp: new Date().toISOString() },
        userName
      );
    },
  };
}

// Hook para registrar atribuição de tarefas
export function useTaskAssignment() {
  return {
    logAssignment: (
      taskId: string,
      oldAssignee: string | null,
      newAssignee: string,
      userName?: string
    ) => {
      const description = oldAssignee
        ? `Tarefa reatribuída de "${oldAssignee}" para "${newAssignee}"`
        : `Tarefa atribuída para "${newAssignee}"`;

      addTaskHistoryEntry(
        taskId,
        "assigned",
        description,
        { assigned_to: { old: oldAssignee, new: newAssignee } },
        { assigned_to: oldAssignee },
        { assigned_to: newAssignee },
        { timestamp: new Date().toISOString() },
        userName
      );
    },
  };
}
