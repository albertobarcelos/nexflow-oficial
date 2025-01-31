import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EntityType, CustomFieldValue } from "@/types/database/entities";

interface UpdateFieldValueData {
  field_id: string;
  value: any;
}

export function useCustomFieldValues(entityType: EntityType, entityId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: values = {}, isLoading } = useQuery({
    queryKey: ["custom_field_values", entityType, entityId],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!collaborator) throw new Error("Collaborator not found");

      const { data, error } = await supabase
        .from("custom_field_values")
        .select("*")
        .eq("client_id", collaborator.client_id)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);

      if (error) throw error;

      // Transformar o array de valores em um objeto indexado por field_id
      return (data as CustomFieldValue[]).reduce((acc, value) => {
        acc[value.field_id] = value.value;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: !!user && !!entityType && !!entityId
  });

  const updateFieldValue = useMutation({
    mutationFn: async ({ field_id, value }: UpdateFieldValueData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!collaborator) throw new Error("Collaborator not found");

      // Verificar se já existe um valor para este campo
      const { data: existingValue } = await supabase
        .from("custom_field_values")
        .select("id")
        .eq("client_id", collaborator.client_id)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("field_id", field_id)
        .maybeSingle();

      if (existingValue) {
        // Atualizar valor existente
        const { error } = await supabase
          .from("custom_field_values")
          .update({
            value,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingValue.id);

        if (error) throw error;
      } else {
        // Inserir novo valor
        const { error } = await supabase
          .from("custom_field_values")
          .insert({
            client_id: collaborator.client_id,
            entity_type: entityType,
            entity_id: entityId,
            field_id,
            value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["custom_field_values", entityType, entityId] 
      });
    },
    onError: (error) => {
      console.error("Error updating field value:", error);
      toast.error("Erro ao atualizar valor do campo");
    }
  });

  return {
    values,
    isLoading,
    updateFieldValue,
    saving: updateFieldValue.isLoading
  };
} 
