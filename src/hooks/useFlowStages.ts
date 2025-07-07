import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Tipos para as fases
export interface FlowStage {
  id: string;
  name: string;
  order_index: number;
  flow_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStageData {
  name: string;
  isFinalStage?: boolean;
  allowCreateCards?: boolean;
}

export function useFlowStages(flowId: string) {
  const queryClient = useQueryClient();

  // Query para buscar fases do flow
  const { data: stages = [], isLoading, error } = useQuery({
    queryKey: ['flow-stages', flowId],
    queryFn: async () => {
      if (!flowId) return [];

      // Buscar client_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: clientUser } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!clientUser) throw new Error('Usuário sem cliente associado');

      // Buscar fases do flow
      const { data, error } = await supabase
        .from('web_flow_stages')
        .select('*')
        .eq('flow_id', flowId)
        .eq('client_id', clientUser.client_id)
        .order('order_index');

      if (error) {
        console.error('Erro ao buscar fases:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!flowId,
  });

  // Mutation para criar nova fase
  const createStageMutation = useMutation({
    mutationFn: async (stageData: CreateStageData) => {
      // Buscar client_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: clientUser } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!clientUser) throw new Error('Usuário sem cliente associado');

      // Buscar próximo order_index
      const nextOrderIndex = stages.length > 0 
        ? Math.max(...stages.map(s => s.order_index)) + 1 
        : 1;

      // Criar nova fase
      const { data, error } = await supabase
        .from('web_flow_stages')
        .insert({
          flow_id: flowId,
          client_id: clientUser.client_id,
          name: stageData.name,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-stages', flowId] });
      toast.success('Fase criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar fase:', error);
      toast.error('Erro ao criar fase: ' + error.message);
    },
  });

  // Mutation para atualizar fase
  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, name }: { stageId: string; name: string }) => {
      const { data, error } = await supabase
        .from('web_flow_stages')
        .update({ name })
        .eq('id', stageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-stages', flowId] });
      toast.success('Fase atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar fase:', error);
      toast.error('Erro ao atualizar fase: ' + error.message);
    },
  });

  return {
    stages,
    isLoading,
    error,
    createStage: createStageMutation.mutate,
    updateStage: updateStageMutation.mutate,
    isCreating: createStageMutation.isPending,
    isUpdating: updateStageMutation.isPending,
  };
} 