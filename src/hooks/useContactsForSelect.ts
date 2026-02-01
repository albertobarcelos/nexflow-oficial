import { useQuery } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";

export interface ContactForSelect {
  id: string;
  client_name: string;
  main_contact: string | null;
  contact_type: string | null;
  phone_numbers: string[] | null;
}

/**
 * Hook para buscar lista de contatos para seleção (usado no campo "Parceiro Indicador")
 * Exclui o próprio contato se estiver editando
 */
export function useContactsForSelect(excludeContactId?: string | null) {
  return useQuery({
    queryKey: ["contacts-for-select", excludeContactId],
    queryFn: async (): Promise<ContactForSelect[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      // Usar type assertion para evitar erro de inferência profunda com auto-referência
      const queryBuilder = nexflowClient()
        .from("contacts" as any)
        .select("id, client_name, main_contact, contact_type, phone_numbers")
        .eq("client_id", clientId)
        .order("client_name", { ascending: true });

      // Excluir o próprio contato se fornecido
      const finalQuery = excludeContactId
        ? queryBuilder.neq("id", excludeContactId)
        : queryBuilder;

      const { data, error } = await finalQuery;

      if (error) {
        console.error("Erro ao buscar contatos:", error);
        return [];
      }

      return (data || []).map((contact: any) => ({
        id: contact.id,
        client_name: contact.client_name || "",
        main_contact: contact.main_contact || null,
        contact_type: contact.contact_type || null,
        phone_numbers: contact.phone_numbers || null,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

