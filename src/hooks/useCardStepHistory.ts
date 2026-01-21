import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface StepHistoryField {
  field_id: string;
  label: string;
  value: unknown;
  field_type: string;
  slug: string | null;
}

export interface StepHistory {
  step_id: string;
  step_name: string;
  step_position: number;
  field_values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  fields: StepHistoryField[];
}

interface GetCardStepHistoryResponse {
  success: boolean;
  data: StepHistory[];
  error?: string;
}

/**
 * Hook para buscar histórico de valores dos campos por etapa
 * Retorna snapshots dos valores preenchidos em etapas anteriores
 * Usa Edge Function para buscar dados
 */
export function useCardStepHistory(
  cardId: string | null | undefined,
  currentStepId?: string | null
) {
  return useQuery({
    queryKey: ["card-step-history", cardId, currentStepId],
    queryFn: async (): Promise<StepHistory[]> => {
      if (!cardId) {
        return [];
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("get-card-step-history", {
        body: {
          cardId,
          currentStepId: currentStepId || null,
        },
      });

      if (error) {
        console.error("Erro ao buscar histórico de valores via Edge Function:", error);
        return [];
      }

      const response = data as GetCardStepHistoryResponse;

      if (!response?.success || !Array.isArray(response.data)) {
        console.error("Resposta inválida da Edge Function:", response);
        return [];
      }

      return response.data;
    },
    enabled: !!cardId,
    staleTime: 1000 * 30, // 30 segundos - dados frescos mas sem refetches excessivos
    refetchOnMount: true, // Sempre buscar dados frescos ao montar o componente
    refetchOnWindowFocus: true, // Atualizar quando o usuário voltar para a aba
  });
}
