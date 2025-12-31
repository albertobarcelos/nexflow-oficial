import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { NexflowStepAction, StepActionsByDay, ActionType, StepActionSettings } from "@/types/nexflow";

type StepActionRow = Database["nexflow"]["Tables"]["step_actions"]["Row"];

const mapStepActionRow = (row: StepActionRow): NexflowStepAction => {
  const settings = (row.settings as StepActionSettings) || {};
  
  return {
    id: row.id,
    stepId: row.step_id,
    dayOffset: row.day_offset ?? 1,
    position: row.position ?? 0,
    title: row.title,
    actionType: row.action_type as ActionType,
    description: row.description ?? null,
    scriptTemplate: row.script_template ?? null,
    checklistItems: row.checklist_items ?? [],
    isRequired: row.is_required ?? true,
    settings: {
      allowNotes: settings.allowNotes ?? true,
      requiredCompletion: settings.requiredCompletion ?? true,
      ...settings,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

interface CreateStepActionInput {
  stepId: string;
  dayOffset: number;
  title: string;
  actionType: ActionType;
  description?: string;
  scriptTemplate?: string;
  checklistItems?: string[];
  isRequired?: boolean;
  settings?: StepActionSettings;
  position?: number;
}

interface UpdateStepActionInput {
  id: string;
  dayOffset?: number;
  title?: string;
  actionType?: ActionType;
  description?: string;
  scriptTemplate?: string;
  checklistItems?: string[];
  isRequired?: boolean;
  settings?: StepActionSettings;
  position?: number;
}

interface ReorderStepActionsInput {
  updates: { id: string; position: number }[];
}

export function useStepActions(stepId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "step_actions", stepId];

  const stepActionsQuery = useQuery({
    queryKey,
    enabled: Boolean(stepId),
    queryFn: async (): Promise<NexflowStepAction[]> => {
      if (!stepId) {
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("step_actions")
        .select("*")
        .eq("step_id", stepId)
        .order("day_offset", { ascending: true })
        .order("position", { ascending: true });

      if (error || !data) {
        console.error("Erro ao carregar ações do step:", error);
        return [];
      }

      return data.map(mapStepActionRow);
    },
    staleTime: 1000 * 10,
  });

  // Agrupar ações por day_offset
  const actionsByDay: StepActionsByDay[] = (stepActionsQuery.data ?? []).reduce(
    (acc, action) => {
      const existingDay = acc.find((day) => day.dayOffset === action.dayOffset);
      if (existingDay) {
        existingDay.actions.push(action);
      } else {
        acc.push({ dayOffset: action.dayOffset, actions: [action] });
      }
      return acc;
    },
    [] as StepActionsByDay[]
  ).sort((a, b) => a.dayOffset - b.dayOffset);

  const createStepActionMutation = useMutation({
    mutationFn: async (input: CreateStepActionInput): Promise<NexflowStepAction> => {
      // Validar se a etapa permite processos (apenas standard)
      if (input.stepId) {
        const { data: stepData, error: stepError } = await nexflowClient()
          .from("steps")
          .select("step_type")
          .eq("id", input.stepId)
          .single();

        if (stepError) {
          throw new Error("Erro ao verificar tipo da etapa.");
        }

        if (stepData?.step_type && stepData.step_type !== "standard") {
          throw new Error(`Processos não podem ser adicionados em etapas do tipo "${stepData.step_type}". Apenas etapas do tipo "standard" podem ter processos.`);
        }
      }
      const { dayOffset, title, actionType, description, scriptTemplate, checklistItems, isRequired, settings, position } = input;

      // Validações
      if (actionType === "phone_call" || actionType === "linkedin_message" || actionType === "whatsapp") {
        if (!scriptTemplate || scriptTemplate.trim() === "") {
          throw new Error("Script template é obrigatório para este tipo de ação.");
        }
      }

      if (actionType === "email") {
        if (!scriptTemplate || scriptTemplate.trim() === "") {
          throw new Error("Corpo do email (script template) é obrigatório.");
        }
      }

      let targetPosition = position;
      if (typeof targetPosition === "undefined") {
        // Buscar última posição para o mesmo day_offset
        const existingActions = stepActionsQuery.data ?? [];
        const sameDayActions = existingActions.filter((a) => a.dayOffset === dayOffset);
        const lastPosition = sameDayActions.length > 0 
          ? Math.max(...sameDayActions.map((a) => a.position))
          : 0;
        targetPosition = lastPosition + 1;
      }

      const payload: Database["nexflow"]["Tables"]["step_actions"]["Insert"] = {
        step_id: input.stepId,
        day_offset: dayOffset,
        title,
        action_type: actionType,
        description: description || null,
        script_template: scriptTemplate || null,
        checklist_items: checklistItems || [],
        is_required: isRequired ?? true,
        settings: settings || {},
        position: targetPosition,
      };

      const { data, error } = await nexflowClient()
        .from("step_actions")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar ação.");
      }

      return mapStepActionRow(data);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previousActions = queryClient.getQueryData<NexflowStepAction[]>(queryKey) ?? [];

      const optimisticAction: NexflowStepAction = {
        id: `temp-action-${Date.now()}`,
        stepId: input.stepId,
        dayOffset: input.dayOffset,
        position: input.position ?? (previousActions.length + 1),
        title: input.title,
        actionType: input.actionType,
        description: input.description ?? null,
        scriptTemplate: input.scriptTemplate ?? null,
        checklistItems: input.checklistItems ?? [],
        isRequired: input.isRequired ?? true,
        settings: input.settings || { allowNotes: true, requiredCompletion: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<NexflowStepAction[]>(queryKey, [
        ...previousActions,
        optimisticAction,
      ]);

      return { previousActions };
    },
    onError: (error, _variables, context) => {
      if (context?.previousActions) {
        queryClient.setQueryData(queryKey, context.previousActions);
      }
      toast.error(error instanceof Error ? error.message : "Erro ao criar ação. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Ação criada com sucesso!");
    },
  });

  const updateStepActionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStepActionInput): Promise<NexflowStepAction> => {
      const { dayOffset, title, actionType, description, scriptTemplate, checklistItems, isRequired, settings, position } = updates;

      // Validações
      if (actionType === "phone_call" || actionType === "linkedin_message" || actionType === "whatsapp") {
        if (!scriptTemplate || scriptTemplate.trim() === "") {
          throw new Error("Script template é obrigatório para este tipo de ação.");
        }
      }

      if (actionType === "email") {
        if (!scriptTemplate || scriptTemplate.trim() === "") {
          throw new Error("Corpo do email (script template) é obrigatório.");
        }
      }

      const payload: Partial<Database["nexflow"]["Tables"]["step_actions"]["Update"]> = {};
      if (typeof dayOffset !== "undefined") payload.day_offset = dayOffset;
      if (typeof title !== "undefined") payload.title = title;
      if (typeof actionType !== "undefined") payload.action_type = actionType;
      if (typeof description !== "undefined") payload.description = description || null;
      if (typeof scriptTemplate !== "undefined") payload.script_template = scriptTemplate || null;
      if (typeof checklistItems !== "undefined") payload.checklist_items = checklistItems || [];
      if (typeof isRequired !== "undefined") payload.is_required = isRequired;
      if (typeof settings !== "undefined") payload.settings = settings;
      if (typeof position !== "undefined") payload.position = position;

      const { data, error } = await nexflowClient()
        .from("step_actions")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao atualizar ação.");
      }

      return mapStepActionRow(data);
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousActions = queryClient.getQueryData<NexflowStepAction[]>(queryKey) ?? [];

      queryClient.setQueryData<NexflowStepAction[]>(
        queryKey,
        previousActions.map((action) =>
          action.id === id
            ? {
                ...action,
                ...updates,
                settings: updates.settings ?? action.settings,
                checklistItems: updates.checklistItems ?? action.checklistItems,
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
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar ação. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Ação atualizada com sucesso!");
    },
  });

  const deleteStepActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await nexflowClient()
        .from("step_actions")
        .delete()
        .eq("id", actionId);

      if (error) {
        throw error;
      }
    },
    onMutate: async (actionId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousActions = queryClient.getQueryData<NexflowStepAction[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previousActions.filter((action) => action.id !== actionId)
      );
      return { previousActions };
    },
    onError: (error, _variables, context) => {
      if (context?.previousActions) {
        queryClient.setQueryData(queryKey, context.previousActions);
      }
      toast.error("Erro ao remover ação. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Ação removida com sucesso!");
    },
  });

  const reorderStepActionsMutation = useMutation({
    mutationFn: async ({ updates }: ReorderStepActionsInput) => {
      await Promise.all(
        updates.map(({ id, position }) =>
          nexflowClient().from("step_actions").update({ position }).eq("id", id)
        )
      );
    },
    onMutate: async ({ updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousActions = queryClient.getQueryData<NexflowStepAction[]>(queryKey) ?? [];
      const updatedActions = previousActions.map((action) => {
        const newPosition = updates.find((item) => item.id === action.id)?.position;
        return newPosition !== undefined ? { ...action, position: newPosition } : action;
      });
      queryClient.setQueryData(queryKey, updatedActions);
      return { previousActions };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousActions) {
        queryClient.setQueryData(queryKey, context.previousActions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    stepActions: stepActionsQuery.data ?? [],
    actionsByDay,
    isLoading: stepActionsQuery.isLoading,
    isError: stepActionsQuery.isError,
    refetch: stepActionsQuery.refetch,
    createStepAction: createStepActionMutation.mutateAsync,
    isCreating: createStepActionMutation.isPending,
    updateStepAction: updateStepActionMutation.mutateAsync,
    isUpdating: updateStepActionMutation.isPending,
    deleteStepAction: deleteStepActionMutation.mutateAsync,
    isDeleting: deleteStepActionMutation.isPending,
    reorderStepActions: reorderStepActionsMutation.mutateAsync,
    isReordering: reorderStepActionsMutation.isPending,
  };
}

