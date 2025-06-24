import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";
import {
  getMockHistoryByTaskId,
  getMockStatsByTaskId,
} from "@/components/crm/tasks/MockTaskHistoryData";

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
    const oldDate = oldValue
      ? new Date(oldValue).toLocaleDateString("pt-BR")
      : "Não definida";
    const newDate = newValue
      ? new Date(newValue).toLocaleDateString("pt-BR")
      : "Não definida";
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
