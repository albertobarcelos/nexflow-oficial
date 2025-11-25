import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * NOTA IMPORTANTE SOBRE SCHEMA NEXFLOW:
 * 
 * As tabelas de permissão estão no schema 'nexflow', não no 'public'.
 * O Supabase client JavaScript pode não suportar acesso direto a schemas customizados.
 * 
 * Se as queries abaixo falharem, você pode precisar:
 * 1. Criar views no schema 'public' que apontam para as tabelas em 'nexflow'
 * 2. Usar RPC functions para acessar as tabelas
 * 3. Ou configurar o search_path do banco de dados
 * 
 * Exemplo de view (executar no Supabase SQL Editor):
 * CREATE VIEW flow_access_control AS SELECT * FROM nexflow.flow_access_control;
 * CREATE VIEW flow_step_visibility AS SELECT * FROM nexflow.flow_step_visibility;
 * 
 * Então usar: .from('flow_access_control') ao invés de .from('nexflow.flow_access_control')
 */

// Tipos para permissões
export type PermissionLevel = 'view' | 'edit' | 'admin';

export interface FlowAccessControl {
  id: string;
  flow_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  created_at: string;
}

export interface FlowStepVisibility {
  id: string;
  flow_id: string;
  step_id: string;
  user_id: string;
  is_visible: boolean;
  created_at: string;
}

/**
 * Busca a permissão global de um usuário para um flow
 * Nota: As tabelas estão no schema 'nexflow', então usamos a sintaxe schema.table
 */
export async function getFlowAccessControl(
  flowId: string,
  userId: string
): Promise<FlowAccessControl | null> {
  // Tentar acessar diretamente o schema nexflow
  const { data, error } = await supabase
    .from('nexflow.flow_access_control' as any)
    .select('*')
    .eq('flow_id', flowId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar permissão de acesso:', error);
    // Se falhar, pode ser que precise usar RPC ou configurar search_path
    throw error;
  }

  return data;
}

/**
 * Salva ou atualiza a permissão global de um usuário para um flow
 */
export async function setFlowAccessControl(
  flowId: string,
  userId: string,
  permissionLevel: PermissionLevel
): Promise<FlowAccessControl> {
  // Verifica se já existe uma permissão
  const existing = await getFlowAccessControl(flowId, userId);

  if (existing) {
    // Atualiza a permissão existente
    const { data, error } = await supabase
      .from('nexflow.flow_access_control' as any)
      .update({ permission_level: permissionLevel })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar permissão de acesso:', error);
      throw error;
    }

    return data;
  } else {
    // Cria nova permissão
    const { data, error } = await supabase
      .from('nexflow.flow_access_control' as any)
      .insert({
        flow_id: flowId,
        user_id: userId,
        permission_level: permissionLevel,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar permissão de acesso:', error);
      throw error;
    }

    return data;
  }
}

/**
 * Busca a visibilidade de todas as etapas de um flow para um usuário
 * Nota: As tabelas estão no schema 'nexflow', então usamos a sintaxe schema.table
 */
export async function getFlowStepVisibility(
  flowId: string,
  userId: string
): Promise<FlowStepVisibility[]> {
  const { data, error } = await supabase
    .from('nexflow.flow_step_visibility' as any)
    .select('*')
    .eq('flow_id', flowId)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar visibilidade de etapas:', error);
    throw error;
  }

  return data || [];
}

/**
 * Salva ou atualiza a visibilidade de uma etapa específica para um usuário
 */
export async function setFlowStepVisibility(
  flowId: string,
  userId: string,
  stepId: string,
  isVisible: boolean
): Promise<FlowStepVisibility> {
  // Verifica se já existe uma configuração de visibilidade
  const { data: existing } = await supabase
    .from('nexflow.flow_step_visibility' as any)
    .select('*')
    .eq('flow_id', flowId)
    .eq('user_id', userId)
    .eq('step_id', stepId)
    .maybeSingle();

  if (existing) {
    // Atualiza a visibilidade existente
    const { data, error } = await supabase
      .from('nexflow.flow_step_visibility' as any)
      .update({ is_visible: isVisible })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar visibilidade de etapa:', error);
      throw error;
    }

    return data;
  } else {
    // Cria nova configuração de visibilidade
    const { data, error } = await supabase
      .from('nexflow.flow_step_visibility' as any)
      .insert({
        flow_id: flowId,
        user_id: userId,
        step_id: stepId,
        is_visible: isVisible,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar visibilidade de etapa:', error);
      throw error;
    }

    return data;
  }
}

/**
 * Hook para gerenciar permissões de um flow
 */
export function useFlowPermissions(flowId: string, userId?: string) {
  const queryClient = useQueryClient();

  // Query para buscar permissão global
  const { data: accessControl, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['flow-access-control', flowId, userId],
    queryFn: () => {
      if (!userId) return null;
      return getFlowAccessControl(flowId, userId);
    },
    enabled: !!flowId && !!userId,
  });

  // Query para buscar visibilidade de etapas
  const { data: stepVisibility, isLoading: isLoadingVisibility } = useQuery({
    queryKey: ['flow-step-visibility', flowId, userId],
    queryFn: () => {
      if (!userId) return [];
      return getFlowStepVisibility(flowId, userId);
    },
    enabled: !!flowId && !!userId,
  });

  // Mutation para salvar permissão global
  const saveAccessControlMutation = useMutation({
    mutationFn: async ({ userId, permissionLevel }: { userId: string; permissionLevel: PermissionLevel }) => {
      return setFlowAccessControl(flowId, userId, permissionLevel);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flow-access-control', flowId, variables.userId] });
      toast.success('Permissão salva com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao salvar permissão:', error);
      toast.error('Erro ao salvar permissão: ' + (error.message || 'Erro desconhecido'));
    },
  });

  // Mutation para salvar visibilidade de etapa
  const saveStepVisibilityMutation = useMutation({
    mutationFn: async ({ userId, stepId, isVisible }: { userId: string; stepId: string; isVisible: boolean }) => {
      return setFlowStepVisibility(flowId, userId, stepId, isVisible);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flow-step-visibility', flowId, variables.userId] });
    },
    onError: (error: any) => {
      console.error('Erro ao salvar visibilidade de etapa:', error);
      toast.error('Erro ao salvar visibilidade: ' + (error.message || 'Erro desconhecido'));
    },
  });

  // Mutation para salvar múltiplas visibilidades de etapas
  const saveMultipleStepVisibilityMutation = useMutation({
    mutationFn: async ({ userId, visibilities }: { userId: string; visibilities: { stepId: string; isVisible: boolean }[] }) => {
      const promises = visibilities.map(({ stepId, isVisible }) =>
        setFlowStepVisibility(flowId, userId, stepId, isVisible)
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flow-step-visibility', flowId, variables.userId] });
      toast.success('Visibilidade de etapas salva com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao salvar visibilidade de etapas:', error);
      toast.error('Erro ao salvar visibilidade: ' + (error.message || 'Erro desconhecido'));
    },
  });

  return {
    accessControl,
    stepVisibility,
    isLoading: isLoadingAccess || isLoadingVisibility,
    saveAccessControl: saveAccessControlMutation.mutate,
    saveStepVisibility: saveStepVisibilityMutation.mutate,
    saveMultipleStepVisibility: saveMultipleStepVisibilityMutation.mutate,
    isSavingAccess: saveAccessControlMutation.isPending,
    isSavingVisibility: saveStepVisibilityMutation.isPending || saveMultipleStepVisibilityMutation.isPending,
  };
}

