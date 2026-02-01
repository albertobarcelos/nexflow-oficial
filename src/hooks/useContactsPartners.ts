import { useQuery } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";

export interface ContactPartner {
  id: string;
  client_name: string;
  main_contact: string;
  phone_numbers: string[] | null;
}

/**
 * Hook para buscar contatos que são parceiros (contact_type contém 'parceiro')
 * Usado no campo partner_select do formulário interno
 */
export function useContactsPartners() {
  return useQuery({
    queryKey: ["contacts-partners"],
    queryFn: async (): Promise<ContactPartner[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      // Buscar todos os contatos do client_id
      const { data, error } = await nexflowClient()
        .from("contacts" as any)
        .select("id, client_name, main_contact, phone_numbers, contact_type")
        .eq("client_id", clientId)
        .order("client_name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar contatos parceiros:", error);
        return [];
      }

      // Filtrar contatos onde contact_type contém 'parceiro'
      const partnerContacts = (data || []).filter((contact: any) => 
        contact.contact_type && 
        Array.isArray(contact.contact_type) && 
        contact.contact_type.includes('parceiro')
      );

      // Mapear para o formato esperado
      return partnerContacts.map((contact: any) => ({
        id: contact.id,
        client_name: contact.client_name || "",
        main_contact: contact.main_contact || "",
        phone_numbers: contact.phone_numbers || null,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
