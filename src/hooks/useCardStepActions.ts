import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { CardStepAction, CardStepActionStatus } from "@/types/nexflow";

type CardStepActionRow = Database["nexflow"]["Tables"]["card_step_actions"]["Row"];

const mapCardStepActionRow = (row: CardStepActionRow): CardStepAction => {
  return {
    id: row.id,
    cardId: row.card_id,
    stepActionId: row.step_action_id,
    stepId: row.step_id,
    status: row.status as CardStepActionStatus,
    scheduledDate: row.scheduled_date,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    notes: row.notes,
    executionData: (row.execution_data as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

interface UpdateCardStepActionInput {
  id: string;
  status?: CardStepActionStatus;
  notes?: string | null;
  executionData?: Record<string, unknown>;
  completedBy?: string | null;
}

interface CompleteCardStepActionInput {
  id: string;
  notes?: string;
  executionData?: Record<string, unknown>;
}

export function useCardStepActions(cardId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "card_step_actions", cardId];

  const cardStepActionsQuery = useQuery({
    queryKey,
    enabled: Boolean(cardId),
    queryFn: async (): Promise<CardStepAction[]> => {
      if (!cardId) {
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("card_step_actions")
        .select("*")
        .eq("card_id", cardId)
        .order("scheduled_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error || !data) {
        console.error("Erro ao carregar processos vinculados ao card:", error);
        return [];
      }

      return data.map(mapCardStepActionRow);
    },
    staleTime: 1000 * 10,
  });

  const updateCardStepActionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCardStepActionInput): Promise<CardStepAction> => {
      const payload: Partial<Database["nexflow"]["Tables"]["card_step_actions"]["Update"]> = {
        updated_at: new Date().toISOString(),
      };

      if (typeof updates.status !== "undefined") {
        payload.status = updates.status;
        if (updates.status === "completed") {
          payload.completed_at = new Date().toISOString();
          if (updates.completedBy) {
            payload.completed_by = updates.completedBy;
          }
        } else if (updates.status !== "completed" && updates.status !== "in_progress") {
          payload.completed_at = null;
          payload.completed_by = null;
        }
      }

      if (typeof updates.notes !== "undefined") {
        payload.notes = updates.notes;
      }

      if (typeof updates.executionData !== "undefined") {
        payload.execution_data = updates.executionData;
      }

      if (typeof updates.completedBy !== "undefined") {
        payload.completed_by = updates.completedBy;
      }

      const { data, error } = await nexflowClient()
        .from("card_step_actions")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao atualizar processo vinculado.");
      }

      return mapCardStepActionRow(data);
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousActions = queryClient.getQueryData<CardStepAction[]>(queryKey) ?? [];

      queryClient.setQueryData<CardStepAction[]>(
        queryKey,
        previousActions.map((action) =>
          action.id === id
            ? {
                ...action,
                ...updates,
                updatedAt: new Date().toISOString(),
                completedAt:
                  updates.status === "completed"
                    ? new Date().toISOString()
                    : updates.status !== "completed" && updates.status !== "in_progress"
                      ? null
                      : action.completedAt,
                completedBy:
                  updates.status === "completed" && updates.completedBy
                    ? updates.completedBy
                    : updates.status !== "completed" && updates.status !== "in_progress"
                      ? null
                      : action.completedBy,
              }
            : action
        )
      );

      return { previousActions };
    },
    onError: (error, _variables, context) => {
      if (context?.previousActions) {
        queryClient.setQueryData(queryKey, context.previousActions);
      }
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar processo. Tente novamente."
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Processo atualizado com sucesso!");
    },
  });

  const completeCardStepActionMutation = useMutation({
    mutationFn: async ({ id, notes, executionData }: CompleteCardStepActionInput): Promise<CardStepAction> => {
      const { data: userData } = await supabase.auth.getUser();
      const completedBy = userData?.user?.id ?? null;

      const payload: Database["nexflow"]["Tables"]["card_step_actions"]["Update"] = {
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        payload.notes = notes;
      }

      if (executionData) {
        payload.execution_data = executionData;
      }

      const { data, error } = await nexflowClient()
        .from("card_step_actions")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao completar processo.");
      }

      return mapCardStepActionRow(data);
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousActions = queryClient.getQueryData<CardStepAction[]>(queryKey) ?? [];

      queryClient.setQueryData<CardStepAction[]>(
        queryKey,
        previousActions.map((action) =>
          action.id === id
            ? {
                ...action,
                status: "completed" as CardStepActionStatus,
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : action
        )
      );

      return { previousActions };
    },
    onError: (error, _variables, context) => {
      if (context?.previousActions) {
        queryClient.setQueryData(queryKey, context.previousActions);
      }
      toast.error(
        error instanceof Error ? error.message : "Erro ao completar processo. Tente novamente."
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Processo completado com sucesso!");
    },
  });

  return {
    cardStepActions: cardStepActionsQuery.data ?? [],
    isLoading: cardStepActionsQuery.isLoading,
    isError: cardStepActionsQuery.isError,
    refetch: cardStepActionsQuery.refetch,
    updateCardStepAction: updateCardStepActionMutation.mutateAsync,
    isUpdating: updateCardStepActionMutation.isPending,
    completeCardStepAction: completeCardStepActionMutation.mutateAsync,
    isCompleting: completeCardStepActionMutation.isPending,
  };
}

