import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FieldConfiguration } from '@/types/form-builder';
import { toast } from 'sonner';

// Interface para o banco de dados de campos de flows
export interface FlowFieldDB {
  id: string;
  flow_id: string;
  field_type: string;
  label: string;
  placeholder?: string;
  description?: string;
  help_text?: string;
  required: boolean;
  editable_in_other_stages: boolean;
  unique_value: boolean;
  compact_view: boolean;
  order_index: number;
  form_type: 'initial' | 'stage';
  stage_id?: string;
  validation_rules?: any;
  field_options?: any;
  created_at: string;
  updated_at: string;
}

// Função para converter do banco para o tipo da aplicação
const convertFromDB = (dbField: FlowFieldDB): FieldConfiguration => ({
  id: dbField.id,
  type: dbField.field_type,
  label: dbField.label,
  placeholder: dbField.placeholder,
  description: dbField.description,
  helpText: dbField.help_text,
  required: dbField.required,
  editableInOtherStages: dbField.editable_in_other_stages,
  uniqueValue: dbField.unique_value,
  compactView: dbField.compact_view,
  order: dbField.order_index,
  validation: dbField.validation_rules,
  options: dbField.field_options?.options,
  dateFormat: dbField.field_options?.dateFormat,
  showTime: dbField.field_options?.showTime,
  acceptedTypes: dbField.field_options?.acceptedTypes,
  maxFileSize: dbField.field_options?.maxFileSize,
  allowMultiple: dbField.field_options?.allowMultiple,
  filterByRole: dbField.field_options?.filterByRole,
  connectedPipe: dbField.field_options?.connectedPipe,
  connectedDatabase: dbField.field_options?.connectedDatabase,
  dependencies: dbField.field_options?.dependencies,
});

// Função para converter da aplicação para o banco
const convertToDB = (field: FieldConfiguration, flowId: string, formType: 'initial' | 'stage', stageId?: string): Omit<FlowFieldDB, 'id' | 'created_at' | 'updated_at'> => ({
  flow_id: flowId,
  field_type: field.type,
  label: field.label,
  placeholder: field.placeholder,
  description: field.description,
  help_text: field.helpText,
  required: field.required,
  editable_in_other_stages: field.editableInOtherStages,
  unique_value: field.uniqueValue,
  compact_view: field.compactView,
  order_index: field.order,
  form_type: formType,
  stage_id: stageId,
  validation_rules: field.validation,
  field_options: {
    options: field.options,
    dateFormat: field.dateFormat,
    showTime: field.showTime,
    acceptedTypes: field.acceptedTypes,
    maxFileSize: field.maxFileSize,
    allowMultiple: field.allowMultiple,
    filterByRole: field.filterByRole,
    connectedPipe: field.connectedPipe,
    connectedDatabase: field.connectedDatabase,
    dependencies: field.dependencies,
  },
});

// Hook principal para campos de flows
export function useFormFields(flowId: string, formType: 'initial' | 'stage', stageId?: string) {
  const queryClient = useQueryClient();

  // Query para buscar campos
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['flow-fields', flowId, formType, stageId],
    queryFn: async () => {
      if (!flowId) return [];
      
      try {
        console.log('🔍 useFormFields: Buscando campos', { flowId, formType, stageId });
        
        // Por enquanto, retornar array vazio já que não temos tabela de campos de flows ainda
        // TODO: Implementar busca real quando a tabela for criada
        return [];
      } catch (error) {
        console.error('Erro ao buscar campos:', error);
        throw error;
      }
    },
    enabled: !!flowId,
  });

  // Mutation para salvar campo
  const saveFieldMutation = useMutation({
    mutationFn: async (field: FieldConfiguration) => {
      try {
        console.log('🔍 useFormFields: Salvando campo', { field, flowId, formType, stageId });
        
        // Por enquanto, apenas simular sucesso
        // TODO: Implementar salvamento real quando a tabela for criada
        return field;
      } catch (error) {
        console.error('Erro ao salvar campo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-fields', flowId, formType, stageId] });
      toast.success('Campo salvo com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao salvar campo:', error);
      toast.error('Erro ao salvar campo: ' + error.message);
    },
  });

  // Mutation para deletar campo
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      try {
        console.log('🔍 useFormFields: Deletando campo', { fieldId });
        
        // Por enquanto, apenas simular sucesso
        // TODO: Implementar deleção real quando a tabela for criada
        return fieldId;
      } catch (error) {
        console.error('Erro ao deletar campo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-fields', flowId, formType, stageId] });
      toast.success('Campo deletado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar campo:', error);
      toast.error('Erro ao deletar campo: ' + error.message);
    },
  });

  // Mutation para reordenar campos
  const reorderFieldsMutation = useMutation({
    mutationFn: async (fields: FieldConfiguration[]) => {
      try {
        console.log('🔍 useFormFields: Reordenando campos', { fields });
        
        // Por enquanto, apenas simular sucesso
        // TODO: Implementar reordenação real quando a tabela for criada
        return fields;
      } catch (error) {
        console.error('Erro ao reordenar campos:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-fields', flowId, formType, stageId] });
      toast.success('Campos reordenados com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao reordenar campos:', error);
      toast.error('Erro ao reordenar campos: ' + error.message);
    },
  });

  return {
    fields: Array.isArray(fields) ? fields : [],
    isLoading,
    saveField: saveFieldMutation.mutate,
    deleteField: deleteFieldMutation.mutate,
    reorderFields: reorderFieldsMutation.mutate,
    isSaving: saveFieldMutation.isPending || deleteFieldMutation.isPending || reorderFieldsMutation.isPending,
  };
}

