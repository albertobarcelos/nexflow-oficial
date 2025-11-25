import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { NexflowStep } from "@/types/nexflow";

type StepRow = Database["nexflow"]["Tables"]["steps"]["Row"];

const DEFAULT_STEP_COLOR = "#2563eb";

const mapStepRow = (row: StepRow): NexflowStep => ({
  id: row.id,
  flowId: row.flow_id,
  title: row.title,
  color: row.color ?? DEFAULT_STEP_COLOR,
  position: row.position,
  createdAt: row.created_at,
});

interface CreateStepInput {
  title: string;
  color: string;
  position?: number;
}

interface UpdateStepInput {
  id: string;
  title?: string;
  color?: string;
  position?: number;
}

interface ReorderStepsInput {
  updates: { id: string; position: number }[];
}

export function useNexflowSteps(flowId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "steps", flowId];

  const stepsQuery = useQuery({
    queryKey,
    enabled: Boolean(flowId),
    queryFn: async (): Promise<NexflowStep[]> => {
      if (!flowId) {
        return [];
      }

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
  });

  const createStepMutation = useMutation<NexflowStep, Error, CreateStepInput>({
    mutationFn: async ({ title, color, position }: CreateStepInput) => {
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
        })
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar etapa.");
      }

      return mapStepRow(data);
    },
    onMutate: async ({ title, color, position }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSteps = queryClient.getQueryData<NexflowStep[]>(queryKey) ?? [];
      if (!flowId) {
        return { previousSteps };
      }

      const provisionalPosition =
        position ??
        ((previousSteps[previousSteps.length - 1]?.position ?? 0) + 1);

      const optimisticStep: NexflowStep = {
        id: `temp-step-${Date.now()}`,
        flowId,
        title,
        color,
        position: provisionalPosition,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<NexflowStep[]>(queryKey, [
        ...previousSteps,
        optimisticStep,
      ]);

      return { previousSteps };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Etapa criada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar etapa. Tente novamente.");
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ id, title, color, position }: UpdateStepInput) => {
      const payload: Partial<StepRow> = {};
      if (typeof title !== "undefined") payload.title = title;
      if (typeof color !== "undefined") payload.color = color;
      if (typeof position !== "undefined") payload.position = position;

      const { error } = await nexflowClient()
        .from("steps")
        .update(payload)
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ id, title, color, position }) => {
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
              }
            : step
        )
      );

      return { previousSteps };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Etapa atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar etapa. Tente novamente.");
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await nexflowClient()
        .from("steps")
        .delete()
        .eq("id", stepId);

      if (error) {
        throw error;
      }
    },
    onMutate: async (stepId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSteps = queryClient.getQueryData<NexflowStep[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previousSteps.filter((step) => step.id !== stepId)
      );
      return { previousSteps };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Etapa removida com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover etapa. Tente novamente.");
    },
  });

  const reorderStepsMutation = useMutation({
    mutationFn: async ({ updates }: ReorderStepsInput) => {
      await Promise.all(
        updates.map(({ id, position }) =>
          nexflowClient().from("steps").update({ position }).eq("id", id)
        )
      );
    },
    onMutate: async ({ updates }: ReorderStepsInput) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSteps = queryClient.getQueryData<NexflowStep[]>(queryKey) ?? [];
      const updatedSteps = previousSteps.map((step) => {
        const newPosition = updates.find((item) => item.id === step.id)?.position;
        return newPosition ? { ...step, position: newPosition } : step;
      });
      queryClient.setQueryData(queryKey, updatedSteps);
      return { previousSteps };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("Erro ao reordenar etapas. Tente novamente.");
    },
  });

  return {
    steps: stepsQuery.data ?? [],
    isLoading: stepsQuery.isLoading,
    isError: stepsQuery.isError,
    refetch: stepsQuery.refetch,
    createStep: createStepMutation.mutateAsync,
    isCreating: createStepMutation.isPending,
    updateStep: updateStepMutation.mutateAsync,
    isUpdating: updateStepMutation.isPending,
    deleteStep: deleteStepMutation.mutateAsync,
    isDeleting: deleteStepMutation.isPending,
    reorderSteps: reorderStepsMutation.mutateAsync,
    isReordering: reorderStepsMutation.isPending,
  };
}

