import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Tipos otimizados baseados nas funções RPC
export interface DatabaseBase {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  total_flows_linked?: number;
}

export interface FlowBase {
  link_id: string;
  flow_id: string;
  entity_id: string;
  entity_name: string;
  entity_slug: string;
  entity_icon?: string;
  entity_color?: string;
  entity_description?: string;
  is_system: boolean;
  is_required: boolean;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export interface LinkBaseData {
  entityId: string;
  isRequired: boolean;
  isPrimary?: boolean;
}

export interface ReorderData {
  entityId: string;
  orderIndex: number;
}

// Função para buscar client_id do usuário
async function getCurrentClientId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) throw new Error('Usuário sem cliente associado');
  return clientUser.client_id;
}

export function useFlowBases(flowId: string) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSystem, setFilterSystem] = useState<boolean | null>(null);

  // Query para buscar entidades disponíveis (com cache inteligente)
  const { data: availableBases = [], isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['available-entities', searchTerm, filterSystem],
    queryFn: async () => {
      try {
        const clientId = await getCurrentClientId();
        
        const { data, error } = await supabase.rpc('get_available_entities', {
          p_client_id: clientId,
          p_search: searchTerm || null,
          p_is_system: filterSystem
        });

        if (error) throw error;
        return data as DatabaseBase[];
      } catch (error) {
        console.error('Erro ao buscar entidades:', error);
        toast.error('Erro ao carregar entidades disponíveis');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Query para buscar entidades vinculadas ao flow (com realtime)
  const { data: linkedBases = [], isLoading: isLoadingLinked } = useQuery({
    queryKey: ['flow-entities', flowId],
    queryFn: async () => {
      if (!flowId) return [];

      try {
        const clientId = await getCurrentClientId();
        
        const { data, error } = await supabase.rpc('get_flow_linked_entities', {
          p_flow_id: flowId,
          p_client_id: clientId
        });

        if (error) throw error;
        return data as FlowBase[];
      } catch (error) {
        console.error('Erro ao buscar entidades vinculadas:', error);
        toast.error('Erro ao carregar entidades vinculadas');
        throw error;
      }
    },
    enabled: !!flowId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para vincular entidade ao flow
  const linkBaseMutation = useMutation({
    mutationFn: async (baseData: LinkBaseData) => {
      try {
        const clientId = await getCurrentClientId();
        
        const { data, error } = await supabase.rpc('link_entity_to_flow', {
          p_flow_id: flowId,
          p_entity_id: baseData.entityId,
          p_client_id: clientId,
          p_is_required: baseData.isRequired,
          p_is_primary: baseData.isPrimary || false
        });

        if (error) throw error;
        
        const result = data[0];
        if (!result.success) {
          throw new Error(result.message);
        }

        return result;
      } catch (error) {
        console.error('Erro ao vincular entidade:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar ambas as queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      queryClient.invalidateQueries({ queryKey: ['available-entities'] });
      toast.success('Entidade vinculada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao vincular entidade:', error);
      toast.error('Erro ao vincular entidade: ' + error.message);
    },
  });

  // Mutation para desvincular entidade do flow
  const unlinkBaseMutation = useMutation({
    mutationFn: async (linkId: string) => {
      try {
        const { error } = await supabase
          .from('web_flow_entity_links')
          .delete()
          .eq('id', linkId);

        if (error) throw error;
        return linkId;
      } catch (error) {
        console.error('Erro ao desvincular entidade:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      queryClient.invalidateQueries({ queryKey: ['available-entities'] });
      toast.success('Entidade desvinculada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao desvincular entidade:', error);
      toast.error('Erro ao desvincular entidade: ' + error.message);
    },
  });

  // Mutation para atualizar configuração de entidade
  const updateBaseConfigMutation = useMutation({
    mutationFn: async ({ linkId, isRequired, isPrimary }: {
      linkId: string;
      isRequired?: boolean;
      isPrimary?: boolean;
    }) => {
      try {
        const updates: any = {};
        if (isRequired !== undefined) updates.is_required = isRequired;
        if (isPrimary !== undefined) updates.is_primary = isPrimary;

        // Se está marcando como principal, primeiro remover outros principais
        if (isPrimary) {
          await supabase
            .from('web_flow_entity_links')
            .update({ is_primary: false })
            .eq('flow_id', flowId)
            .neq('id', linkId);
        }

        const { error } = await supabase
          .from('web_flow_entity_links')
          .update(updates)
          .eq('id', linkId);

        if (error) throw error;
        return { linkId, ...updates };
      } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      toast.success('Configuração atualizada!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });

  // Mutation para reordenar entidades (usando função RPC otimizada)
  const reorderBasesMutation = useMutation({
    mutationFn: async (reorderData: ReorderData[]) => {
      try {
        const clientId = await getCurrentClientId();
        
        const { data, error } = await supabase.rpc('reorder_flow_entities', {
          p_flow_id: flowId,
          p_client_id: clientId,
          p_entity_orders: reorderData.map(item => ({
            entity_id: item.entityId,
            order_index: item.orderIndex
          }))
        });

        if (error) throw error;
        
        const result = data[0];
        if (!result.success) {
          throw new Error(result.message);
        }

        return result;
      } catch (error) {
        console.error('Erro ao reordenar entidades:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      toast.success('Ordem das entidades atualizada!');
    },
    onError: (error: any) => {
      console.error('Erro ao reordenar entidades:', error);
      toast.error('Erro ao reordenar entidades: ' + error.message);
    },
  });

  const isLoading = isLoadingAvailable || isLoadingLinked;

  return {
    // Dados
    availableBases,
    linkedBases,
    isLoading,
    
    // Filtros
    searchTerm,
    setSearchTerm,
    filterSystem,
    setFilterSystem,
    
    // Operações
    linkBase: linkBaseMutation.mutate,
    unlinkBase: unlinkBaseMutation.mutate,
    updateBaseConfig: updateBaseConfigMutation.mutate,
    reorderBases: reorderBasesMutation.mutate,
    
    // Estados de loading
    isLinking: linkBaseMutation.isPending,
    isUnlinking: unlinkBaseMutation.isPending,
    isUpdating: updateBaseConfigMutation.isPending,
    isReordering: reorderBasesMutation.isPending,
    
    // Estatísticas computadas
    stats: {
      totalAvailable: availableBases.length,
      totalLinked: linkedBases.length,
      totalRequired: linkedBases.filter(b => b.is_required).length,
      primaryEntity: linkedBases.find(b => b.is_primary),
      systemEntities: linkedBases.filter(b => b.is_system).length,
      customEntities: linkedBases.filter(b => !b.is_system).length,
    }
  };
} 