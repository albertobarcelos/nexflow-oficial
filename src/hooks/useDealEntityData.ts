import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Tipos
export interface EntityField {
  id: string;
  entity_id: string;
  name: string;
  slug: string;
  field_type: string;
  is_required: boolean;
  options: any[];
  order_index: number;
}

export interface EntityRecord {
  id: string;
  entity_id: string;
  title: string;
  data: Record<string, any>;
  status: string;
}

export interface DealEntityData {
  id: string;
  deal_id: string;
  entity_id: string;
  record_id: string;
  is_primary: boolean;
  entity_name?: string;
  entity_slug?: string;
  record?: EntityRecord;
  fields?: EntityField[];
}

export interface CreateEntityRecordData {
  entityId: string;
  title: string;
  data: Record<string, any>;
  isPrimary?: boolean;
}

const CLIENT_ID = 'beed91e3-20f3-4089-bf42-1d0fd92b41d5';

export function useDealEntityData(dealId: string) {
  const queryClient = useQueryClient();

  // Query para buscar dados das entidades vinculadas ao deal
  const { data: dealEntities = [], isLoading } = useQuery({
    queryKey: ['deal-entity-data', dealId],
    queryFn: async () => {
      if (!dealId) return [];

      try {
        // Buscar vinculações do deal com entidades
        const { data: dealEntityLinks, error: linksError } = await supabase
          .from('web_deal_entity_data')
          .select(`
            id,
            deal_id,
            entity_id,
            record_id,
            is_primary
          `)
          .eq('deal_id', dealId);

        if (linksError) throw linksError;

        if (!dealEntityLinks || dealEntityLinks.length === 0) {
          return [];
        }

        // Buscar dados das entidades
        const entityIds = [...new Set(dealEntityLinks.map(link => link.entity_id))];
        const { data: entities, error: entitiesError } = await supabase
          .from('web_entities')
          .select('id, name, slug')
          .in('id', entityIds);

        if (entitiesError) throw entitiesError;

        // Buscar registros das entidades
        const recordIds = dealEntityLinks.map(link => link.record_id);
        const { data: records, error: recordsError } = await supabase
          .from('web_entity_records')
          .select('id, entity_id, title, data, status')
          .in('id', recordIds);

        if (recordsError) throw recordsError;

        // Buscar campos das entidades
        const { data: fields, error: fieldsError } = await supabase
          .from('web_entity_fields')
          .select('id, entity_id, name, slug, field_type, is_required, options, order_index')
          .in('entity_id', entityIds)
          .order('order_index');

        if (fieldsError) throw fieldsError;

        // Combinar dados
        const result: DealEntityData[] = dealEntityLinks.map(link => {
          const entity = entities?.find(e => e.id === link.entity_id);
          const record = records?.find(r => r.id === link.record_id);
          const entityFields = fields?.filter(f => f.entity_id === link.entity_id) || [];

          return {
            ...link,
            entity_name: entity?.name,
            entity_slug: entity?.slug,
            record,
            fields: entityFields
          };
        });

        return result;
      } catch (error) {
        console.error('Erro ao buscar dados das entidades do deal:', error);
        return [];
      }
    },
    enabled: !!dealId,
  });

  // Query para buscar campos de uma entidade específica
  const getEntityFields = async (entityId: string): Promise<EntityField[]> => {
    try {
      const { data, error } = await supabase
        .from('web_entity_fields')
        .select('id, entity_id, name, slug, field_type, is_required, options, order_index')
        .eq('entity_id', entityId)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar campos da entidade:', error);
      return [];
    }
  };

  // Mutation para criar registro de entidade e vincular ao deal
  const createEntityRecordMutation = useMutation({
    mutationFn: async (recordData: CreateEntityRecordData) => {
      try {
        // 1. Criar registro da entidade
        const { data: newRecord, error: recordError } = await supabase
          .from('web_entity_records')
          .insert({
            entity_id: recordData.entityId,
            client_id: CLIENT_ID,
            title: recordData.title,
            data: recordData.data,
            status: 'active'
          })
          .select()
          .single();

        if (recordError) throw recordError;

        // 2. Vincular ao deal
        const { data: newLink, error: linkError } = await supabase
          .from('web_deal_entity_data')
          .insert({
            deal_id: dealId,
            entity_id: recordData.entityId,
            record_id: newRecord.id,
            is_primary: recordData.isPrimary || false
          })
          .select()
          .single();

        if (linkError) throw linkError;

        return { record: newRecord, link: newLink };
      } catch (error) {
        console.error('Erro ao criar registro da entidade:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-entity-data', dealId] });
      toast.success('Dados da entidade salvos com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao salvar dados da entidade:', error);
      toast.error('Erro ao salvar dados da entidade: ' + error.message);
    },
  });

  // Mutation para atualizar registro de entidade
  const updateEntityRecordMutation = useMutation({
    mutationFn: async ({ recordId, title, data }: { recordId: string; title: string; data: Record<string, any> }) => {
      try {
        const { data: updatedRecord, error } = await supabase
          .from('web_entity_records')
          .update({
            title,
            data,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId)
          .select()
          .single();

        if (error) throw error;
        return updatedRecord;
      } catch (error) {
        console.error('Erro ao atualizar registro da entidade:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-entity-data', dealId] });
      toast.success('Dados da entidade atualizados com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar dados da entidade:', error);
      toast.error('Erro ao atualizar dados da entidade: ' + error.message);
    },
  });

  // Mutation para remover entidade do deal
  const removeEntityFromDealMutation = useMutation({
    mutationFn: async (dealEntityId: string) => {
      try {
        const { error } = await supabase
          .from('web_deal_entity_data')
          .delete()
          .eq('id', dealEntityId);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao remover entidade do deal:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-entity-data', dealId] });
      toast.success('Entidade removida do deal com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover entidade do deal:', error);
      toast.error('Erro ao remover entidade do deal: ' + error.message);
    },
  });

  return {
    dealEntities,
    isLoading,
    getEntityFields,
    createEntityRecord: createEntityRecordMutation.mutate,
    updateEntityRecord: updateEntityRecordMutation.mutate,
    removeEntityFromDeal: removeEntityFromDealMutation.mutate,
    isCreating: createEntityRecordMutation.isPending,
    isUpdating: updateEntityRecordMutation.isPending,
    isRemoving: removeEntityFromDealMutation.isPending,
  };
} 