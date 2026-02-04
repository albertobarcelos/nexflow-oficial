import { useQuery } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";

export interface ContactForSelect {
  id: string;
  client_name: string;
  main_contact: string | null;
  contact_type: string | null;
  phone_numbers: string[] | null;
}

/**
 * Hook para buscar lista de contatos para seleção (usado no campo "Parceiro Indicador").
 * Isolado por client_id: queryKey com clientId e filtro por client_id na busca.
 * Exclui o próprio contato se estiver editando.
 */
export function useContactsForSelect(excludeContactId?: string | null) {
  const { currentClient } = useClientStore();
  const clientId = currentClient?.id ?? null;

  return useQuery({
    queryKey: ["contacts-for-select", clientId, excludeContactId],
    queryFn: async (): Promise<ContactForSelect[]> => {
      const currentClientId = await getCurrentClientId();
      if (!currentClientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      const queryBuilder = nexflowClient()
        .from("contacts" as any)
        .select("id, client_name, main_contact, contact_type, phone_numbers")
        .eq("client_id", currentClientId)
        .order("client_name", { ascending: true });

      const finalQuery = excludeContactId
        ? queryBuilder.neq("id", excludeContactId)
        : queryBuilder;

      const { data, error } = await finalQuery;

      if (error) {
        console.error("Erro ao buscar contatos:", error);
        return [];
      }

      const list = (data || []) as unknown as {
        id: string;
        client_name?: string;
        main_contact?: string | null;
        contact_type?: string | null;
        phone_numbers?: string[] | null;
      }[];
      return list.map((contact) => ({
        id: contact.id,
        client_name: contact.client_name || "",
        main_contact: contact.main_contact ?? null,
        contact_type: contact.contact_type ?? null,
        phone_numbers: contact.phone_numbers ?? null,
      }));
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

