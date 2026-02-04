import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useClientStore } from "@/stores/clientStore";

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

/**
 * Campos customizados por entidade (multi-tenant: queryKey com clientId).
 */
export function useCustomFields(entityType: EntityType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["custom-fields", clientId, entityType],
    queryFn: async () => {
      if (!user?.id) return [];
      if (!clientId) throw new Error("Client not found");

      // Tabelas fora do tipo Database gerado; usar cast para evitar "excessively deep"
      const { data, error } = await (supabase as any)
        .from("custom_fields")
        .select("*")
        .eq("client_id", clientId)
        .eq("entity_type", entityType)
        .order("order_index");

      if (error) {
        console.error("Erro ao buscar campos:", error);
        throw error;
      }

      return data;
    },
    enabled: !!clientId && !!user?.id,
  });

  const addField = useMutation({
    mutationFn: async (data: AddCustomFieldData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!clientId) throw new Error("Client not found");

      const newField = {
        ...data,
        entity_type: entityType,
        client_id: clientId,
        id: crypto.randomUUID(),
      };

      console.log("Tentando adicionar campo:", newField);

      const { data: createdField, error } = await (supabase as any)
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
      queryClient.invalidateQueries({
        queryKey: ["custom-fields", clientId, entityType],
      });
      toast.success("Campo adicionado com sucesso!");
    },
    onError: (error: Error) => {
      const err = error as Error & { details?: unknown; hint?: string };
      console.error("Erro ao adicionar campo:", {
        error,
        message: err.message,
        details: err.details,
        hint: err.hint,
      });
      toast.error(
        `Erro ao adicionar campo: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    },
  });

  // AIDEV-NOTE: updateField removido - sistema simplificado

  const deleteField = useMutation({
    mutationFn: async (fieldId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await (supabase as any)
        .from("custom_fields")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["custom-fields", clientId, entityType],
      });
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
