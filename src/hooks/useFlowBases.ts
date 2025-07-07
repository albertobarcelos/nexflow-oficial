import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Tipos para entidades (bases)
export interface DatabaseBase {
  id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color?: string;
  is_system: boolean;
  is_active: boolean;
}

export interface FlowBase {
  id: string;
  flow_id: string;
  entity_id: string;
  is_required: boolean;
  is_primary: boolean;
  order_index: number;
  // Dados da entidade vinculada  
  entity?: DatabaseBase;
}

export interface LinkBaseData {
  entityId: string;
  isRequired: boolean;
  isPrimary?: boolean;
  orderIndex?: number;
}

// Mock data para demonstrar funcionalidade
const mockEntities: DatabaseBase[] = [
  {
    id: 'b6398ad5-5a86-4880-b635-1084dd6787e5',
    name: 'Empresas',
    slug: 'companies',
    icon: 'building2',
    color: '#3b82f6',
    is_system: true,
    is_active: true,
    description: 'Empresas e organizações'
  },
  {
    id: '01562090-cd9e-4ea1-a29a-a6da25988066',
    name: 'Pessoas',
    slug: 'people',
    icon: 'users',
    color: '#10b981',
    is_system: true,
    is_active: true,
    description: 'Contatos e pessoas físicas'
  },
  {
    id: 'ccf3ac50-e633-45de-9299-2df81a5cbeb3',
    name: 'Parceiros',
    slug: 'partners',
    icon: 'handshake',
    color: '#f59e0b',
    is_system: true,
    is_active: true,
    description: 'Parceiros de negócio'
  },
  {
    id: '677909cc-f28c-40a4-8490-aa972f5e04b9',
    name: 'Cursos',
    slug: 'cursos',
    icon: 'graduation-cap',
    color: '#8b5cf6',
    is_system: false,
    is_active: true,
    description: 'Gerencie cursos e programas educacionais'
  },
  {
    id: '7e51d169-3c88-4874-9ac6-1c44444a0bbb',
    name: 'Imóveis',
    slug: 'imoveis',
    icon: 'home',
    color: '#3b82f6',
    is_system: false,
    is_active: true,
    description: 'Controle seu portfólio de imóveis para venda ou locação'
  }
];

export function useFlowBases(flowId: string) {
  const queryClient = useQueryClient();

  // Query para buscar todas as entidades disponíveis
  const { data: availableBases = [], isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['available-entities'],
    queryFn: async () => {
      try {
        // Por enquanto retornar dados mock
        // Em produção, isso faria uma query real ao banco
        return mockEntities.filter(e => e.is_active);
      } catch (error) {
        console.error('Erro ao buscar entidades:', error);
        return [];
      }
    },
  });

  // Query para buscar entidades vinculadas ao flow  
  const { data: linkedBases = [], isLoading: isLoadingLinked } = useQuery({
    queryKey: ['flow-entities', flowId],
    queryFn: async () => {
      if (!flowId) return [];

      try {
        // Simular dados de entidades vinculadas ao Flow de Vendas
        if (flowId === '3e36965b-be8f-40cc-a273-08ab2cfc0974') {
          return [
            {
              id: 'link-1',
              flow_id: flowId,
              entity_id: 'b6398ad5-5a86-4880-b635-1084dd6787e5',
              is_required: true,
              is_primary: true,
              order_index: 1,
              entity: mockEntities.find(e => e.id === 'b6398ad5-5a86-4880-b635-1084dd6787e5')
            },
            {
              id: 'link-2',
              flow_id: flowId,
              entity_id: '01562090-cd9e-4ea1-a29a-a6da25988066',
              is_required: false,
              is_primary: false,
              order_index: 2,
              entity: mockEntities.find(e => e.id === '01562090-cd9e-4ea1-a29a-a6da25988066')
            },
            {
              id: 'link-3',
              flow_id: flowId,
              entity_id: 'ccf3ac50-e633-45de-9299-2df81a5cbeb3',
              is_required: false,
              is_primary: false,
              order_index: 3,
              entity: mockEntities.find(e => e.id === 'ccf3ac50-e633-45de-9299-2df81a5cbeb3')
            }
          ];
        }

        return [];
      } catch (error) {
        console.error('Erro ao buscar entidades vinculadas:', error);
        return [];
      }
    },
    enabled: !!flowId,
  });

  // Mutation para vincular entidade ao flow
  const linkBaseMutation = useMutation({
    mutationFn: async (baseData: LinkBaseData) => {
      // Buscar próximo order_index se não fornecido
      const orderIndex = baseData.orderIndex !== undefined 
        ? baseData.orderIndex 
        : linkedBases.length > 0 
          ? Math.max(...linkedBases.map(b => b.order_index || 0)) + 1 
          : 1;

      // Simular criação de vínculo
      const newLink: FlowBase = {
        id: `link-${Date.now()}`,
        flow_id: flowId,
        entity_id: baseData.entityId,
        is_required: baseData.isRequired,
        is_primary: baseData.isPrimary || false,
        order_index: orderIndex,
        entity: availableBases.find(e => e.id === baseData.entityId)
      };

      // Em produção, aqui faria insert no banco
      return newLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      toast.success('Entidade vinculada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao vincular entidade:', error);
      toast.error('Erro ao vincular entidade: ' + error.message);
    },
  });

  // Mutation para desvincular entidade do flow
  const unlinkBaseMutation = useMutation({
    mutationFn: async (flowEntityId: string) => {
      // Em produção, aqui faria delete no banco
      console.log('Desvinculando entidade:', flowEntityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      toast.success('Entidade desvinculada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao desvincular entidade:', error);
      toast.error('Erro ao desvincular entidade: ' + error.message);
    },
  });

  // Mutation para atualizar configuração da entidade vinculada
  const updateBaseConfigMutation = useMutation({
    mutationFn: async ({ flowEntityId, isRequired, isPrimary, orderIndex }: { 
      flowEntityId: string; 
      isRequired?: boolean; 
      isPrimary?: boolean;
      orderIndex?: number; 
    }) => {
      // Em produção, aqui faria update no banco
      console.log('Atualizando configuração:', { flowEntityId, isRequired, isPrimary, orderIndex });
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      toast.success('Configuração atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });

  // Função para reordenar entidades
  const reorderBases = async (reorderedBases: FlowBase[]) => {
    try {
      // Em produção, aqui faria update das ordens no banco
      console.log('Reordenando entidades:', reorderedBases.map(b => ({ id: b.id, order: b.order_index })));

      queryClient.invalidateQueries({ queryKey: ['flow-entities', flowId] });
      toast.success('Ordem das entidades atualizada!');
    } catch (error: any) {
      console.error('Erro ao reordenar entidades:', error);
      toast.error('Erro ao reordenar entidades: ' + error.message);
    }
  };

  return {
    // Dados
    availableBases,
    linkedBases,
    
    // Estados de loading
    isLoadingAvailable,
    isLoadingLinked,
    isLoading: isLoadingAvailable || isLoadingLinked,
    
    // Ações
    linkBase: linkBaseMutation.mutate,
    unlinkBase: unlinkBaseMutation.mutate,
    updateBaseConfig: updateBaseConfigMutation.mutate,
    reorderBases,
    
    // Estados das mutations
    isLinking: linkBaseMutation.isPending,
    isUnlinking: unlinkBaseMutation.isPending,
    isUpdating: updateBaseConfigMutation.isPending,
  };
} 