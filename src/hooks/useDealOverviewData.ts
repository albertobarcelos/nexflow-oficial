import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { DealOverviewData, FlowOverviewField } from '@/types/flow-layouts';

// Hook para gerenciar dados de overview de um deal específico
export function useDealOverviewData(dealId: string, fields: FlowOverviewField[]) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<DealOverviewData>({});
  const [isDirty, setIsDirty] = useState(false);

  // Buscar dados existentes do deal
  const { data: dealData, isLoading } = useQuery({
    queryKey: ['deal-overview-data', dealId],
    queryFn: async () => {
      // Buscar dados básicos do deal
      const { data: deal, error: dealError } = await supabase
        .from('web_deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (dealError) throw dealError;

      // Buscar campos personalizados do deal
      const { data: customFields, error: customFieldsError } = await supabase
        .from('web_deal_custom_fields')
        .select('*')
        .eq('deal_id', dealId);

      if (customFieldsError) throw customFieldsError;

      // Combinar dados básicos com campos personalizados
      const combinedData: DealOverviewData = {
        // Dados básicos do deal
        title: deal.title,
        value: deal.value,
        stage_id: deal.stage_id,
        company_id: deal.company_id,
        person_id: deal.person_id,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
      };

      // Adicionar campos personalizados
      customFields.forEach(field => {
        combinedData[field.field_id] = field.field_value;
      });

      return combinedData;
    },
    enabled: !!dealId,
  });

  // Sincronizar dados locais com dados do servidor
  useEffect(() => {
    if (dealData) {
      setLocalData(dealData);
      setIsDirty(false);
    }
  }, [dealData]);

  // Atualizar valor de campo localmente
  const updateFieldValue = useCallback((fieldId: string, value: any) => {
    setLocalData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
    setIsDirty(true);
  }, []);

  // Salvar alterações no servidor
  const saveChanges = useMutation({
    mutationFn: async (data: DealOverviewData) => {
      const updates: Array<Promise<any>> = [];

      // Campos básicos do deal que podem ser atualizados
      const basicFields = ['title', 'value', 'stage_id', 'company_id', 'person_id'];
      const basicUpdates: any = {};
      
      basicFields.forEach(field => {
        if (data[field] !== undefined) {
          basicUpdates[field] = data[field];
        }
      });

      // Atualizar dados básicos se houver alterações
      if (Object.keys(basicUpdates).length > 0) {
        updates.push(
          supabase
            .from('web_deals')
            .update(basicUpdates)
            .eq('id', dealId)
        );
      }

      // Atualizar campos personalizados
      for (const field of fields) {
        if (data[field.id] !== undefined) {
          // Verificar se o campo já existe
          const { data: existingField } = await supabase
            .from('web_deal_custom_fields')
            .select('id')
            .eq('deal_id', dealId)
            .eq('field_id', field.id)
            .single();

          if (existingField) {
            // Atualizar campo existente
            updates.push(
              supabase
                .from('web_deal_custom_fields')
                .update({ field_value: data[field.id] })
                .eq('deal_id', dealId)
                .eq('field_id', field.id)
            );
          } else {
            // Criar novo campo
            updates.push(
              supabase
                .from('web_deal_custom_fields')
                .insert({
                  deal_id: dealId,
                  field_id: field.id,
                  field_value: data[field.id],
                })
            );
          }
        }
      }

      // Executar todas as atualizações
      const results = await Promise.all(updates);
      
      // Verificar se houve erros
      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
      }

      return data;
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['deal-overview-data', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: 'Dados salvos',
        description: 'Alterações salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Descartar alterações locais
  const discardChanges = useCallback(() => {
    if (dealData) {
      setLocalData(dealData);
      setIsDirty(false);
    }
  }, [dealData]);

  // Validar dados antes de salvar
  const validateData = useCallback(() => {
    const errors: string[] = [];

    fields.forEach(field => {
      const value = localData[field.id];
      
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} é obrigatório`);
      }

      if (field.validation) {
        const validation = field.validation;
        
        if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
          errors.push(`${field.label} deve ser maior que ${validation.min}`);
        }
        
        if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
          errors.push(`${field.label} deve ser menor que ${validation.max}`);
        }
        
        if (validation.pattern && typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
          errors.push(validation.message || `${field.label} tem formato inválido`);
        }
      }
    });

    return errors;
  }, [localData, fields]);

  // Salvar com validação
  const saveWithValidation = useCallback(() => {
    const errors = validateData();
    
    if (errors.length > 0) {
      toast({
        title: 'Erro de validação',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    saveChanges.mutate(localData);
  }, [localData, validateData, saveChanges, toast]);

  return {
    data: localData,
    originalData: dealData,
    isLoading,
    isDirty,
    isSaving: saveChanges.isPending,
    updateFieldValue,
    saveChanges: saveWithValidation,
    discardChanges,
    validateData,
  };
}

// Hook para buscar opções de select/multiselect dinamicamente
export function useFieldOptions(fieldId: string, fieldType: string) {
  return useQuery({
    queryKey: ['field-options', fieldId, fieldType],
    queryFn: async () => {
      // Por enquanto, retornar opções estáticas
      // Futuramente pode buscar do banco de dados
      const staticOptions: Record<string, string[]> = {
        'tipo_imovel': ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Rural'],
        'status_cliente': ['Novo', 'Qualificado', 'Proposta', 'Negociação', 'Fechado'],
        'origem_lead': ['Site', 'Indicação', 'Redes Sociais', 'Telefone', 'Email'],
        'prioridade': ['Baixa', 'Média', 'Alta', 'Urgente'],
      };

      return staticOptions[fieldId] || [];
    },
    enabled: fieldType === 'select' || fieldType === 'multiselect' || fieldType === 'radio',
  });
} 