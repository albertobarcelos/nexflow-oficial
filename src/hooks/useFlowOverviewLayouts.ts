import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { 
  FlowOverviewLayout, 
  FlowOverviewSection, 
  FlowOverviewField,
  LayoutConfigurationState 
} from '@/types/flow-layouts';

// Hook principal para gerenciar layout de um flow específico
export function useFlowOverviewLayout(flowId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar layout existente
  const { data: layout, isLoading, error } = useQuery({
    queryKey: ['flow-overview-layout', flowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('web_flow_overview_layouts')
        .select('*')
        .eq('flow_id', flowId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Se não encontrar layout, retornar dados mockados para teste
      if (!data && flowId === 'flow-mock-001') {
        return {
          id: 'mock-layout-1',
          flow_id: flowId,
          layout_name: 'Visão Geral - Vendas',
          columns_count: 1,
          sections: [
            {
              id: 'section_1',
              title: 'Informações do Cliente',
              column: 1,
              order: 0,
              collapsed: false,
              fields: [
                {
                  id: 'field_cliente_nome',
                  label: 'Nome do Cliente',
                  type: 'text' as const,
                  required: true,
                  unique: false,
                  placeholder: 'Digite o nome completo do cliente',
                  width: 'full' as const,
                  order: 0,
                  validation: {}
                },
                {
                  id: 'field_cliente_email',
                  label: 'Email',
                  type: 'email' as const,
                  required: true,
                  unique: false,
                  placeholder: 'cliente@empresa.com',
                  width: 'half' as const,
                  order: 1,
                  validation: {}
                },
                {
                  id: 'field_cliente_telefone',
                  label: 'Telefone',
                  type: 'phone' as const,
                  required: false,
                  unique: false,
                  placeholder: '(11) 99999-9999',
                  width: 'half' as const,
                  order: 2,
                  validation: {}
                }
              ]
            },
            {
              id: 'section_2',
              title: 'Detalhes da Proposta',
              column: 1,
              order: 1,
              collapsed: false,
              fields: [
                {
                  id: 'field_servicos',
                  label: 'Serviços Contratados',
                  type: 'textarea' as const,
                  required: true,
                  unique: false,
                  placeholder: 'Descreva os serviços que serão prestados...',
                  width: 'full' as const,
                  order: 0,
                  validation: {}
                },
                {
                  id: 'field_valor_desconto',
                  label: 'Desconto',
                  type: 'percentage' as const,
                  required: false,
                  unique: false,
                  placeholder: 'Percentual de desconto',
                  width: 'half' as const,
                  order: 1,
                  validation: {}
                },
                {
                  id: 'field_data_validade',
                  label: 'Validade da Proposta',
                  type: 'date' as const,
                  required: false,
                  unique: false,
                  placeholder: '',
                  width: 'half' as const,
                  order: 2,
                  validation: {}
                }
              ]
            },
            {
              id: 'section_3',
              title: 'Informações Comerciais',
              column: 1,
              order: 2,
              collapsed: false,
              fields: [
                {
                  id: 'field_valor_negocio',
                  label: 'Valor do Negócio',
                  type: 'currency' as const,
                  required: true,
                  unique: false,
                  placeholder: 'Valor total da proposta',
                  width: 'full' as const,
                  order: 0,
                  validation: {}
                },
                {
                  id: 'field_probabilidade',
                  label: 'Probabilidade de Fechamento',
                  type: 'percentage' as const,
                  required: false,
                  unique: false,
                  placeholder: 'Estimativa de sucesso',
                  width: 'full' as const,
                  order: 1,
                  validation: {}
                },
                {
                  id: 'field_data_fechamento',
                  label: 'Data Prevista de Fechamento',
                  type: 'date' as const,
                  required: false,
                  unique: false,
                  placeholder: '',
                  width: 'full' as const,
                  order: 2,
                  validation: {}
                }
              ]
            },
            {
              id: 'section_4',
              title: 'Observações e Próximos Passos',
              column: 1,
              order: 3,
              collapsed: false,
              fields: [
                {
                  id: 'field_observacoes',
                  label: 'Observações Gerais',
                  type: 'textarea' as const,
                  required: false,
                  unique: false,
                  placeholder: 'Adicione observações importantes sobre este negócio...',
                  width: 'full' as const,
                  order: 0,
                  validation: {}
                },
                {
                  id: 'field_proximos_passos',
                  label: 'Próximos Passos',
                  type: 'textarea' as const,
                  required: false,
                  unique: false,
                  placeholder: 'Defina os próximos passos para este negócio...',
                  width: 'full' as const,
                  order: 1,
                  validation: {}
                },
                {
                  id: 'field_concorrencia',
                  label: 'Concorrência',
                  type: 'select' as const,
                  required: false,
                  unique: false,
                  placeholder: 'Selecione o nível de concorrência',
                  width: 'full' as const,
                  order: 2,
                  options: ['Baixa', 'Média', 'Alta', 'Não identificada'],
                  validation: {}
                }
              ]
            }
          ],
          available_fields: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as FlowOverviewLayout;
      }

      return data as FlowOverviewLayout | null;
    },
    enabled: !!flowId,
  });

  // Criar layout padrão se não existir
  const createDefaultLayout = useMutation({
    mutationFn: async (flowName: string) => {
      const defaultLayout = {
        flow_id: flowId,
        layout_name: 'Visão Geral',
        columns_count: 1,
        sections: [],
        available_fields: [],
      };

      const { data, error } = await supabase
        .from('web_flow_overview_layouts')
        .insert(defaultLayout)
        .select()
        .single();

      if (error) throw error;
      return data as FlowOverviewLayout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-overview-layout', flowId] });
      toast({
        title: 'Layout criado',
        description: 'Layout padrão criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar layout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar layout
  const updateLayout = useMutation({
    mutationFn: async (updatedLayout: Partial<FlowOverviewLayout>) => {
      const { data, error } = await supabase
        .from('web_flow_overview_layouts')
        .update(updatedLayout)
        .eq('flow_id', flowId)
        .select()
        .single();

      if (error) throw error;
      return data as FlowOverviewLayout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-overview-layout', flowId] });
      toast({
        title: 'Layout atualizado',
        description: 'Configurações salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar layout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    layout,
    isLoading,
    error,
    createDefaultLayout: createDefaultLayout.mutate,
    updateLayout: updateLayout.mutate,
    isCreating: createDefaultLayout.isPending,
    isUpdating: updateLayout.isPending,
  };
}

// Hook para gerenciar estado de configuração de layout
export function useLayoutConfiguration(initialLayout: FlowOverviewLayout | null) {
  const [state, setState] = useState<LayoutConfigurationState>({
    layout: initialLayout || {
      id: '',
      flow_id: '',
      layout_name: 'Visão Geral',
      columns_count: 1,
      sections: [],
      available_fields: [],
      created_at: '',
      updated_at: '',
    },
    isDirty: false,
    isLoading: false,
    error: undefined,
  });

  // Atualizar estado quando layout inicial muda
  useEffect(() => {
    if (initialLayout) {
      setState(prev => ({
        ...prev,
        layout: initialLayout,
        isDirty: false,
      }));
    }
  }, [initialLayout]);

  // Adicionar seção
  const addSection = useCallback((section: Omit<FlowOverviewSection, 'id' | 'order'>) => {
    setState(prev => {
      const newSection: FlowOverviewSection = {
        ...section,
        id: `section_${Date.now()}`,
        order: prev.layout.sections.length,
      };

      return {
        ...prev,
        layout: {
          ...prev.layout,
          sections: [...prev.layout.sections, newSection],
        },
        isDirty: true,
      };
    });
  }, []);

  // Remover seção
  const removeSection = useCallback((sectionId: string) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: prev.layout.sections.filter(s => s.id !== sectionId),
      },
      isDirty: true,
    }));
  }, []);

  // Atualizar seção
  const updateSection = useCallback((sectionId: string, updates: Partial<FlowOverviewSection>) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: prev.layout.sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        ),
      },
      isDirty: true,
    }));
  }, []);

  // Reordenar seções
  const reorderSections = useCallback((sections: FlowOverviewSection[]) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: sections.map((section, index) => ({
          ...section,
          order: index,
        })),
      },
      isDirty: true,
    }));
  }, []);

  // Adicionar campo a uma seção
  const addFieldToSection = useCallback((sectionId: string, field: Omit<FlowOverviewField, 'id'>) => {
    setState(prev => {
      const newField: FlowOverviewField = {
        ...field,
        id: `field_${Date.now()}`,
      };

      return {
        ...prev,
        layout: {
          ...prev.layout,
          sections: prev.layout.sections.map(section =>
            section.id === sectionId
              ? { ...section, fields: [...section.fields, newField] }
              : section
          ),
        },
        isDirty: true,
      };
    });
  }, []);

  // Remover campo de uma seção
  const removeFieldFromSection = useCallback((sectionId: string, fieldId: string) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: prev.layout.sections.map(section =>
          section.id === sectionId
            ? { ...section, fields: section.fields.filter(f => f.id !== fieldId) }
            : section
        ),
      },
      isDirty: true,
    }));
  }, []);

  // Atualizar campo
  const updateField = useCallback((sectionId: string, fieldId: string, updates: Partial<FlowOverviewField>) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: prev.layout.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                fields: section.fields.map(field =>
                  field.id === fieldId ? { ...field, ...updates } : field
                ),
              }
            : section
        ),
      },
      isDirty: true,
    }));
  }, []);

  // Resetar para estado inicial
  const resetLayout = useCallback(() => {
    if (initialLayout) {
      setState(prev => ({
        ...prev,
        layout: initialLayout,
        isDirty: false,
      }));
    }
  }, [initialLayout]);

  return {
    state,
    actions: {
      addSection,
      removeSection,
      updateSection,
      reorderSections,
      addFieldToSection,
      removeFieldFromSection,
      updateField,
      resetLayout,
    },
  };
}

