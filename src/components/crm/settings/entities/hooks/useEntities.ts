import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Entity, EntityRelationship, EntityField } from "../types";

export function useEntities() {
  const { data: entities = [], isLoading: isLoadingEntities, refetch: refetchEntities } = useQuery({
    queryKey: ["entities"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.user.id)
        .single();

      if (!collaborator) throw new Error("Collaborator not found");

      // Buscar entidades
      const { data: entitiesData, error: entitiesError } = await supabase
        .from("custom_entities")
        .select("*")
        .eq("client_id", collaborator.client_id);

      if (entitiesError) throw entitiesError;

      // Buscar campos para cada entidade
      const entitiesWithFields = await Promise.all(
        entitiesData.map(async (entity) => {
          const { data: fields, error: fieldsError } = await supabase
            .from("entity_fields")
            .select("*")
            .eq("entity_id", entity.id)
            .order("order_index", { ascending: true });

          if (fieldsError) throw fieldsError;

          // Mapear os campos para o formato esperado
          const mappedFields = (fields || []).map(field => ({
            ...field,
            type: field.field_type as EntityField['type'],
            required: field.is_required,
            options: field.options ? (field.options as string[]) : undefined
          }));

          return {
            ...entity,
            fields: mappedFields
          };
        })
      );

      return entitiesWithFields as Entity[];
    },
  });

  const { data: relationships = [], isLoading: isLoadingRelationships, refetch: refetchRelationships } = useQuery({
    queryKey: ["entity_relationships"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.user.id)
        .single();

      if (!collaborator) throw new Error("Collaborator not found");

      const { data, error } = await supabase
        .from("entity_relationships")
        .select("*")
        .eq("client_id", collaborator.client_id);

      if (error) throw error;
      return data as EntityRelationship[];
    },
  });

  const refetch = () => {
    refetchEntities();
    refetchRelationships();
  };

  return {
    entities,
    relationships,
    isLoading: isLoadingEntities || isLoadingRelationships,
    refetch
  };
}