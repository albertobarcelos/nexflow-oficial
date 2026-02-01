import { useQuery } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

type CardHistoryRow = Database["public"]["Tables"]["card_history"]["Row"];

export type CardTimelineEventType = 
  | 'stage_change' 
  | 'field_update' 
  | 'activity' 
  | 'status_change' 
  | 'freeze' 
  | 'unfreeze' 
  | 'checklist_completed'
  | 'process_status_change'
  | 'process_completed'
  | 'title_change'
  | 'checklist_change'
  | 'assignee_change'
  | 'product_value_change'
  | 'parent_change'
  | 'agents_change'
  | 'attachment_uploaded'
  | 'message_created';

export interface CardTimelineEvent {
  id: string;
  event_type: CardTimelineEventType;
  created_at: string;
  created_by: string | null;
  duration_seconds: number | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  from_step_id: string | null;
  to_step_id: string | null;
  step_id: string | null; // Etapa onde o evento ocorreu (principalmente para field_update)
  field_id: string | null;
  activity_id: string | null;
  action_type: string | null;
  movement_direction: "forward" | "backward" | "same" | null;
  details: Record<string, unknown> | null;
  // Relacionamentos (preenchidos via joins)
  user?: {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  from_step?: {
    id: string;
    title: string;
    color: string;
    position: number;
  } | null;
  to_step?: {
    id: string;
    title: string;
    color: string;
    position: number;
  } | null;
  step?: {
    id: string;
    title: string;
    color: string;
    position: number;
  } | null; // Etapa onde o evento ocorreu (para field_update)
  field?: {
    id: string;
    label: string;
    slug: string | null;
    field_type: string;
  } | null;
  activity?: {
    id: string;
    title: string;
    start_at: string;
    end_at: string;
    completed?: boolean;
    completed_at?: string | null;
    assignee_id?: string | null;
    activity_action?: 'created' | 'completed' | 'updated';
  } | null;
  process?: {
    id: string;
    step_action_id: string;
    title: string;
    status: string;
    completed_at?: string | null;
    completed_by?: string | null;
  } | null;
}

interface GetCardTimelineResponse {
  timeline: CardTimelineEvent[];
}

/**
 * Hook para buscar timeline completa de eventos de um card
 * Usa Edge Function que executa função SQL no banco
 */
export function useCardTimeline(cardId: string | null | undefined, parentCardId?: string | null) {
  return useQuery({
    queryKey: ["card-timeline", cardId, parentCardId],
    queryFn: async (): Promise<CardTimelineEvent[]> => {
      if (!cardId) {
        return [];
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("get-card-timeline", {
        body: {
          cardId,
          parentCardId: parentCardId || null,
        },
      });

      if (error) {
        console.error("Erro ao buscar timeline do card via Edge Function:", error);
        return [];
      }

      const response = data as GetCardTimelineResponse;

      if (!response?.timeline || !Array.isArray(response.timeline)) {
        return [];
      }

      // Mapear dados para CardTimelineEvent (já vem formatado da função SQL)
      return response.timeline.map((event: any): CardTimelineEvent => ({
        id: event.id,
        event_type: (event.event_type as CardTimelineEventType) || 'stage_change',
        created_at: event.created_at,
        created_by: event.created_by,
        duration_seconds: event.duration_seconds,
        previous_value: event.previous_value as Record<string, unknown> | null,
        new_value: event.new_value as Record<string, unknown> | null,
        from_step_id: event.from_step_id,
        to_step_id: event.to_step_id,
        step_id: event.step_id || null,
        field_id: event.field_id,
        activity_id: event.activity_id,
        action_type: event.action_type,
        movement_direction: event.movement_direction as "forward" | "backward" | "same" | null,
        details: event.details as Record<string, unknown> | null,
        user: event.user || null,
        from_step: event.from_step || null,
        to_step: event.to_step || null,
        step: event.step || null,
        field: event.field || null,
        activity: event.activity || null,
        process: event.process || null,
      }));
    },
    enabled: !!cardId,
    staleTime: 1000 * 30, // 30 segundos - dados frescos mas sem refetches excessivos
    refetchOnMount: true, // Sempre buscar dados frescos ao montar o componente
    refetchOnWindowFocus: true, // Atualizar quando o usuário voltar para a aba
  });
}

/**
 * Calcula o tempo total que o card permaneceu na etapa atual
 */
export function useCurrentStageDuration(cardId: string | null) {
  return useQuery({
    queryKey: ["card-current-stage-duration", cardId],
    queryFn: async (): Promise<number | null> => {
      if (!cardId) return null;

      const clientId = await getCurrentClientId();
      if (!clientId) return null;

      // Buscar card com last_stage_change_at (usando type assertion pois a coluna pode não estar no tipo ainda)
      const { data: card, error } = await (nexflowClient() as any)
        .from("cards")
        .select("last_stage_change_at, created_at")
        .eq("id", cardId)
        .eq("client_id", clientId)
        .single();

      if (error || !card) return null;

      // Usar type assertion para acessar last_stage_change_at
      const cardWithLastChange = card as unknown as { last_stage_change_at?: string | null; created_at: string };
      const lastChangeAt = cardWithLastChange.last_stage_change_at;

      // Se não houver last_stage_change_at, usar created_at como fallback
      const referenceDate = lastChangeAt || cardWithLastChange.created_at;
      if (!referenceDate) return null;

      // Calcular diferença em segundos
      const now = new Date();
      const lastChange = new Date(referenceDate);
      const diffSeconds = Math.floor((now.getTime() - lastChange.getTime()) / 1000);

      return diffSeconds;
    },
    enabled: !!cardId,
    staleTime: 1000 * 60, // 1 minuto (atualizar mais frequentemente)
    refetchInterval: 1000 * 60, // Atualizar a cada minuto
  });
}
