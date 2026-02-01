import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import type { NexflowCard } from "@/types/nexflow";

const CARD_CONTACTS_QUERY_KEY = "card-contacts";

/**
 * Retorna os IDs dos contatos vinculados ao card.
 * Se a tabela card_contacts existir, busca nela; caso contrário usa card.contactId como fallback.
 */
export function useCardContacts(cardId: string | undefined, card: NexflowCard | null) {
  return useQuery({
    queryKey: [CARD_CONTACTS_QUERY_KEY, cardId],
    enabled: Boolean(cardId),
    queryFn: async (): Promise<string[]> => {
      if (!cardId) return [];

      const { data, error } = await nexflowClient()
        .from("card_contacts")
        .select("contact_id")
        .eq("card_id", cardId);

      if (error) {
        // Fallback para contato único do card em caso de erro (ex.: tabela inexistente)
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          return card?.contactId ? [card.contactId] : [];
        }
        console.error("Erro ao buscar contatos do card:", error);
        return card?.contactId ? [card.contactId] : [];
      }

      const ids = (data ?? []).map((row) => row.contact_id);
      if (ids.length > 0) return ids;
      // Se tabela existe mas vazia, ainda considerar contactId do card como principal
      return card?.contactId ? [card.contactId] : [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Indica se a tabela card_contacts está em uso (retorna true se a query retornou dados da tabela).
 * Usado para decidir se mostramos multi-select ou apenas contato único.
 */
export function useCardContactsTableExists(cardId: string | undefined) {
  return useQuery({
    queryKey: [CARD_CONTACTS_QUERY_KEY, "table-exists", cardId],
    enabled: Boolean(cardId),
    queryFn: async (): Promise<boolean> => {
      if (!cardId) return false;
      const { error } = await nexflowClient()
        .from("card_contacts")
        .select("id")
        .eq("card_id", cardId)
        .limit(1);
      return !error;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export interface UseCardContactsMutationsOptions {
  cardId: string;
  flowId?: string;
}

/**
 * Mutations para adicionar e remover contatos do card (tabela card_contacts).
 * Quando a tabela não existir, as mutations falharão e um toast será exibido.
 */
export function useCardContactsMutations({ cardId, flowId }: UseCardContactsMutationsOptions) {
  const queryClient = useQueryClient();

  const addContact = useMutation({
    mutationFn: async (contactId: string) => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error("Não foi possível identificar o tenant atual.");

      const { error } = await nexflowClient()
        .from("card_contacts")
        .insert({
          card_id: cardId,
          contact_id: contactId,
          client_id: clientId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARD_CONTACTS_QUERY_KEY, cardId] });
      if (flowId) {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", flowId] });
      }
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards"] });
      toast.success("Contato adicionado ao card.");
    },
    onError: (err: Error) => {
      console.error("Erro ao adicionar contato ao card:", err);
      toast.error(err.message || "Erro ao adicionar contato. Verifique se a tabela card_contacts existe.");
    },
  });

  const removeContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await nexflowClient()
        .from("card_contacts")
        .delete()
        .eq("card_id", cardId)
        .eq("contact_id", contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARD_CONTACTS_QUERY_KEY, cardId] });
      if (flowId) {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", flowId] });
      }
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards"] });
      toast.success("Contato removido do card.");
    },
    onError: (err: Error) => {
      console.error("Erro ao remover contato do card:", err);
      toast.error(err.message || "Erro ao remover contato. Verifique se a tabela card_contacts existe.");
    },
  });

  return { addContact, removeContact };
}
