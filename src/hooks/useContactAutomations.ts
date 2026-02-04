import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";

// Tipos temporários até a tabela ser adicionada aos tipos gerados
interface ContactAutomationRow {
  id: string;
  client_id: string;
  is_active: boolean;
  automation_type: string | null;
  target_flow_id: string;
  target_step_id: string;
  trigger_conditions: unknown;
  created_at: string;
  updated_at: string;
}

interface ContactAutomationInsert {
  client_id: string;
  is_active?: boolean;
  automation_type?: string;
  target_flow_id: string;
  target_step_id: string;
  trigger_conditions?: unknown;
}

interface ContactAutomationUpdate {
  is_active?: boolean;
  automation_type?: string;
  target_flow_id?: string;
  target_step_id?: string;
  trigger_conditions?: unknown;
}

export type AutomationType = 'simple' | 'field_conditional' | 'contact_type';

export interface FieldConditionalConditions {
  type: 'field_conditional';
  fieldName: string;
  conditionValue: string;
  trueFlowId: string;
  trueStepId: string;
  falseFlowId?: string;
  falseStepId?: string;
}

export interface ContactTypeConditions {
  type: 'contact_type';
  contactType: 'parceiro' | 'cliente';
}

export type TriggerConditions = 
  | FieldConditionalConditions 
  | ContactTypeConditions 
  | Record<string, unknown>;

export interface ContactAutomation {
  id: string;
  clientId: string;
  isActive: boolean;
  automationType: AutomationType;
  targetFlowId: string;
  targetStepId: string;
  triggerConditions: TriggerConditions;
  createdAt: string;
  updatedAt: string;
}

const mapAutomationRow = (row: ContactAutomationRow): ContactAutomation => ({
  id: row.id,
  clientId: row.client_id,
  isActive: row.is_active,
  automationType: (row.automation_type as AutomationType) ?? 'simple',
  targetFlowId: row.target_flow_id,
  targetStepId: row.target_step_id,
  triggerConditions: (row.trigger_conditions as TriggerConditions) ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Automações de contato do cliente atual (multi-tenant: queryKey com clientId).
 */
export function useContactAutomations() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);
  const queryKey = ["nexflow", "contact-automations", clientId];

  const automationsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<ContactAutomation[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return [];
      }

      const result = await (nexflowClient() as any)
        .from("contact_automations")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      const { data, error } = result as {
        data: ContactAutomationRow[] | null;
        error: { message: string; details?: string; hint?: string; code?: string } | null;
      };

      if (error) {
        console.error("Erro ao carregar automações:", error);
        throw error;
      }

      return (data || []).map(mapAutomationRow);
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (input: {
      automationType?: AutomationType;
      targetFlowId: string;
      targetStepId: string;
      isActive?: boolean;
      triggerConditions?: TriggerConditions;
    }) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const payload: ContactAutomationInsert = {
        client_id: clientId,
        automation_type: input.automationType ?? 'simple',
        target_flow_id: input.targetFlowId,
        target_step_id: input.targetStepId,
        is_active: input.isActive ?? true,
        trigger_conditions: (input.triggerConditions ?? {}) as unknown,
      };

      const { data, error } = await (nexflowClient() as any)
        .from("contact_automations")
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
      automationType?: AutomationType;
      isActive?: boolean;
      targetFlowId?: string;
      targetStepId?: string;
      triggerConditions?: TriggerConditions;
    }) => {
      const payload: ContactAutomationUpdate = {};

      if (input.automationType !== undefined) {
        payload.automation_type = input.automationType;
      }
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
        payload.trigger_conditions = input.triggerConditions as unknown;
      }

      const { data, error } = await (nexflowClient() as any)
        .from("contact_automations")
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
      const { error } = await (nexflowClient() as any)
        .from("contact_automations")
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




