import { useQuery } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";

/**
 * Hook para verificar se um card possui cards filhos
 * (cards que têm parent_card_id apontando para este card)
 */
export function useCardChildren(cardId: string | null | undefined) {
  return useQuery({
    queryKey: ["card-children", cardId],
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
    enabled: !!cardId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
