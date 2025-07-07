import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";
import {
  Entity,
  EntityInsert,
  EntityUpdate,
  EntityField,
  EntityFieldInsert,
  EntityFieldUpdate,
  EntityRecord,
  EntityRecordInsert,
  EntityRecordUpdate,
  EntityWithFields,
  EntityRecordWithData,
} from "@/types/entities";
import { mockEntity, mockRecords } from "@/test/mockEntityData";

// Hook principal para entidades
export function useEntities() {
  const queryClient = useQueryClient();

  // Buscar todas as entidades do cliente
  const entitiesQuery = useQuery({
    queryKey: ["entities"],
    queryFn: async () => {
      const user = await getCurrentUserData();
      if (!user?.client_id) throw new Error("Cliente não encontrado");

      const { data, error } = await supabase
        .from("web_entities")
        .select(
          `
          *,
          fields:web_entity_fields(*)
        `
        )
        .eq("client_id", user.client_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as EntityWithFields[];
    },
  });

  // Criar entidade
  const createEntityMutation = useMutation({
    mutationFn: async (entityData: Omit<EntityInsert, "client_id">) => {
      const user = await getCurrentUserData();
      if (!user?.client_id) throw new Error("Cliente não encontrado");

      const { data, error } = await supabase
        .from("web_entities")
        .insert({
          ...entityData,
          client_id: user.client_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Entity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  // Atualizar entidade
  const updateEntityMutation = useMutation({
    mutationFn: async ({ id, ...updates }: EntityUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("web_entities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Entity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  // Deletar entidade (soft delete)
  const deleteEntityMutation = useMutation({
    mutationFn: async (entityId: string) => {
      const { error } = await supabase
        .from("web_entities")
        .update({ is_active: false })
        .eq("id", entityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  return {
    entities: entitiesQuery.data || [],
    isLoading: entitiesQuery.isLoading,
    error: entitiesQuery.error,
    createEntity: createEntityMutation.mutateAsync,
    updateEntity: updateEntityMutation.mutateAsync,
    deleteEntity: deleteEntityMutation.mutateAsync,
    isCreating: createEntityMutation.isPending,
    isUpdating: updateEntityMutation.isPending,
    isDeleting: deleteEntityMutation.isPending,
  };
}

// Hook para campos de entidade
export function useEntityFields(entityId?: string) {
  const queryClient = useQueryClient();

  // Buscar campos da entidade
  const fieldsQuery = useQuery({
    queryKey: ["entity-fields", entityId],
    queryFn: async () => {
      if (!entityId) return [];
      if (entityId === "mock") return mockEntity.fields;

      const { data, error } = await supabase
        .from("web_entity_fields")
        .select("*")
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as EntityField[];
    },
    enabled: !!entityId,
  });

  // Criar campo
  const createFieldMutation = useMutation({
    mutationFn: async (fieldData: EntityFieldInsert) => {
      const { data, error } = await supabase
        .from("web_entity_fields")
        .insert(fieldData)
        .select()
        .single();

      if (error) throw error;
      return data as EntityField;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-fields", entityId] });
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  // Atualizar campo
  const updateFieldMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: EntityFieldUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("web_entity_fields")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as EntityField;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-fields", entityId] });
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  // Deletar campo
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const { error } = await supabase
        .from("web_entity_fields")
        .update({ is_active: false })
        .eq("id", fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-fields", entityId] });
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  // Reordenar campos
  const reorderFieldsMutation = useMutation({
    mutationFn: async (fields: { id: string; order_index: number }[]) => {
      const updates = fields.map((field) =>
        supabase
          .from("web_entity_fields")
          .update({ order_index: field.order_index })
          .eq("id", field.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-fields", entityId] });
    },
  });

  return {
    fields: fieldsQuery.data || [],
    isLoading: fieldsQuery.isLoading,
    error: fieldsQuery.error,
    createField: createFieldMutation.mutateAsync,
    updateField: updateFieldMutation.mutateAsync,
    deleteField: deleteFieldMutation.mutateAsync,
    reorderFields: reorderFieldsMutation.mutateAsync,
    isCreating: createFieldMutation.isPending,
    isUpdating: updateFieldMutation.isPending,
    isDeleting: deleteFieldMutation.isPending,
    isReordering: reorderFieldsMutation.isPending,
  };
}

// Hook para registros de entidade
export function useEntityRecords(entityId?: string) {
  const queryClient = useQueryClient();

  // Buscar registros da entidade
  const recordsQuery = useQuery({
    queryKey: ["entity-records", entityId],
    queryFn: async () => {
      if (!entityId) return [];
      if (entityId === "mock") return mockRecords;

      const user = await getCurrentUserData();
      if (!user?.client_id) throw new Error("Cliente não encontrado");

      const { data, error } = await supabase
        .from("web_entity_records")
        .select(
          `
          *,
          entity:web_entities(*),
          created_by_user:core_client_users!web_entity_records_created_by_fkey(
            first_name,
            last_name,
            email
          ),
          updated_by_user:core_client_users!web_entity_records_updated_by_fkey(
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("entity_id", entityId)
        .eq("client_id", user.client_id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EntityRecordWithData[];
    },
    enabled: !!entityId,
  });

  // Criar registro
  const createRecordMutation = useMutation({
    mutationFn: async (
      recordData: Omit<EntityRecordInsert, "client_id" | "created_by">
    ) => {
      const user = await getCurrentUserData();
      if (!user?.client_id || !user?.id)
        throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("web_entity_records")
        .insert({
          ...recordData,
          client_id: user.client_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EntityRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-records", entityId] });
    },
  });

  // Atualizar registro
  const updateRecordMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: EntityRecordUpdate & { id: string }) => {
      const user = await getCurrentUserData();
      if (!user?.id) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("web_entity_records")
        .update({
          ...updates,
          updated_by: user.id,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as EntityRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-records", entityId] });
    },
  });

  // Deletar registro
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from("web_entity_records")
        .update({ status: "archived" })
        .eq("id", recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-records", entityId] });
    },
  });

  return {
    records: recordsQuery.data || [],
    isLoading: recordsQuery.isLoading,
    error: recordsQuery.error,
    createRecord: createRecordMutation.mutateAsync,
    updateRecord: updateRecordMutation.mutateAsync,
    deleteRecord: deleteRecordMutation.mutateAsync,
    isCreating: createRecordMutation.isPending,
    isUpdating: updateRecordMutation.isPending,
    isDeleting: deleteRecordMutation.isPending,
  };
}

// Hook para buscar entidade específica
export function useEntity(entityId?: string) {
  return useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      if (!entityId) return null;
      if (entityId === "mock") return mockEntity;

      const { data, error } = await supabase
        .from("web_entities")
        .select("*")
        .eq("id", entityId)
        .single();

      if (error) throw error;
      return data as EntityWithFields;
    },
    enabled: !!entityId,
  });
}
