// =====================================================
// HOOK PARA CONSTRUÇÃO MODULAR DE FLOWS
// =====================================================
// AIDEV-NOTE: Hook principal para criação e gestão de flows modulares
// Permite que usuários criem flows personalizados com automações

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/database';

type FlowStage = Database['public']['Tables']['web_flow_stages']['Row'];
type FlowTemplate = Database['public']['Tables']['web_flow_templates']['Row'];
type FlowAutomation = Database['public']['Tables']['web_flow_automations']['Row'];

interface CreateFlowData {
  name: string;
  description?: string;
  stages: Omit<FlowStage, 'id' | 'flow_id' | 'created_at' | 'updated_at'>[];
  automations?: Omit<FlowAutomation, 'id' | 'source_flow_id' | 'created_at' | 'updated_at'>[];
}

interface FlowBuilderState {
  isLoading: boolean;
  error: string | null;
  currentFlow: any | null;
  templates: FlowTemplate[];
}

export function useFlowBuilder() {
  const { user } = useAuth();
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
    if (!user?.client_id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('web_flow_templates')
        .select('*')
        .or(`client_id.eq.${user.client_id},is_system_template.eq.true`)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        templates: data || [],
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao carregar templates',
        isLoading: false 
      }));
    }
  }, [user?.client_id]);

  // =====================================================
  // CRIAR FLOW A PARTIR DE TEMPLATE
  // =====================================================
  const createFlowFromTemplate = useCallback(async (templateId: string, customName?: string) => {
    if (!user?.client_id) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Buscar template
      const { data: template, error: templateError } = await supabase
        .from('web_flow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;
      if (!template) throw new Error('Template não encontrado');

      const templateData = template.template_data as any;
      
      // Criar flow
      const flowData = {
        client_id: user.client_id,
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

      // Criar stages
      const stagesData = templateData.stages.map((stage: any) => ({
        flow_id: newFlow.id,
        name: stage.name,
        description: stage.description,
        color: stage.color,
        order_index: stage.order_index,
        stage_type: stage.stage_type,
        is_final_stage: stage.is_final_stage || false
      }));

      const { data: newStages, error: stagesError } = await supabase
        .from('web_flow_stages')
        .insert(stagesData)
        .select();

      if (stagesError) throw stagesError;

      // Criar automações se existirem
      if (templateData.automations && templateData.automations.length > 0) {
        const automationsData = templateData.automations.map((automation: any) => {
          const sourceStage = newStages?.find(s => s.name === automation.source_stage);
          return {
            source_flow_id: newFlow.id,
            source_stage_id: sourceStage?.id,
            automation_type: automation.automation_type,
            trigger_condition: automation.trigger_condition,
            target_flow_name: automation.target_flow_name,
            visible_to_roles: automation.visible_to_roles,
            name: automation.name,
            description: automation.description
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
  }, [user]);

  // =====================================================
  // CRIAR FLOW PERSONALIZADO DO ZERO
  // =====================================================
  const createCustomFlow = useCallback(async (flowData: CreateFlowData) => {
    if (!user?.client_id) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Criar flow
      const { data: newFlow, error: flowError } = await supabase
        .from('web_flows')
        .insert({
          client_id: user.client_id,
          name: flowData.name,
          description: flowData.description,
          created_by: user.id
        })
        .select()
        .single();

      if (flowError) throw flowError;

      // Criar stages
      const stagesData = flowData.stages.map(stage => ({
        flow_id: newFlow.id,
        ...stage
      }));

      const { data: newStages, error: stagesError } = await supabase
        .from('web_flow_stages')
        .insert(stagesData)
        .select();

      if (stagesError) throw stagesError;

      // Criar automações se existirem
      if (flowData.automations && flowData.automations.length > 0) {
        const automationsData = flowData.automations.map(automation => ({
          source_flow_id: newFlow.id,
          ...automation
        }));

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
  }, [user]);

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
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: automation, error } = await supabase
        .from('web_flow_automations')
        .insert({
          source_flow_id: sourceFlowId,
          source_stage_id: sourceStageId,
          ...automationConfig
        })
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
  }, []);

  // =====================================================
  // SALVAR FLOW COMO TEMPLATE
  // =====================================================
  const saveAsTemplate = useCallback(async (
    flowId: string, 
    templateName: string, 
    templateDescription: string,
    category: string = 'custom'
  ) => {
    if (!user?.client_id) return null;

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

      const { data: template, error: templateError } = await supabase
        .from('web_flow_templates')
        .insert({
          client_id: user.client_id,
          name: templateName,
          description: templateDescription,
          category,
          is_system_template: false,
          template_data: templateData
        })
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
  }, [user?.client_id]);

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