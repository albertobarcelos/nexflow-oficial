import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useSecureClientMutation,
  invalidateClientQueries,
} from "@/hooks/useSecureClientMutation";
import { useClientStore } from "@/stores/clientStore";

export interface UpdateContactInput {
  contactId: string;
  client_name: string;
  main_contact: string;
  phone_numbers: string[];
  company_names: string[];
  tax_ids: string[];
}

/**
 * Hook para atualizar contato na tabela contacts (NexFlow).
 * Multi-tenant: filtra por client_id no update.
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useSecureClientMutation({
    mutationFn: async (client, clientIdParam, input: UpdateContactInput) => {
      const { contactId, ...payload } = input;
      const { data, error } = await client
        .from("contacts")
        .update({
          client_name: payload.client_name.trim(),
          main_contact: payload.main_contact.trim(),
          phone_numbers: payload.phone_numbers.filter(Boolean),
          company_names: payload.company_names.filter(Boolean),
          tax_ids: payload.tax_ids.filter(Boolean),
        })
        .eq("id", contactId)
        .eq("client_id", clientIdParam)
        .select("id, client_id, client_name, main_contact")
        .single();

      if (error) throw error;
      if (!data) throw new Error("Falha ao atualizar contato.");
      return data;
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
        toast.success("Contato atualizado com sucesso!");
      },
      onError: (err: Error) => {
        console.error("Erro ao atualizar contato:", err);
        toast.error(err.message || "Erro ao atualizar contato.");
      },
    },
  });
}
