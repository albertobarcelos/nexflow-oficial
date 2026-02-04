import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useClientStore } from "@/stores/clientStore";
import { toast } from "sonner";
import type { CustomFieldValue } from "@/types/database/entities.ts";

interface UpdateFieldValueData {
  field_id: string;
  value: unknown;
}

/**
 * Valores de campos personalizados do deal (multi-tenant: queryKey com clientId).
 */
export function useCustomFieldValues(dealId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  const { data: values = {}, isLoading } = useQuery({
    queryKey: ["deal_custom_field_values", clientId, dealId],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!clientId) throw new Error("Client not found");

      const { data, error } = await (supabase as any)
        .from("deal_custom_field_values")
        .select("*")
        .eq("client_id", clientId)
        .eq("deal_id", dealId);

      if (error) throw error;

      return (data as CustomFieldValue[]).reduce(
        (acc, value) => {
          acc[value.field_id] = value.value;
          return acc;
        },
        {} as Record<string, unknown>
      );
    },
    enabled: !!user && !!clientId && !!dealId,
  });

  const updateFieldValue = useMutation({
    mutationFn: async ({ field_id, value }: UpdateFieldValueData) => {
      if (!user) throw new Error("Not authenticated");
      if (!clientId) throw new Error("Client not found");

      const { data: existingValue } = await (supabase as any)
        .from("deal_custom_field_values")
        .select("id")
        .eq("client_id", clientId)
        .eq("deal_id", dealId)
        .eq("field_id", field_id)
        .maybeSingle();

      if (existingValue) {
        const { error } = await (supabase as any)
          .from("deal_custom_field_values")
          .update({
            value,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingValue.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("deal_custom_field_values")
          .insert({
            client_id: clientId,
            deal_id: dealId,
            field_id,
            value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deal_custom_field_values", clientId, dealId],
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
    saving: updateFieldValue.isPending,
  };
}
