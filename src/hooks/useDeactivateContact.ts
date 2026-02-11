import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useSecureClientMutation,
  invalidateClientQueries,
} from "@/hooks/useSecureClientMutation";
import { useClientStore } from "@/stores/clientStore";

export interface DeactivateContactInput {
  contactId: string;
}

/**
 * Hook para desativar contato (soft delete).
 * Requer coluna is_active (boolean, default true) na tabela contacts.
 * Multi-tenant: filtra por client_id no update.
 */
export function useDeactivateContact() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useSecureClientMutation({
    mutationFn: async (client, clientIdParam, input: DeactivateContactInput) => {
      const { contactId } = input;
      // is_active pode não existir nos tipos gerados; coluna adicionada manualmente no DB
      const { error } = await client
        .from("contacts")
        .update({ is_active: false } as Record<string, unknown>)
        .eq("id", contactId)
        .eq("client_id", clientIdParam);

      if (error) throw error;
      return { contactId };
    },
    mutationOptions: {
      onSuccess: (_, variables) => {
        if (clientId) {
          queryClient.invalidateQueries({
            queryKey: ["contact-details", clientId, variables.contactId],
          });
        }
        invalidateClientQueries(queryClient, ["contacts-for-select"]);
        invalidateClientQueries(queryClient, ["contacts-with-indications"]);
        invalidateClientQueries(queryClient, ["contacts"]);
        queryClient.invalidateQueries({ queryKey: ["contacts-partners"] });
        toast.success("Contato desativado com sucesso!");
      },
      onError: (err: Error) => {
        console.error("Erro ao desativar contato:", err);
        toast.error(
          err.message ||
            "Erro ao desativar contato. Verifique se a coluna is_active existe na tabela contacts."
        );
      },
    },
  });
}
