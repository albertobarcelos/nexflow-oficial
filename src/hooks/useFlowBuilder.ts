// =====================================================
// HOOK PARA CONSTRUÇÃO MODULAR DE FLOWS
// =====================================================
// AIDEV-NOTE: Hook principal para criação e gestão de flows modulares
// Permite que usuários criem flows personalizados com automações

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useClientStore } from '@/stores/clientStore';
import type { Database } from '@/types/database';

type FlowStage = Database['public']['Tables']['web_flow_stages']['Row'];

/** Tipo do template de flow (tabela pode não estar no Database gerado) */
interface FlowTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  is_system_template?: boolean | null;
  client_id?: string | null;
  template_data: Record<string, unknown>;
}

/** Payload de stage aceito pelo form/construtor (sem client_id, flow_id - preenchidos pelo hook) */
export interface FlowStageInput {
  name: string;
  description?: string;
  color?: string;
  order_index?: number;
  stage_type?: string;
  is_final_stage?: boolean;
}

/** Payload de automação aceito pelo form/construtor (campos simplificados) */
export interface FlowAutomationInput {
  name: string;
  description?: string;
  source_stage?: string;
  source_stage_id?: string;
  automation_type?: 'duplicate' | 'move' | 'notify';
  trigger_condition?: 'stage_change' | 'time_based' | 'field_change';
  target_flow_name?: string;
  visible_to_roles?: string[];
}

interface CreateFlowData {
  name: string;
  description?: string;
  stages: FlowStageInput[];
  automations?: FlowAutomationInput[];
}

interface FlowBuilderState {
  isLoading: boolean;
  error: string | null;
  currentFlow: any | null;
  templates: FlowTemplate[];
}

