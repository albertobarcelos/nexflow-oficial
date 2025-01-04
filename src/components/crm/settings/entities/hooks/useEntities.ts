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

      const { data, error } = await supabase
        .from("custom_entities")
        .select("*")
        .eq("client_id", collaborator.client_id);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        fields: (item.fields as any[]).map((field): EntityField => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required || false,
          options: field.options,
          description: field.description
        }))
      })) as Entity[];
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
      return (data || []) as EntityRelationship[];
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