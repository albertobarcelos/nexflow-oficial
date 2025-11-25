import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import {
  FlowAccessRole,
  NexflowFlowAccess,
  NexflowStepVisibility,
} from "@/types/nexflow";

type FlowAccessRow = Database["nexflow"]["Tables"]["flow_access"]["Row"];
type StepVisibilityRow =
  Database["nexflow"]["Tables"]["step_visibility"]["Row"];

const mapAccessRow = (row: FlowAccessRow): NexflowFlowAccess => ({
  id: row.id,
  flowId: row.flow_id,
  userId: row.user_id,
  role: row.role,
});

const mapVisibilityRow = (
  row: StepVisibilityRow
): NexflowStepVisibility => ({
  id: row.id,
  stepId: row.step_id,
  userId: row.user_id,
  canView: row.can_view ?? true,
  canEditFields: row.can_edit_fields ?? false,
});

export function useNexflowFlowAccess(flowId?: string) {
  return useQuery({
    queryKey: ["nexflow", "permissions", "access", flowId],
    enabled: Boolean(flowId),
    queryFn: async (): Promise<NexflowFlowAccess[]> => {
      if (!flowId) {
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("flow_access")
        .select("*")
        .eq("flow_id", flowId);

      if (error || !data) {
        console.error("Erro ao carregar permissões globais do flow:", error);
        return [];
      }

      return data.map(mapAccessRow);
    },
  });
}

export function useSaveNexflowFlowAccess(flowId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "permissions", "access", flowId];

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: FlowAccessRole;
    }) => {
      if (!flowId) {
        throw new Error("Flow não informado.");
      }

      const { error } = await nexflowClient()
        .from("flow_access")
        .upsert(
          {
            flow_id: flowId,
            user_id: userId,
            role,
          },
          { onConflict: "flow_id,user_id" }
        );

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousAccess =
        queryClient.getQueryData<NexflowFlowAccess[]>(queryKey) ?? [];

      if (!flowId) {
        return { previousAccess };
      }

      const existingIndex = previousAccess.findIndex(
        (access) => access.userId === userId
      );
      let nextState: NexflowFlowAccess[];

      if (existingIndex >= 0) {
        nextState = previousAccess.map((access) =>
          access.userId === userId ? { ...access, role } : access
        );
      } else {
        nextState = [
          ...previousAccess,
          {
            id: `temp-access-${userId}`,
            flowId,
            userId,
            role,
          },
        ];
      }

      queryClient.setQueryData(queryKey, nextState);
      return { previousAccess };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAccess) {
        queryClient.setQueryData(queryKey, context.previousAccess);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Permissão salva com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar permissão. Tente novamente.");
    },
  });
}

export function useRemoveNexflowFlowAccess(flowId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "permissions", "access", flowId];

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!flowId) {
        throw new Error("Flow não informado.");
      }

      const { error } = await nexflowClient()
        .from("flow_access")
        .delete()
        .eq("flow_id", flowId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousAccess =
        queryClient.getQueryData<NexflowFlowAccess[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previousAccess.filter((access) => access.userId !== userId)
      );
      return { previousAccess };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAccess) {
        queryClient.setQueryData(queryKey, context.previousAccess);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Permissão removida com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover permissão. Tente novamente.");
    },
  });
}

export function useNexflowStepVisibility(flowId?: string) {
  return useQuery({
    queryKey: ["nexflow", "permissions", "visibility", flowId],
    enabled: Boolean(flowId),
    queryFn: async (): Promise<NexflowStepVisibility[]> => {
      if (!flowId) {
        return [];
      }

      const client = nexflowClient();

      const { data: steps, error: stepsError } = await client
        .from("steps")
        .select("id")
        .eq("flow_id", flowId);

      if (stepsError || !steps || steps.length === 0) {
        return [];
      }

      const stepIds = steps.map((step) => step.id);
      const { data, error } = await client
        .from("step_visibility")
        .select("*")
        .in("step_id", stepIds);

      if (error || !data) {
        console.error("Erro ao carregar visibilidade de etapas:", error);
        return [];
      }

      return data.map(mapVisibilityRow);
    },
  });
}

export interface StepVisibilityUpdate {
  userId: string;
  stepId: string;
  canView: boolean;
  canEditFields?: boolean;
}

export function useSaveNexflowStepVisibility(flowId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "permissions", "visibility", flowId];

  return useMutation({
    mutationFn: async ({
      updates,
    }: {
      updates: StepVisibilityUpdate[];
    }) => {
      if (updates.length === 0) {
        return;
      }

      await Promise.all(
        updates.map((update) =>
          nexflowClient()
            .from("step_visibility")
            .upsert(
              {
                step_id: update.stepId,
                user_id: update.userId,
                can_view: update.canView,
                can_edit_fields: update.canEditFields ?? false,
              },
              { onConflict: "step_id,user_id" }
            )
        )
      );
    },
    onMutate: async ({ updates }: { updates: StepVisibilityUpdate[] }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousVisibility =
        queryClient.getQueryData<NexflowStepVisibility[]>(queryKey) ?? [];

      const draft = [...previousVisibility];

      updates.forEach((update) => {
        const idx = draft.findIndex(
          (entry) =>
            entry.userId === update.userId && entry.stepId === update.stepId
        );

        if (idx >= 0) {
          draft[idx] = {
            ...draft[idx],
            canView: update.canView,
            canEditFields:
              typeof update.canEditFields !== "undefined"
                ? update.canEditFields
                : draft[idx].canEditFields,
          };
        } else {
          draft.push({
            id: `temp-visibility-${update.userId}-${update.stepId}`,
            stepId: update.stepId,
            userId: update.userId,
            canView: update.canView,
            canEditFields: update.canEditFields ?? false,
          });
        }
      });

      queryClient.setQueryData(queryKey, draft);
      return { previousVisibility };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousVisibility) {
        queryClient.setQueryData(queryKey, context.previousVisibility);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Visibilidade atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar visibilidade. Tente novamente.");
    },
  });
}

