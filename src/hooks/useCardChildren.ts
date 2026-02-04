import { useQuery } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";

/**
 * Verifica se um card possui cards filhos (multi-tenant: queryKey com clientId).
 */
export function useCardChildren(cardId: string | null | undefined) {
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useQuery({
    queryKey: ["card-children", clientId, cardId],
    queryFn: async (): Promise<boolean> => {
      if (!cardId) {
        return false;
      }

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return false;
      }

      const { data, error, count } = await nexflowClient()
        .from("cards")
        .select("*", { count: "exact", head: true })
        .eq("parent_card_id", cardId)
        .eq("client_id", clientId)
        .limit(1);

      if (error) {
        console.error("Erro ao verificar cards filhos:", error);
        return false;
      }

      return (count ?? 0) > 0;
    },
    enabled: !!clientId && !!cardId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
