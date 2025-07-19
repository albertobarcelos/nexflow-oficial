// =====================================================
// HOOK PARA GESTÃO DE VISUALIZAÇÕES DUPLICADAS
// =====================================================
// AIDEV-NOTE: Hook para gerenciar visualizações múltiplas de deals entre flows
// Mantém sincronização automática e visibilidade por papéis

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/database';

type DealFlowView = Database['public']['Tables']['web_deal_flow_views']['Row'];
type FlowAutomation = Database['public']['Tables']['web_flow_automations']['Row'];

interface FlowViewsState {
  isLoading: boolean;
  error: string | null;
  dealViews: DealFlowView[];
  automations: FlowAutomation[];
}

interface CreateDealViewData {
  deal_id: string;
  flow_id: string;
  stage_id: string;
  visible_to_roles?: string[];
  is_primary?: boolean;
  sync_data?: Record<string, any>;
}

export function useFlowViews() {
  const { user } = useAuth();
  const [state, setState] = useState<FlowViewsState>({
    isLoading: false,
    error: null,
    dealViews: [],
    automations: []
  });

  // =====================================================
  // CARREGAR VISUALIZAÇÕES DE UM DEAL
  // =====================================================
  const loadDealViews = useCallback(async (dealId: string) => {
    if (!user?.client_id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('web_deal_flow_views')
        .select(`
          *,
          flow:web_flows(*),
          stage:web_flow_stages(*)
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        dealViews: data || [],
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao carregar visualizações',
        isLoading: false 
      }));
    }
  }, [user?.client_id]);

  // =====================================================
  // CARREGAR AUTOMAÇÕES ATIVAS
  // =====================================================
  const loadActiveAutomations = useCallback(async () => {
    if (!user?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('web_flow_automations')
        .select(`
          *,
          source_flow:web_flows!source_flow_id(*),
          source_stage:web_flow_stages!source_stage_id(*)
        `)
        .eq('automation_type', 'duplicate')
        .eq('is_active', true);

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        automations: data || []
      }));
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
    }
  }, [user?.client_id]);

  // =====================================================
  // CRIAR VISUALIZAÇÃO DUPLICADA
  // =====================================================
  const createDealView = useCallback(async (viewData: CreateDealViewData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: newView, error } = await supabase
        .from('web_deal_flow_views')
        .insert({
          deal_id: viewData.deal_id,
          flow_id: viewData.flow_id,
          stage_id: viewData.stage_id,
          visible_to_roles: viewData.visible_to_roles || [],
          is_primary: viewData.is_primary || false,
          sync_data: viewData.sync_data || {},
          last_sync_at: new Date().toISOString()
        })
        .select(`
          *,
          flow:web_flows(*),
          stage:web_flow_stages(*)
        `)
        .single();

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        dealViews: [...prev.dealViews, newView],
        isLoading: false 
      }));

      return newView;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao criar visualização',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  // =====================================================
  // MOVER DEAL PARA NOVA STAGE
  // =====================================================
  const moveDealToStage = useCallback(async (
    dealId: string, 
    flowId: string, 
    newStageId: string,
    updateData?: Record<string, any>
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Atualizar visualização existente
      const { data: updatedView, error: updateError } = await supabase
        .from('web_deal_flow_views')
        .update({
          stage_id: newStageId,
          sync_data: updateData || {},
          last_sync_at: new Date().toISOString()
        })
        .eq('deal_id', dealId)
        .eq('flow_id', flowId)
        .select(`
          *,
          flow:web_flows(*),
          stage:web_flow_stages(*)
        `)
        .single();

      if (updateError) throw updateError;

      // Verificar se há automações para esta mudança de stage
      await checkAndExecuteAutomations(dealId, flowId, newStageId);

      // Atualizar estado local
      setState(prev => ({ 
        ...prev, 
        dealViews: prev.dealViews.map(view => 
          view.deal_id === dealId && view.flow_id === flowId 
            ? updatedView 
            : view
        ),
        isLoading: false 
      }));

      return updatedView;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao mover deal',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  // =====================================================
  // VERIFICAR E EXECUTAR AUTOMAÇÕES
  // =====================================================
  const checkAndExecuteAutomations = useCallback(async (
    dealId: string, 
    sourceFlowId: string, 
    sourceStageId: string
  ) => {
    try {
      // Buscar automações para esta combinação flow/stage
      const { data: automations, error } = await supabase
        .from('web_flow_automations')
        .select(`
          *,
          target_flow:web_flows!target_flow_id(*)
        `)
        .eq('source_flow_id', sourceFlowId)
        .eq('source_stage_id', sourceStageId)
        .eq('automation_type', 'duplicate')
        .eq('is_active', true);

      if (error) throw error;

      // Executar cada automação
      for (const automation of automations || []) {
        await executeDuplicationAutomation(dealId, automation);
      }
    } catch (error) {
      console.error('Erro ao executar automações:', error);
    }
  }, []);

  // =====================================================
  // EXECUTAR AUTOMAÇÃO DE DUPLICAÇÃO
  // =====================================================
  const executeDuplicationAutomation = useCallback(async (
    dealId: string, 
    automation: any
  ) => {
    try {
      // Verificar se já existe visualização no flow de destino
      const { data: existingView } = await supabase
        .from('web_deal_flow_views')
        .select('id')
        .eq('deal_id', dealId)
        .eq('flow_id', automation.target_flow_id)
        .single();

      if (existingView) {
        console.log('Visualização já existe no flow de destino');
        return;
      }

      // Buscar primeira stage do flow de destino
      const { data: firstStage, error: stageError } = await supabase
        .from('web_flow_stages')
        .select('id')
        .eq('flow_id', automation.target_flow_id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (stageError) throw stageError;

      // Criar nova visualização no flow de destino
      await createDealView({
        deal_id: dealId,
        flow_id: automation.target_flow_id,
        stage_id: firstStage.id,
        visible_to_roles: automation.visible_to_roles || [],
        is_primary: false,
        sync_data: {
          created_by_automation: true,
          source_automation_id: automation.id,
          source_flow_id: automation.source_flow_id
        }
      });

      console.log(`Deal ${dealId} duplicado para flow ${automation.target_flow_id}`);
    } catch (error) {
      console.error('Erro ao executar duplicação:', error);
    }
  }, [createDealView]);

  // =====================================================
  // SINCRONIZAR DADOS ENTRE VISUALIZAÇÕES
  // =====================================================
  const syncDealViews = useCallback(async (
    dealId: string, 
    syncData: Record<string, any>
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase
        .from('web_deal_flow_views')
        .update({
          sync_data: syncData,
          last_sync_at: new Date().toISOString()
        })
        .eq('deal_id', dealId);

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        dealViews: prev.dealViews.map(view => 
          view.deal_id === dealId 
            ? { ...view, sync_data: syncData, last_sync_at: new Date().toISOString() }
            : view
        ),
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao sincronizar dados',
        isLoading: false 
      }));
    }
  }, []);

  // =====================================================
  // FILTRAR VISUALIZAÇÕES POR PAPEL DO USUÁRIO
  // =====================================================
  const getVisibleViews = useCallback((userRole: string) => {
    return state.dealViews.filter(view => 
      !view.visible_to_roles || 
      view.visible_to_roles.length === 0 || 
      view.visible_to_roles.includes(userRole)
    );
  }, [state.dealViews]);

  // =====================================================
  // REMOVER VISUALIZAÇÃO
  // =====================================================
  const removeDealView = useCallback(async (dealId: string, flowId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase
        .from('web_deal_flow_views')
        .delete()
        .eq('deal_id', dealId)
        .eq('flow_id', flowId);

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        dealViews: prev.dealViews.filter(view => 
          !(view.deal_id === dealId && view.flow_id === flowId)
        ),
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao remover visualização',
        isLoading: false 
      }));
    }
  }, []);

  // Carregar automações ao inicializar
  useEffect(() => {
    loadActiveAutomations();
  }, [loadActiveAutomations]);

  return {
    ...state,
    loadDealViews,
    loadActiveAutomations,
    createDealView,
    moveDealToStage,
    syncDealViews,
    getVisibleViews,
    removeDealView,
    checkAndExecuteAutomations
  };
}