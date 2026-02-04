import { useQuery } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import { Contact } from "@/hooks/useOpportunities";

/**
 * Hook para buscar um contato por ID. Isolado por client_id: queryKey com clientId,
 * filtro por client_id na busca e validação dupla no retorno.
 */
export function useContactById(contactId: string | null | undefined) {
  const { currentClient } = useClientStore();
  const clientId = currentClient?.id ?? null;

  return useQuery({
    queryKey: ["contacts", clientId, contactId],
    queryFn: async (): Promise<Contact | null> => {
      if (!contactId) {
        return null;
      }

      const currentClientId = await getCurrentClientId();
      if (!currentClientId) {
        return null;
      }

      const { data, error } = await nexflowClient()
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .eq("client_id", currentClientId)
        .single();

      if (error || !data) {
        console.error("Erro ao buscar contato:", error);
        return null;
      }

      // Validação dupla: contato deve pertencer ao cliente atual
      if ((data as { client_id?: string }).client_id !== currentClientId) {
        console.error("[SECURITY] useContactById: contato de outro cliente detectado.");
        return null;
      }

      return {
        id: data.id,
        client_id: data.client_id,
        client_name: (data as any).client_name || (data as any).name || "",
        main_contact: (data as any).main_contact || "",
        phone_numbers: (data as any).phone_numbers || [],
        company_names: (data as any).company_names || [],
        tax_ids: (data as any).tax_ids || [],
        related_card_ids: (data as any).related_card_ids || [],
        assigned_team_id: (data as any).assigned_team_id || null,
        avatar_type: (data as any).avatar_type,
        avatar_seed: (data as any).avatar_seed,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: (data as any).updated_at || new Date().toISOString(),
      };
    },
    enabled: !!contactId && !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
