import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CardTimelineEvent } from "./useCardTimeline";

export interface ContactCardSummary {
  card_id: string;
  card_title: string;
  flow_id: string;
  flow_name: string;
  current_step: {
    id: string;
    title: string;
    color: string;
    position: number;
  } | null;
  time_in_current_stage: number; // segundos
  last_updated: string;
  status: string | null;
  events: CardTimelineEvent[];
  // Estatísticas resumidas
  total_events: number;
  last_event_type: string | null;
  last_event_at: string | null;
}

interface GetContactHistoryResponse {
  history: ContactCardSummary[];
}

/**
 * Hook para buscar resumo da jornada dos cards de um contato
 * Usa Edge Function que executa função SQL no banco
 * Retorna dados agrupados por card com informações de etapa atual,
 * tempo de permanência e eventos recentes
 */
export function useContactHistory(contactId: string | null) {
  return useQuery({
    queryKey: ["contact-history", contactId],
    queryFn: async (): Promise<ContactCardSummary[]> => {
      if (!contactId) return [];

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("get-contact-history", {
        body: {
          contactId,
        },
      });

      if (error) {
        console.error("Erro ao buscar histórico do contato via Edge Function:", error);
        return [];
      }

      const response = data as GetContactHistoryResponse;

      if (!response?.history || !Array.isArray(response.history)) {
        return [];
      }

      // Mapear dados para ContactCardSummary (já vem formatado da função SQL)
      return response.history.map((summary: any): ContactCardSummary => ({
        card_id: summary.card_id,
        card_title: summary.card_title,
        flow_id: summary.flow_id,
        flow_name: summary.flow_name,
        current_step: summary.current_step,
        time_in_current_stage: summary.time_in_current_stage,
        last_updated: summary.last_updated,
        status: summary.status,
        events: (summary.events || []).map((event: any): CardTimelineEvent => ({
          id: event.id,
          event_type: (event.event_type as CardTimelineEvent["event_type"]) || 'stage_change',
          created_at: event.created_at,
          created_by: event.created_by,
          duration_seconds: event.duration_seconds,
          previous_value: event.previous_value as Record<string, unknown> | null,
          new_value: event.new_value as Record<string, unknown> | null,
          from_step_id: event.from_step_id,
          to_step_id: event.to_step_id,
          field_id: event.field_id,
          activity_id: event.activity_id,
          action_type: event.action_type,
          movement_direction: event.movement_direction,
          details: event.details as Record<string, unknown> | null,
          user: event.user || null,
          from_step: event.from_step || null,
          to_step: event.to_step || null,
          field: event.field || null,
          activity: event.activity || null,
        })),
        total_events: summary.total_events || 0,
        last_event_type: summary.last_event_type,
        last_event_at: summary.last_event_at,
      }));
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
