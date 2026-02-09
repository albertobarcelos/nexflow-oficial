import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, supabase } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import { Database } from "@/types/database";
import { NexflowStep, StepType } from "@/types/nexflow";

type StepRow = Database["public"]["Tables"]["steps"]["Row"];

const DEFAULT_STEP_COLOR = "#2563eb";

const mapStepRow = (row: StepRow): NexflowStep => ({
  id: row.id,
  flowId: row.flow_id,
  title: row.title,
  color: row.color ?? DEFAULT_STEP_COLOR,
  position: row.position,
  isCompletionStep: Boolean(row.is_completion_step),
  stepType: (row.step_type as StepType) ?? "standard",
  createdAt: row.created_at,
  responsibleUserId: row.responsible_user_id ?? null,
  responsibleTeamId: row.responsible_team_id ?? null,
});

interface CreateStepInput {
  title: string;
  color: string;
  position?: number;
  isCompletionStep?: boolean;
  stepType?: StepType;
  _meta?: { skipToasts?: boolean };
}

interface UpdateStepInput {
  id: string;
  title?: string;
  color?: string;
  position?: number;
  isCompletionStep?: boolean;
  stepType?: StepType;
  responsibleUserId?: string | null;
  responsibleTeamId?: string | null;
  _meta?: { skipToasts?: boolean };
}

interface ReorderStepsInput {
  updates: { id: string; position: number }[];
  _meta?: { skipToasts?: boolean };
}

/** Contexto opcional passado nas chamadas; skipToasts suprime toasts (ex.: builder). */
export type NexflowStepsMutationContext = { skipToasts?: boolean };

