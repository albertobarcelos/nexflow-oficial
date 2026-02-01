import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { toast } from "sonner";

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
 * Sempre usa client_id do usuário atual.
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput): Promise<ContactCreated> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const { data, error } = await nexflowClient()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts-for-select"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-partners"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contato criado com sucesso!");
    },
    onError: (err: Error) => {
      console.error("Erro ao criar contato:", err);
      toast.error(err.message || "Erro ao criar contato.");
    },
  });
}
