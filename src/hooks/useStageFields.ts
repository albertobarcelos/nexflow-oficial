import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface StageField {
  field_id: string | null;
  field_key: string;
  field_label: string;
  field_type: string | null;
  value: unknown;
  filled_at: string;
  event_id: string | null;
}

interface GetStageFieldsResponse {
  fields: StageField[];
}

/**
 * Hook para buscar campos preenchidos em uma etapa específica
 * Usa RPC call para função SQL get_stage_fields
 */
export function useStageFields(
  cardId: string | null | undefined,
  stepId: string | null | undefined,
  timestamp?: string | null
) {
  return useQuery({
    queryKey: ["stage-fields", cardId, stepId, timestamp],
    queryFn: async (): Promise<StageField[]> => {
      if (!cardId || !stepId) {
        return [];
      }

      // Chamar função RPC (usando type assertion pois a função não está nos tipos gerados)
      const { data, error } = await (supabase.rpc as any)("get_stage_fields", {
        p_card_id: cardId,
        p_step_id: stepId,
        p_timestamp: timestamp || new Date().toISOString(),
      });

      if (error) {
        console.error("Erro ao buscar campos da etapa via RPC:", error);
        return [];
      }

      if (!data || !Array.isArray(data)) {
        return [];
      }

      // Mapear dados para StageField
      return data.map((field: any): StageField => ({
        field_id: field.field_id || null,
        field_key: field.field_key || "",
        field_label: field.field_label || field.field_key || "Campo",
        field_type: field.field_type || null,
        value: field.value,
        filled_at: field.filled_at || "",
        event_id: field.event_id || null,
      }));
    },
    enabled: !!cardId && !!stepId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
