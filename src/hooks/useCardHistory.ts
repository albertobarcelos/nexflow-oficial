import { useQuery } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { CardMovementEntry } from "@/types/nexflow";
import { Database } from "@/types/database";

type CardHistoryRow = Database["public"]["Tables"]["card_history"]["Row"];

/**
 * Mapeia um registro da tabela card_history para CardMovementEntry
 */
const mapCardHistoryRow = (row: CardHistoryRow): CardMovementEntry => {
  // Extrair informações do campo details (JSONB)
  const details = (row.details as Record<string, unknown>) || {};
  
  return {
    id: row.id,
    fromStepId: row.from_step_id ?? null,
    toStepId: row.to_step_id ?? null,
    movedAt: row.created_at,
    movedBy: row.created_by ?? null,
    fromStepTitle: (details.from_step_title as string) || null,
    toStepTitle: (details.to_step_title as string) || null,
    userName: (details.user_name as string) || null,
    actionType: row.action_type || 'move',
    details: details,
  };
};

/**
 * Hook para buscar o histórico de movimentação de um card
 * Para cards congelados (em etapa freezing), busca o histórico do card original
 * Cards filhos (com parent_card_id mas não em freezing) mantêm seu próprio histórico
 */
export function useCardHistory(cardId: string | null | undefined, parentCardId?: string | null) {
  return useQuery({
    queryKey: ["card-history", cardId, parentCardId],
    queryFn: async (): Promise<CardMovementEntry[]> => {
      if (!cardId) {
        return [];
      }

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      // Se parentCardId foi fornecido explicitamente, usar (para cards congelados)
      // Caso contrário, verificar se o card está em etapa freezing
      let targetCardId = parentCardId;
      
      if (!targetCardId) {
        // Buscar o card e sua etapa para verificar se está em freezing
        const { data: cardData, error: cardError } = await nexflowClient()
          .from("cards")
          .select("parent_card_id, step_id")
          .eq("id", cardId)
          .eq("client_id", clientId)
          .single();
        
        if (!cardError && cardData) {
          // Verificar se está em etapa freezing
          const { data: stepData } = await nexflowClient()
            .from("steps")
            .select("step_type")
            .eq("id", cardData.step_id)
            .single();
          
          // Se está em etapa freezing E tem parent_card_id, é card congelado
          if (stepData?.step_type === 'freezing' && cardData.parent_card_id) {
            targetCardId = cardData.parent_card_id;
          } else {
            // Card normal ou filho, usar o próprio cardId
            targetCardId = cardId;
          }
        } else {
          // Card normal, usar o próprio cardId
          targetCardId = cardId;
        }
      }

      // Buscar histórico do card alvo (original para cards congelados, próprio para cards normais)
      const { data, error } = await nexflowClient()
        .from("card_history")
        .select("id, card_id, client_id, from_step_id, to_step_id, created_by, created_at, action_type, details")
        .eq("card_id", targetCardId)
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