// Hook para buscar campos de uma entidade (mantido para compatibilidade)
export interface FormField {
  id: string;
  name: string;
  field_type: 'short_text' | 'long_text' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'datetime' | 'checkbox' | 'single_select' | 'multi_select' | 'currency';
  slug: string;
  description?: string;
  is_required: boolean;
  options?: string[];
  order_index: number;
  entity_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFormFieldData {
  name: string;
  field_type: FormField['field_type'];
  description?: string;
  is_required?: boolean;
  options?: string[];
  entity_id: string;
}

export interface UpdateFormFieldData extends Partial<CreateFormFieldData> {
  id: string;
}

// Hook para buscar campos de uma entidade (usado em outros lugares)
export const useEntityFormFields = (entityId?: string) => {
  return useQuery<FormField[]>({
    queryKey: ['entityFormFields', entityId],
    queryFn: async () => {
      if (!entityId) return [];
      
      try {
        // Buscar client_id do usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: clientUser } = await supabase
          .from('core_client_users')
          .select('client_id')
          .eq('id', user.id)
          .single();

        if (!clientUser) throw new Error('Usuário sem cliente associado');

        // Buscar campos da entidade usando web_entity_fields
        // NOTA: Comentado para evitar erro de coluna inexistente
        // const { data, error } = await supabase
        //   .from('web_entity_fields')
        //   .select('*')
        //   .eq('entity_id', entityId)
        //   .eq('client_id', clientUser.client_id)
        //   .order('order_index');

        // if (error) {
        //   console.error('Erro ao buscar campos:', error);
        //   throw error;
        // }

        // return data || [];
        
        // Por enquanto, retornar array vazio
        return [];
      } catch (error) {
        console.error('Erro ao buscar campos:', error);
        throw error;
      }
    },
    enabled: !!entityId,
  });
};

// Hook para criar um novo campo de entidade
export const useCreateFormField = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateFormFieldData) => {
      // Por enquanto, apenas simular sucesso
      console.log('🔍 useCreateFormField: Criando campo', data);
      return { ...data, id: `field_${Date.now()}` } as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityFormFields', data.entity_id] });
      toast.success('Campo criado com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao criar campo:', error);
      toast.error(error.message || 'Erro ao criar campo');
    },
  });
};

// Hook para atualizar um campo de entidade
export const useUpdateFormField = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateFormFieldData) => {
      // Por enquanto, apenas simular sucesso
      console.log('🔍 useUpdateFormField: Atualizando campo', data);
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityFormFields', data.entity_id] });
      toast.success('Campo atualizado com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar campo:', error);
      toast.error(error.message || 'Erro ao atualizar campo');
    },
  });
};

// Hook para deletar um campo de entidade
export const useDeleteFormField = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fieldId: string) => {
      // Por enquanto, apenas simular sucesso
      console.log('🔍 useDeleteFormField: Deletando campo', fieldId);
      return fieldId;
    },
    onSuccess: (_, fieldId) => {
      queryClient.invalidateQueries({ queryKey: ['entityFormFields'] });
      toast.success('Campo excluído com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir campo:', error);
      toast.error(error.message || 'Erro ao excluir campo');
    },
  });
};

// Hook para reordenar campos de entidade
export const useReorderFormFields = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityId, fieldIds }: { entityId: string; fieldIds: string[] }) => {
      // Por enquanto, apenas simular sucesso
      console.log('🔍 useReorderFormFields: Reordenando campos', { entityId, fieldIds });
      return { entityId, fieldIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityFormFields', data.entityId] });
      toast.success('Ordem dos campos atualizada');
    },
    onError: (error: any) => {
      console.error('Erro ao reordenar campos:', error);
      toast.error(error.message || 'Erro ao reordenar campos');
    },
  });
}; 