// Hook para templates de layout
export function useLayoutTemplates() {
  // Por enquanto, templates hardcoded, mas pode vir do banco futuramente
  const templates = [
    {
      id: 'vendas-basico',
      name: 'Vendas Básico',
      description: 'Layout padrão para processos de vendas',
      category: 'vendas' as const,
      icon: 'TrendingUp',
      sections: [
        {
          title: 'Informações do Cliente',
          collapsed: false,
          fields: [],
          column: 1 as const,
        },
        {
          title: 'Detalhes da Proposta',
          collapsed: false,
          fields: [],
          column: 2 as const,
        },
      ],
      fields: [
        { type: 'text' as const, label: 'Nome do Cliente', required: true },
        { type: 'email' as const, label: 'Email', required: true },
        { type: 'phone' as const, label: 'Telefone', required: false },
        { type: 'currency' as const, label: 'Valor da Proposta', required: true },
        { type: 'date' as const, label: 'Data de Fechamento', required: false },
        { type: 'textarea' as const, label: 'Observações', required: false },
      ],
    },
    {
      id: 'imobiliaria-basico',
      name: 'Imobiliária Básico',
      description: 'Layout para negócios imobiliários',
      category: 'imobiliaria' as const,
      icon: 'Home',
      sections: [
        {
          title: 'Dados do Imóvel',
          collapsed: false,
          fields: [],
          column: 1 as const,
        },
        {
          title: 'Informações do Cliente',
          collapsed: false,
          fields: [],
          column: 2 as const,
        },
      ],
      fields: [
        { type: 'text' as const, label: 'Endereço do Imóvel', required: true },
        { type: 'select' as const, label: 'Tipo de Imóvel', required: true, options: ['Casa', 'Apartamento', 'Terreno', 'Comercial'] },
        { type: 'currency' as const, label: 'Valor do Imóvel', required: true },
        { type: 'text' as const, label: 'Nome do Interessado', required: true },
        { type: 'phone' as const, label: 'Telefone', required: true },
        { type: 'textarea' as const, label: 'Observações', required: false },
      ],
    },
  ];

  return { templates };
} 