import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

// AIDEV-NOTE: EntityField removido - sistema simplificado para deals apenas

interface AddCustomFieldData {
  name: string;
  description?: string;
  field_type: FieldType;
  is_required: boolean;
  options?: string[];
  order_index: number;
}

export type EntityType = "companies" | "people" | "partners";

export function useCustomFields(entityType: EntityType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["custom-fields", entityType],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .eq("client_id", collaborator.client_id)
        .eq("entity_type", entityType)
        .order("order_index");

      if (error) {
        console.error("Erro ao buscar campos:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const addField = useMutation({
    mutationFn: async (data: AddCustomFieldData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      const newField = {
        ...data,
        entity_type: entityType,
        client_id: collaborator.client_id,
        id: crypto.randomUUID(),
      };

      console.log("Tentando adicionar campo:", newField);

      const { data: createdField, error } = await supabase
        .from("custom_fields")
        .insert(newField as any)
        .select()
        .single();

      if (error) {
        console.error("Erro detalhado:", error);
        throw error;
      }

      return createdField;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", entityType] });
      toast.success("Campo adicionado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao adicionar campo:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      toast.error(`Erro ao adicionar campo: ${error.message || 'Erro desconhecido'}`);
    },
  });

  // AIDEV-NOTE: updateField removido - sistema simplificado

  const deleteField = useMutation({
    mutationFn: async (fieldId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("custom_fields")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", entityType] });
      toast.success("Campo excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir campo:", error);
      toast.error("Erro ao excluir campo");
    },
  });

  // AIDEV-NOTE: reorderFields removido - sistema simplificado

  return {
    fields,
    isLoading,
    addField,
    deleteField,
  };
}
