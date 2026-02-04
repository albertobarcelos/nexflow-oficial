import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getCurrentClientId } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import type {
  FlowActivityType,
  CreateFlowActivityTypeInput,
  UpdateFlowActivityTypeInput,
} from "@/types/activities";

/**
 * Tipos de atividade do flow (multi-tenant: queryKey com clientId).
 */
export function useFlowActivityTypes(flowId: string | null) {
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useQuery({
    queryKey: ["flow-activity-types", clientId, flowId],
    queryFn: async (): Promise<FlowActivityType[]> => {
      if (!flowId) return [];

      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      const { data, error } = await (supabase as any)
        .from('flow_activity_types')
        .select('*')
        .eq('flow_id', flowId)
        .eq('client_id', clientId)
        .order('name', { ascending: true });

      if (error) {
        // Se a tabela não existe (404), retornar array vazio em vez de lançar erro
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('[useFlowActivityTypes] Tabela flow_activity_types não encontrada. As migrations podem não ter sido aplicadas.');
          return [];
        }
        throw error;
      }
      return (data || []) as FlowActivityType[];
    },
    enabled: !!clientId && !!flowId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useCreateFlowActivityType() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useMutation({
    mutationFn: async (input: CreateFlowActivityTypeInput): Promise<FlowActivityType> => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      const { data, error } = await (supabase as any)
        .from('flow_activity_types')
        .insert({
          flow_id: input.flow_id,
          name: input.name.trim(),
          color: input.color || null,
          icon: input.icon || null,
          active: input.active ?? true,
          client_id: clientId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FlowActivityType;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["flow-activity-types", clientId, data.flow_id],
      });
      toast.success("Tipo de atividade criado com sucesso");
    },
    onError: (error: Error) => {
      console.error('[CreateFlowActivityType] Erro:', error);
      toast.error('Erro ao criar tipo de atividade: ' + error.message);
    },
  });
}

export function useUpdateFlowActivityType() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useMutation({
    mutationFn: async ({
      id,
      flowId,
      input,
    }: {
      id: string;
      flowId: string;
      input: UpdateFlowActivityTypeInput;
    }): Promise<FlowActivityType> => {
      const updateData: Partial<FlowActivityType> = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.color !== undefined) updateData.color = input.color;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.active !== undefined) updateData.active = input.active;

      const { data, error } = await (supabase as any)
        .from('flow_activity_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FlowActivityType;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["flow-activity-types", clientId, data.flow_id],
      });
      toast.success("Tipo de atividade atualizado com sucesso");
    },
    onError: (error: Error) => {
      console.error('[UpdateFlowActivityType] Erro:', error);
      toast.error('Erro ao atualizar tipo de atividade: ' + error.message);
    },
  });
}

export function useDeleteFlowActivityType() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useMutation({
    mutationFn: async ({
      id,
      flowId,
    }: {
      id: string;
      flowId: string;
    }): Promise<void> => {
      const { error } = await (supabase as any).from('flow_activity_types').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["flow-activity-types", clientId, variables.flowId],
      });
      toast.success("Tipo de atividade deletado com sucesso");
    },
    onError: (error: Error) => {
      console.error('[DeleteFlowActivityType] Erro:', error);
      toast.error('Erro ao deletar tipo de atividade: ' + error.message);
    },
  });
}
