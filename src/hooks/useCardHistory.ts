import { useQuery } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { CardMovementEntry } from "@/types/nexflow";
import { Database } from "@/types/database";

type CardHistoryRow = Database["nexflow"]["Tables"]["card_history"]["Row"];

/**
 * Mapeia um registro da tabela card_history para CardMovementEntry
 */
const mapCardHistoryRow = (row: CardHistoryRow): CardMovementEntry => {
  return {
    id: row.id,
    fromStepId: row.from_step_id ?? null,
    toStepId: row.to_step_id ?? null,
    movedAt: row.created_at,
    movedBy: row.created_by ?? null,
  };
};

/**
 * Hook para buscar o histórico de movimentação de um card
 */
export function useCardHistory(cardId: string | null | undefined) {
  return useQuery({
    queryKey: ["card-history", cardId],
    queryFn: async (): Promise<CardMovementEntry[]> => {
      if (!cardId) {
        return [];
      }

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("card_history")
        .select("id, card_id, client_id, from_step_id, to_step_id, created_by, created_at, action_type, details")
        .eq("card_id", cardId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar histórico do card:", error);
        return [];
      }

      return (data || []).map(mapCardHistoryRow);
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

