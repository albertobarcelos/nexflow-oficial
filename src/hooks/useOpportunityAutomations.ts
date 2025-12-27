import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { Database } from "@/types/database";

type OpportunityAutomationRow = Database["nexflow"]["Tables"]["opportunity_automations"]["Row"];
type OpportunityAutomationInsert = Database["nexflow"]["Tables"]["opportunity_automations"]["Insert"];
type OpportunityAutomationUpdate = Database["nexflow"]["Tables"]["opportunity_automations"]["Update"];

export interface OpportunityAutomation {
  id: string;
  clientId: string;
  isActive: boolean;
  targetFlowId: string;
  targetStepId: string;
  triggerConditions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const mapAutomationRow = (row: OpportunityAutomationRow): OpportunityAutomation => ({
  id: row.id,
  clientId: row.client_id,
  isActive: row.is_active,
  targetFlowId: row.target_flow_id,
  targetStepId: row.target_step_id,
  triggerConditions: (row.trigger_conditions as Record<string, unknown>) ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useOpportunityAutomations() {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "opportunity-automations"];

  const automationsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<OpportunityAutomation[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("opportunity_automations")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar automações:", error);
        throw error;
      }

      return (data || []).map(mapAutomationRow);
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (input: {
      targetFlowId: string;
      targetStepId: string;
      isActive?: boolean;
      triggerConditions?: Record<string, unknown>;
    }) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const payload: OpportunityAutomationInsert = {
        client_id: clientId,
        target_flow_id: input.targetFlowId,
        target_step_id: input.targetStepId,
        is_active: input.isActive ?? true,
        trigger_conditions: (input.triggerConditions ?? {}) as Database["nexflow"]["Tables"]["opportunity_automations"]["Row"]["trigger_conditions"],
      };

      const { data, error } = await nexflowClient()
        .from("opportunity_automations")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar regra de automação.");
      }

      return mapAutomationRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Regra de automação criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar regra de automação: ${error.message}`);
    },
  });

  const updateAutomationMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      isActive?: boolean;
      targetFlowId?: string;
      targetStepId?: string;
      triggerConditions?: Record<string, unknown>;
    }) => {
      const payload: OpportunityAutomationUpdate = {};

      if (input.isActive !== undefined) {
        payload.is_active = input.isActive;
      }
      if (input.targetFlowId) {
        payload.target_flow_id = input.targetFlowId;
      }
      if (input.targetStepId) {
        payload.target_step_id = input.targetStepId;
      }
      if (input.triggerConditions !== undefined) {
        payload.trigger_conditions = input.triggerConditions as Database["nexflow"]["Tables"]["opportunity_automations"]["Row"]["trigger_conditions"];
      }

      const { data, error } = await nexflowClient()
        .from("opportunity_automations")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao atualizar regra de automação.");
      }

      return mapAutomationRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Regra de automação atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar regra de automação: ${error.message}`);
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await nexflowClient()
        .from("opportunity_automations")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Regra de automação removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover regra de automação: ${error.message}`);
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

