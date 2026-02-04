import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSecureClientMutation, invalidateClientQueries } from "@/hooks/useSecureClientMutation";

export interface CreateContactInput {
  client_name: string;
  main_contact: string;
  phone_numbers?: string[] | null;
  company_names?: string[] | null;
  contact_type?: ("cliente" | "parceiro")[] | null;
}

export interface ContactCreated {
  id: string;
  client_id: string;
  client_name: string;
  main_contact: string;
}

/**
 * Hook para criar contato na tabela contacts (NexFlow).
 * Multi-tenant: usa useSecureClientMutation com client_id obrigatório e validação no retorno.
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useSecureClientMutation({
    mutationFn: async (client, clientId, input: CreateContactInput): Promise<ContactCreated> => {
      const { data, error } = await client
        .from("contacts")
        .insert({
          client_id: clientId,
          client_name: input.client_name.trim(),
          main_contact: input.main_contact.trim(),
          phone_numbers: input.phone_numbers ?? [],
          company_names: input.company_names ?? [],
          contact_type: input.contact_type ?? null,
        })
        .select("id, client_id, client_name, main_contact")
        .single();

      if (error) throw error;
      if (!data) throw new Error("Falha ao criar contato.");

      return data as ContactCreated;
    },
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["contacts-for-select"]);
        invalidateClientQueries(queryClient, ["contacts-with-indications"]);
        invalidateClientQueries(queryClient, ["contacts"]);
        queryClient.invalidateQueries({ queryKey: ["contacts-partners"] });
        toast.success("Contato criado com sucesso!");
      },
      onError: (err: Error) => {
        console.error("Erro ao criar contato:", err);
        toast.error(err.message || "Erro ao criar contato.");
      },
    },
  });
}
