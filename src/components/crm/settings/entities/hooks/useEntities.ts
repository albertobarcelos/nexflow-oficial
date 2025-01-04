import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Entity, EntityRelationship } from "../types";

export function useEntities() {
  const { data: entities = [], isLoading: isLoadingEntities } = useQuery({
    queryKey: ["entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_entities")
        .select("*");

      if (error) throw error;
      return (data || []) as Entity[];
    },
  });

  const { data: relationships = [], isLoading: isLoadingRelationships } = useQuery({
    queryKey: ["entity_relationships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_relationships")
        .select("*");

      if (error) throw error;
      return (data || []) as EntityRelationship[];
    },
  });

  return {
    entities,
    relationships,
    isLoading: isLoadingEntities || isLoadingRelationships,
  };
}