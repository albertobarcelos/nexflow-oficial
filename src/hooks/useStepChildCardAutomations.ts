import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { Database } from "@/types/database";
import { StepChildCardAutomation } from "@/types/nexflow";

type StepChildCardAutomationRow = Database["public"]["Tables"]["step_child_card_automations"]["Row"];
type StepChildCardAutomationInsert = Database["public"]["Tables"]["step_child_card_automations"]["Insert"];
type StepChildCardAutomationUpdate = Database["public"]["Tables"]["step_child_card_automations"]["Update"];

const mapAutomationRow = (row: StepChildCardAutomationRow): StepChildCardAutomation => ({
  id: row.id,
  stepId: row.step_id,
  clientId: row.client_id,
  targetFlowId: row.target_flow_id,
  targetStepId: row.target_step_id,
  isActive: row.is_active,
  copyFieldValues: row.copy_field_values,
  copyAssignment: row.copy_assignment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useStepChildCardAutomations(stepId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "step-child-card-automations", stepId];

  const automationsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<StepChildCardAutomation[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return [];
      }

      let query = nexflowClient()
        .from("step_child_card_automations")
        .select("*")
        .eq("client_id", clientId);

      if (stepId) {
        query = query.eq("step_id", stepId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar automações de card filho:", error);
        throw error;
      }

      return (data || []).map(mapAutomationRow);
    },
    enabled: !!stepId || true,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (input: {
      stepId: string;
      targetFlowId: string;
      targetStepId: string;
      isActive?: boolean;
      copyFieldValues?: boolean;
      copyAssignment?: boolean;
    }) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const payload: StepChildCardAutomationInsert = {
        step_id: input.stepId,
        client_id: clientId,
        target_flow_id: input.targetFlowId,
        target_step_id: input.targetStepId,
        is_active: input.isActive ?? true,
        copy_field_values: input.copyFieldValues ?? false,
        copy_assignment: input.copyAssignment ?? false,
      };

      const { data, error } = await nexflowClient()
        .from("step_child_card_automations")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar automação de card filho.");
      }

      return mapAutomationRow(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "step-child-card-automations"] });
      queryClient.invalidateQueries({ queryKey: ["nexflow", "step-child-card-automations", variables.stepId] });
      toast.success("Automação de card filho criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar automação: ${error.message}`);
    },
  });

  const updateAutomationMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      isActive?: boolean;
      targetFlowId?: string;
      targetStepId?: string;
      copyFieldValues?: boolean;
      copyAssignment?: boolean;
    }) => {
      const payload: StepChildCardAutomationUpdate = {};

      if (input.isActive !== undefined) {
        payload.is_active = input.isActive;
      }
      if (input.targetFlowId) {
        payload.target_flow_id = input.targetFlowId;
      }
      if (input.targetStepId) {
        payload.target_step_id = input.targetStepId;
      }
      if (input.copyFieldValues !== undefined) {
        payload.copy_field_values = input.copyFieldValues;
      }
      if (input.copyAssignment !== undefined) {
        payload.copy_assignment = input.copyAssignment;
      }

      const { data, error } = await nexflowClient()
        .from("step_child_card_automations")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao atualizar automação de card filho.");
      }

      return mapAutomationRow(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "step-child-card-automations"] });
      queryClient.invalidateQueries({ queryKey: ["nexflow", "step-child-card-automations", data.stepId] });
      toast.success("Automação atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar automação: ${error.message}`);
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: string) => {
      // Buscar a automação antes de deletar para invalidar a query correta
      const { data: automation } = await nexflowClient()
        .from("step_child_card_automations")
        .select("step_id")
        .eq("id", id)
        .single();

      const { error } = await nexflowClient()
        .from("step_child_card_automations")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return automation?.step_id;
    },
    onSuccess: (stepId) => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "step-child-card-automations"] });
      if (stepId) {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "step-child-card-automations", stepId] });
      }
      toast.success("Automação removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover automação: ${error.message}`);
    },
  });

  return {
    automations: automationsQuery.data ?? [],
    isLoading: automationsQuery.isLoading,
    isError: automationsQuery.isError,
    error: automationsQuery.error,
    createAutomation: createAutomationMutation.mutateAsync,
    updateAutomation: updateAutomationMutation.mutateAsync,
    deleteAutomation: deleteAutomationMutation.mutateAsync,
    isCreating: createAutomationMutation.isPending,
    isUpdating: updateAutomationMutation.isPending,
    isDeleting: deleteAutomationMutation.isPending,
  };
}