export function useNexflowSteps(flowId?: string) {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id) ?? null;
  const queryKey = ["nexflow", "steps", clientId, flowId];

  const stepsQuery = useQuery({
    queryKey,
    enabled: Boolean(flowId) && Boolean(clientId),
    queryFn: async (): Promise<NexflowStep[]> => {
      if (!flowId) {
        return [];
      }

      // Buscar diretamente da tabela (Flow Builder precisa ver TODAS as etapas para editar)
      const { data, error } = await nexflowClient()
        .from("steps")
        .select("*")
        .eq("flow_id", flowId)
        .order("position", { ascending: true });

      if (error || !data) {
        console.error("Erro ao carregar etapas do flow:", error);
        return [];
      }

      return data.map(mapStepRow);
    },
    refetchOnWindowFocus: false, // Fix: Disable auto refetch, rely on soft reload
    refetchOnMount: true, // Garantir refetch quando componente montar
  });

  type CreateStepContext = { previousSteps?: NexflowStep[] };
  const createStepMutation = useMutation<
    NexflowStep,
    Error,
    CreateStepInput,
    CreateStepContext
  >({
    mutationFn: async ({ title, color, position, isCompletionStep, stepType }) => {
      if (!flowId) {
        throw new Error("Flow não informado.");
      }

      let targetPosition = position;
      if (typeof targetPosition === "undefined") {
        const lastPosition =
          stepsQuery.data?.[stepsQuery.data.length - 1]?.position ?? 0;
        targetPosition = lastPosition + 1;
      }

      const { data, error } = await nexflowClient()
        .from("steps")
        .insert({
          flow_id: flowId,
          title,
          color,
          position: targetPosition,
          is_completion_step: isCompletionStep ?? false,
          step_type: stepType ?? "standard",
        })
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar etapa.");
      }

      return mapStepRow(data);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSteps = queryClient.getQueryData<NexflowStep[]>(queryKey) ?? [];
      if (!flowId) {
        return { previousSteps };
      }

      const { title, color, position, isCompletionStep, stepType } = variables;
      const provisionalPosition =
        position ??
        ((previousSteps[previousSteps.length - 1]?.position ?? 0) + 1);

      const optimisticStep: NexflowStep = {
        id: `temp-step-${Date.now()}`,
        flowId,
        title,
        color,
        position: provisionalPosition,
        isCompletionStep: isCompletionStep ?? false,
        stepType: stepType ?? "standard",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<NexflowStep[]>(queryKey, [
        ...previousSteps,
        optimisticStep,
      ]);

      return { previousSteps };
    },
    onError: (_err, variables, context: CreateStepContext | undefined) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
      if (!variables._meta?.skipToasts) {
        toast.error("Erro ao criar etapa. Tente novamente.");
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      if (!variables._meta?.skipToasts) {
        toast.success("Etapa criada com sucesso!");
      }
    },
  });

  type UpdateStepContext = { previousSteps?: NexflowStep[] };
  const updateStepMutation = useMutation<
    void,
    Error,
    UpdateStepInput,
    UpdateStepContext
  >({
    mutationFn: async ({ id, title, color, position, isCompletionStep, stepType, responsibleUserId, responsibleTeamId }) => {
      const payload: Partial<StepRow> = {};
      if (typeof title !== "undefined") payload.title = title;
      if (typeof color !== "undefined") payload.color = color;
      if (typeof position !== "undefined") payload.position = position;
      if (typeof isCompletionStep !== "undefined") payload.is_completion_step = isCompletionStep;
      if (typeof stepType !== "undefined") payload.step_type = stepType;
      // Garantir que null seja explicitamente enviado para limpar o campo
      if (typeof responsibleUserId !== "undefined") {
        payload.responsible_user_id = responsibleUserId; // Inclui null
      }
      if (typeof responsibleTeamId !== "undefined") {
        payload.responsible_team_id = responsibleTeamId; // Inclui null
      }

      const { data: updatedStep, error } = await nexflowClient()
        .from("steps")
        .update(payload)
        .eq("id", id)
        .select("responsible_user_id, responsible_team_id")
        .single();

      if (error) {
        throw error;
      }
    },
    onMutate: async (variables) => {
      const { id, title, color, position, isCompletionStep, stepType, responsibleUserId, responsibleTeamId } = variables;
      await queryClient.cancelQueries({ queryKey });
      const previousSteps = queryClient.getQueryData<NexflowStep[]>(queryKey) ?? [];

      queryClient.setQueryData<NexflowStep[]>(
        queryKey,
        previousSteps.map((step) =>
          step.id === id
            ? {
                ...step,
                title: typeof title !== "undefined" ? title : step.title,
                color: typeof color !== "undefined" ? color : step.color,
                position:
                  typeof position !== "undefined" ? position : step.position,
                isCompletionStep:
                  typeof isCompletionStep !== "undefined"
                    ? isCompletionStep
                    : step.isCompletionStep,
                stepType:
                  typeof stepType !== "undefined"
                    ? stepType
                    : step.stepType,
                responsibleUserId:
                  typeof responsibleUserId !== "undefined"
                    ? responsibleUserId
                    : step.responsibleUserId,
                responsibleTeamId:
                  typeof responsibleTeamId !== "undefined"
                    ? responsibleTeamId
                    : step.responsibleTeamId,
              }
            : step
        )
      );

      return { previousSteps };
    },
    onError: (_error, variables, context: UpdateStepContext | undefined) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
      if (!variables._meta?.skipToasts) {
        toast.error("Erro ao atualizar etapa. Tente novamente.");
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      if (flowId) {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow", flowId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow"] });
      }
      if (!variables._meta?.skipToasts) {
        toast.success("Etapa atualizada com sucesso!");
      }
    },
  });

  interface DeleteStepInput {
    stepId: string;
    _meta?: { skipToasts?: boolean };
  }
  type DeleteStepContext = { previousSteps?: NexflowStep[] };
  const deleteStepMutation = useMutation<void, Error, DeleteStepInput, DeleteStepContext>({
    mutationFn: async ({ stepId }) => {
      const { data, error } = await supabase.functions.invoke('delete-nexflow-step', {
        body: { stepId },
      });

      if (error) {
        const errorMessage = data?.error || error.message || "Falha ao excluir etapa.";
        throw new Error(errorMessage);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Falha ao excluir etapa.");
      }
    },
    onMutate: async ({ stepId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSteps = queryClient.getQueryData<NexflowStep[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previousSteps.filter((step) => step.id !== stepId)
      );
      return { previousSteps };
    },
    onError: (error, variables, context: DeleteStepContext | undefined) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
      if (!variables._meta?.skipToasts) {
        toast.error(error.message || "Erro ao remover etapa. Tente novamente.");
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      if (flowId) {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow", flowId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow"] });
      }
      if (!variables._meta?.skipToasts) {
        toast.success("Etapa removida com sucesso!");
      }
    },
  });

  type ReorderStepsContext = { previousSteps?: NexflowStep[] };
  const reorderStepsMutation = useMutation<void, Error, ReorderStepsInput, ReorderStepsContext>({
    mutationFn: async ({ updates }) => {
      await Promise.all(
        updates.map(({ id, position }) =>
          nexflowClient().from("steps").update({ position }).eq("id", id)
        )
      );
    },
    onMutate: async (variables) => {
      const { updates } = variables;
      await queryClient.cancelQueries({ queryKey });
      const previousSteps = queryClient.getQueryData<NexflowStep[]>(queryKey) ?? [];
      const updatedSteps = previousSteps.map((step) => {
        const newPosition = updates.find((item) => item.id === step.id)?.position;
        return newPosition ? { ...step, position: newPosition } : step;
      });
      queryClient.setQueryData(queryKey, updatedSteps);
      return { previousSteps };
    },
    onError: (_error, variables, context: ReorderStepsContext | undefined) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
      if (!variables._meta?.skipToasts) {
        toast.error("Erro ao reordenar etapas. Tente novamente.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Garantir que sempre retorne um array, nunca undefined
  const steps = Array.isArray(stepsQuery.data) ? stepsQuery.data : [];

  return {
    steps,
    isLoading: stepsQuery.isLoading,
    isError: stepsQuery.isError,
    refetch: stepsQuery.refetch,
    createStep: (input: Omit<CreateStepInput, "_meta">, options?: NexflowStepsMutationContext) =>
      createStepMutation.mutateAsync({ ...input, _meta: options }),
    isCreating: createStepMutation.isPending,
    updateStep: (input: Omit<UpdateStepInput, "_meta">, options?: NexflowStepsMutationContext) =>
      updateStepMutation.mutateAsync({ ...input, _meta: options }),
    isUpdating: updateStepMutation.isPending,
    deleteStep: (stepId: string, options?: NexflowStepsMutationContext) =>
      deleteStepMutation.mutateAsync({ stepId, _meta: options }),
    isDeleting: deleteStepMutation.isPending,
    reorderSteps: (input: Omit<ReorderStepsInput, "_meta">, options?: NexflowStepsMutationContext) =>
      reorderStepsMutation.mutateAsync({ ...input, _meta: options }),
    isReordering: reorderStepsMutation.isPending,
  };
}