export function useFlowBuilder() {
  const { user } = useAuth();
  const { currentClient } = useClientStore();
  const [state, setState] = useState<FlowBuilderState>({
    isLoading: false,
    error: null,
    currentFlow: null,
    templates: []
  });

  // =====================================================
  // CARREGAR TEMPLATES DISPONÍVEIS
  // =====================================================
  const loadTemplates = useCallback(async () => {
    if (!currentClient?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Tabela web_flow_templates não está no Database gerado; cast evita "Type instantiation excessively deep"
      const { data, error } = await supabase
        .from('web_flow_templates' as 'web_flows')
        .select('*')
        .or(`client_id.eq.${currentClient!.id},is_system_template.eq.true`)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        templates: (data || []) as unknown as FlowTemplate[],
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao carregar templates',
        isLoading: false 
      }));
    }
  }, [currentClient?.id]);

  // =====================================================
  // CRIAR FLOW A PARTIR DE TEMPLATE
  // =====================================================
  const createFlowFromTemplate = useCallback(async (templateId: string, customName?: string) => {
    if (!currentClient?.id) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Buscar template (cast evita "Type instantiation excessively deep" - tabela não existe no Database gerado)
      const { data: template, error: templateError } = await supabase
        .from('web_flow_templates' as 'web_flows')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;
      if (!template) throw new Error('Template não encontrado');

      const templateData = (template as unknown as FlowTemplate).template_data as {
        flow: { name: string; description?: string };
        stages: unknown[];
        automations?: unknown[];
      };
      
      // Criar flow
      const flowData = {
        client_id: currentClient!.id,
        name: customName || templateData.flow.name,
        description: templateData.flow.description,
        created_by: user.id
      };

      const { data: newFlow, error: flowError } = await supabase
        .from('web_flows')
        .insert(flowData)
        .select()
        .single();

      if (flowError) throw flowError;

      // Criar stages (apenas campos do schema: client_id, flow_id, name, description, color, order_index)
      const stagesData = templateData.stages.map((stage: { name: string; description?: string; color?: string; order_index?: number }, index: number) => ({
        flow_id: newFlow.id,
        client_id: currentClient!.id,
        name: stage.name,
        description: stage.description ?? null,
        color: stage.color ?? null,
        order_index: stage.order_index ?? index + 1
      }));

      const { data: newStages, error: stagesError } = await supabase
        .from('web_flow_stages')
        .insert(stagesData)
        .select();

      if (stagesError) throw stagesError;

      // Criar automações se existirem (mapear template -> schema do banco: action_type, trigger_event, client_id, created_by, target_flow_id, target_stage_id)
      if (templateData.automations && templateData.automations.length > 0 && newStages && newStages.length > 0) {
        const automationsData = templateData.automations.map((automation: { source_stage?: string; automation_type?: string; trigger_condition?: string; name?: string; description?: string; visible_to_roles?: string[] }) => {
          const sourceStage = newStages!.find((s) => s.name === automation.source_stage) ?? newStages![0];
          return {
            source_flow_id: newFlow.id,
            source_stage_id: sourceStage.id,
            target_flow_id: newFlow.id,
            target_stage_id: sourceStage.id,
            client_id: currentClient!.id,
            created_by: user.id,
            name: automation.name ?? '',
            description: automation.description ?? null,
            action_type: automation.automation_type ?? 'duplicate',
            trigger_event: automation.trigger_condition ?? 'stage_change',
            visible_to_roles: automation.visible_to_roles ?? []
          };
        });

        const { error: automationsError } = await supabase
          .from('web_flow_automations')
          .insert(automationsData);

        if (automationsError) throw automationsError;
      }

      const completeFlow = {
        ...newFlow,
        stages: newStages
      };

      setState(prev => ({ 
        ...prev, 
        currentFlow: completeFlow,
        isLoading: false 
      }));

      return completeFlow;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao criar flow',
        isLoading: false 
      }));
      return null;
    }
  }, [user, currentClient]);

  // =====================================================
  // CRIAR FLOW PERSONALIZADO DO ZERO
  // =====================================================
  const createCustomFlow = useCallback(async (flowData: CreateFlowData) => {
    if (!currentClient?.id) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Criar flow
      const { data: newFlow, error: flowError } = await supabase
        .from('web_flows')
        .insert({
          client_id: currentClient!.id,
          name: flowData.name,
          description: flowData.description,
          created_by: user.id
        })
        .select()
        .single();

      if (flowError) throw flowError;

      // Criar stages (adicionar client_id e flow_id - preenchidos pelo hook)
      const stagesData = flowData.stages.map((stage, index) => ({
        flow_id: newFlow.id,
        client_id: currentClient!.id,
        name: stage.name,
        description: stage.description ?? null,
        color: stage.color ?? null,
        order_index: stage.order_index ?? index + 1
      }));

      const { data: newStages, error: stagesError } = await supabase
        .from('web_flow_stages')
        .insert(stagesData)
        .select();

      if (stagesError) throw stagesError;

      // Criar automações se existirem (mapear FlowAutomationInput -> schema do banco)
      if (flowData.automations && flowData.automations.length > 0 && newStages && newStages.length > 0) {
        const automationsData = flowData.automations.map((automation) => {
          const sourceStage = newStages!.find((s) => s.name === automation.source_stage) ?? newStages![0];
          // target_flow_name no form é opcional; sem target usa o mesmo flow/stage
          const targetStage = sourceStage;
          return {
            source_flow_id: newFlow.id,
            source_stage_id: sourceStage.id,
            target_flow_id: newFlow.id,
            target_stage_id: targetStage.id,
            client_id: currentClient!.id,
            created_by: user!.id,
            name: automation.name,
            description: automation.description ?? null,
            action_type: automation.automation_type ?? 'duplicate',
            trigger_event: automation.trigger_condition ?? 'stage_change',
            visible_to_roles: automation.visible_to_roles ?? []
          };
        });

        const { error: automationsError } = await supabase
          .from('web_flow_automations')
          .insert(automationsData);

        if (automationsError) throw automationsError;
      }

      const completeFlow = {
        ...newFlow,
        stages: newStages
      };

      setState(prev => ({ 
        ...prev, 
        currentFlow: completeFlow,
        isLoading: false 
      }));

      return completeFlow;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao criar flow personalizado',
        isLoading: false 
      }));
      return null;
    }
  }, [user, currentClient]);

  // =====================================================
  // ADICIONAR STAGE A UM FLOW EXISTENTE
  // =====================================================
  const addStageToFlow = useCallback(async (
    flowId: string, 
    stageData: Omit<FlowStage, 'id' | 'flow_id' | 'created_at' | 'updated_at'>
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: newStage, error } = await supabase
        .from('web_flow_stages')
        .insert({
          flow_id: flowId,
          ...stageData
        })
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({ ...prev, isLoading: false }));
      return newStage;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao adicionar stage',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  // =====================================================
  // CONFIGURAR AUTOMAÇÃO DE DUPLICAÇÃO
  // =====================================================
  const configureAutomation = useCallback(async (
    sourceFlowId: string,
    sourceStageId: string,
    automationConfig: {
      name: string;
      description?: string;
      automation_type: 'duplicate' | 'move' | 'notify';
      trigger_condition: 'stage_change' | 'time_based' | 'field_change';
      target_flow_name?: string;
      visible_to_roles?: string[];
    }
  ) => {
    if (!currentClient?.id || !user?.id) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Mapear form -> schema do banco (action_type, trigger_event, client_id, created_by, target_flow_id, target_stage_id)
      const insertData = {
        source_flow_id: sourceFlowId,
        source_stage_id: sourceStageId,
        target_flow_id: sourceFlowId,
        target_stage_id: sourceStageId,
        client_id: currentClient.id,
        created_by: user.id,
        name: automationConfig.name,
        description: automationConfig.description ?? null,
        action_type: automationConfig.automation_type,
        trigger_event: automationConfig.trigger_condition,
        visible_to_roles: automationConfig.visible_to_roles ?? []
      };

      const { data: automation, error } = await supabase
        .from('web_flow_automations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({ ...prev, isLoading: false }));
      return automation;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao configurar automação',
        isLoading: false 
      }));
      return null;
    }
  }, [currentClient?.id, user?.id]);

  // =====================================================
  // SALVAR FLOW COMO TEMPLATE
  // =====================================================
  const saveAsTemplate = useCallback(async (
    flowId: string, 
    templateName: string, 
    templateDescription: string,
    category: string = 'custom'
  ) => {
    if (!currentClient?.id) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Buscar flow completo
      const { data: flow, error: flowError } = await supabase
        .from('web_flows')
        .select(`
          *,
          stages:web_flow_stages(*),
          automations:web_flow_automations(*)
        `)
        .eq('id', flowId)
        .single();

      if (flowError) throw flowError;

      // Montar template data
      const templateData = {
        flow: {
          name: templateName,
          description: templateDescription
        },
        stages: flow.stages,
        automations: flow.automations
      };

      // Insert em web_flow_templates (tabela não está no Database gerado; cast bypassa validação)
      const insertPayload = {
        client_id: currentClient!.id,
        name: templateName,
        description: templateDescription,
        category,
        is_system_template: false,
        template_data: templateData
      };
      const { data: template, error: templateError } = await supabase
        .from('web_flow_templates' as 'web_flows')
        .insert(insertPayload as never)
        .select()
        .single();

      if (templateError) throw templateError;

      setState(prev => ({ ...prev, isLoading: false }));
      return template;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao salvar template',
        isLoading: false 
      }));
      return null;
    }
  }, [currentClient?.id]);

  return {
    ...state,
    loadTemplates,
    createFlowFromTemplate,
    createCustomFlow,
    addStageToFlow,
    configureAutomation,
    saveAsTemplate
  };
}