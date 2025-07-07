import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FieldConfiguration } from '@/types/form-builder';
import { toast } from 'sonner';

// Tipos para o banco de dados
interface FormFieldDB {
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
const convertFromDB = (dbField: FormFieldDB): FieldConfiguration => ({
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
const convertToDB = (field: FieldConfiguration, flowId: string, formType: 'initial' | 'stage', stageId?: string): Omit<FormFieldDB, 'id' | 'created_at' | 'updated_at'> => ({
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

export function useFormFields(flowId: string, formType: 'initial' | 'stage' = 'initial', stageId?: string) {
  const queryClient = useQueryClient();

  // Query para buscar campos
  const { data: fields = [], isLoading, error } = useQuery({
    queryKey: ['form-fields', flowId, formType, stageId],
    queryFn: async () => {
      let query = supabase
        .from('web_entity_fields')
        .select('*')
        .eq('flow_id', flowId)
        .eq('form_type', formType)
        .order('order_index');

      if (formType === 'stage' && stageId) {
        query = query.eq('stage_id', stageId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar campos:', error);
        throw error;
      }

      return data?.map(convertFromDB) || [];
    },
    enabled: !!flowId,
  });

  // Mutation para salvar campo
  const saveFieldMutation = useMutation({
    mutationFn: async (field: FieldConfiguration) => {
      const fieldData = convertToDB(field, flowId, formType, stageId);

      if (field.id.startsWith('field_')) {
        // Novo campo
        const { data, error } = await supabase
          .from('web_entity_fields')
          .insert(fieldData)
          .select()
          .single();

        if (error) throw error;
        return convertFromDB(data);
      } else {
        // Campo existente
        const { data, error } = await supabase
          .from('web_entity_fields')
          .update(fieldData)
          .eq('id', field.id)
          .select()
          .single();

        if (error) throw error;
        return convertFromDB(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', flowId, formType, stageId] });
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
      const { error } = await supabase
        .from('web_entity_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', flowId, formType, stageId] });
      toast.success('Campo removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar campo:', error);
      toast.error('Erro ao remover campo: ' + error.message);
    },
  });

  // Mutation para reordenar campos
  const reorderFieldsMutation = useMutation({
    mutationFn: async (reorderedFields: FieldConfiguration[]) => {
      const updates = reorderedFields.map((field, index) => ({
        id: field.id,
        order_index: index,
      }));

      const { error } = await supabase
        .from('web_entity_fields')
        .upsert(updates);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', flowId, formType, stageId] });
    },
    onError: (error: any) => {
      console.error('Erro ao reordenar campos:', error);
      toast.error('Erro ao reordenar campos: ' + error.message);
    },
  });

  return {
    fields,
    isLoading,
    error,
    saveField: saveFieldMutation.mutate,
    deleteField: deleteFieldMutation.mutate,
    reorderFields: reorderFieldsMutation.mutate,
    isSaving: saveFieldMutation.isPending,
    isDeleting: deleteFieldMutation.isPending,
    isReordering: reorderFieldsMutation.isPending,
  };
} 