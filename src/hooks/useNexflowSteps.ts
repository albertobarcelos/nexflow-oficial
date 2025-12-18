import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, supabase } from "@/lib/supabase";
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
  isCompletionStep: Boolean(row.is_completion_step),
  createdAt: row.created_at,
  responsibleUserId: row.responsible_user_id ?? null,
  responsibleTeamId: row.responsible_team_id ?? null,
});

interface CreateStepInput {
  title: string;
  color: string;
  position?: number;
  isCompletionStep?: boolean;
}

interface UpdateStepInput {
  id: string;
  title?: string;
  color?: string;
  position?: number;
  isCompletionStep?: boolean;
  responsibleUserId?: string | null;
  responsibleTeamId?: string | null;
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
  });

  const createStepMutation = useMutation<NexflowStep, Error, CreateStepInput>({
    mutationFn: async ({ title, color, position, isCompletionStep }: CreateStepInput) => {
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
        })
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar etapa.");
      }

      return mapStepRow(data);
    },
    onMutate: async ({ title, color, position, isCompletionStep }) => {
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
        isCompletionStep: isCompletionStep ?? false,
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
    mutationFn: async ({ id, title, color, position, isCompletionStep, responsibleUserId, responsibleTeamId }: UpdateStepInput) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowSteps.ts:146',message:'updateStepMutation called',data:{id,responsibleUserId,responsibleTeamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const payload: Partial<StepRow> = {};
      if (typeof title !== "undefined") payload.title = title;
      if (typeof color !== "undefined") payload.color = color;
      if (typeof position !== "undefined") payload.position = position;
      if (typeof isCompletionStep !== "undefined") payload.is_completion_step = isCompletionStep;
      // Garantir que null seja explicitamente enviado para limpar o campo
      if (typeof responsibleUserId !== "undefined") {
        payload.responsible_user_id = responsibleUserId; // Inclui null
      }
      if (typeof responsibleTeamId !== "undefined") {
        payload.responsible_team_id = responsibleTeamId; // Inclui null
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowSteps.ts:153',message:'Payload before update',data:{payload,hasResponsibleTeamId:typeof responsibleTeamId !== 'undefined',responsibleTeamIdValue:responsibleTeamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const { data: updatedStep, error } = await nexflowClient()
        .from("steps")
        .update(payload)
        .eq("id", id)
        .select("responsible_user_id, responsible_team_id")
        .single();

      // #region agent log
      if (error) {
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowSteps.ts:160',message:'Error updating step',data:{error:error.message,code:error.code,id,payload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      } else {
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowSteps.ts:162',message:'Step updated successfully',data:{id,responsibleTeamId,updatedResponsibleTeamId:updatedStep?.responsible_team_id,updatedResponsibleUserId:updatedStep?.responsible_user_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      }
      // #endregion

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ id, title, color, position, isCompletionStep, responsibleUserId, responsibleTeamId }) => {
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
    onError: (_error, _variables, context) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Invalidar também o cache do useNexflowFlow para atualizar os steps no board
      if (flowId) {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow", flowId] });
      } else {
        // Se não tiver flowId, invalidar todas as queries de flow
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow"] });
      }
      toast.success("Etapa atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar etapa. Tente novamente.");
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowSteps.ts:241',message:'Calling delete-nexflow-step Edge Function',data:{stepId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const { data, error } = await supabase.functions.invoke('delete-nexflow-step', {
        body: { stepId },
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowSteps.ts:247',message:'Edge Function response',data:{hasError:!!error,errorMessage:error?.message,errorContext:error?.context,hasData:!!data,data,stepId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (error) {
        // Se houver data mesmo com error, pode conter a mensagem de erro
        const errorMessage = data?.error || error.message || "Falha ao excluir etapa.";
        throw new Error(errorMessage);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Falha ao excluir etapa.");
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
    onError: (error, _variables, context) => {
      if (context?.previousSteps) {
        queryClient.setQueryData(queryKey, context.previousSteps);
      }
      toast.error(error.message || "Erro ao remover etapa. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Invalidar também o cache do useNexflowFlow para atualizar os steps no board
      if (flowId) {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow", flowId] });
      } else {
        // Se não tiver flowId, invalidar todas as queries de flow
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow"] });
      }
      toast.success("Etapa removida com sucesso!");
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

