import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";
import type { Partner } from "@/types/partner";

export interface PartnerWithContacts extends Partner {
  contactsCount: number;
  contacts: Array<{
    id: string;
    client_name: string;
    email: string | null;
    phone_numbers: string[] | null;
  }>;
}

/**
 * Hook para buscar parceiros que têm contatos indicados por eles
 * Busca contatos com contact_type = 'parceiro' que têm outros contatos indicados por eles
 */
export function usePartnersWithContacts() {
  const { data: partners, isLoading, error } = useQuery({
    queryKey: ["partners-with-contacts"],
    queryFn: async (): Promise<PartnerWithContacts[]> => {
      try {
        const collaborator = await getCurrentUserData();

        // Buscar contatos que são parceiros (contact_type = 'parceiro')
        const { data: partnerContacts, error: partnerContactsError } = await supabase
          .from("contacts")
          .select("id, client_name, email, phone_numbers, client_id")
          .eq("contact_type", "parceiro")
          .eq("client_id", collaborator.client_id)
          .order("client_name");

        if (partnerContactsError) {
          console.error("Erro ao buscar parceiros:", partnerContactsError);
          return [];
        }

        if (!partnerContacts || partnerContacts.length === 0) {
          return [];
        }

        // Para cada parceiro (contato), buscar contatos que foram indicados por ele
        const partnersWithContacts = await Promise.all(
          partnerContacts.map(async (partnerContact) => {
            // Buscar contatos onde indicated_by = partnerContact.id
            const { data: contactsData } = await supabase
              .from("contacts")
              .select("id, client_name, email, phone_numbers")
              .eq("indicated_by", partnerContact.id)
              .eq("client_id", collaborator.client_id);

            const contacts = (contactsData || []).map((contact: any) => ({
              id: contact.id,
              client_name: contact.client_name,
              email: contact.email,
              phone_numbers: contact.phone_numbers,
            }));

            return {
              id: partnerContact.id,
              name: partnerContact.client_name || "Sem nome",
              email: partnerContact.email || "",
              whatsapp: partnerContact.phone_numbers?.[0] || "",
              partner_type: "AFILIADO" as const,
              status: "ATIVO" as const,
              client_id: partnerContact.client_id,
              current_level: 1,
              points: 0,
              total_indications: contacts.length,
              created_at: "",
              updated_at: "",
              contactsCount: contacts.length,
              contacts,
            } as PartnerWithContacts;
          })
        );

        // Filtrar apenas parceiros que têm contatos
        return partnersWithContacts.filter((p) => p.contactsCount > 0);
      } catch (error) {
        console.error("Erro ao buscar parceiros com contatos:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    partners: partners || [],
    isLoading,
    error,
  };
}

