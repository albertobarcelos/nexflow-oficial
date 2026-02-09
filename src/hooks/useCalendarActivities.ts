import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Evento do calendário no formato react-big-calendar */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEventResource;
}

/** Recurso de processo (card_step_action) */
export interface CalendarEventResourceProcess {
  eventType: "process";
  cardStepActionId: string;
  cardId: string;
  flowId: string;
  stepActionTitle: string;
  cardTitle: string;
  status: string;
  assignedTo: string | null;
  agents: string[];
  description?: string | null;
}

/** Recurso de atividade (card_activity) */
export interface CalendarEventResourceActivity {
  eventType: "activity";
  cardActivityId: string;
  cardId: string;
  flowId: string;
  activityTitle: string;
  cardTitle: string;
  completed: boolean;
  assignedTo: string | null;
  description?: string | null;
}

/** Union discriminada por eventType */
export type CalendarEventResource =
  | CalendarEventResourceProcess
  | CalendarEventResourceActivity;

/** Formato retornado pelo select do Supabase para cards + card_step_actions */
interface CardStepActionSelect {
  id: string;
  scheduled_date: string | null;
  status: string;
  step_action_id: string;
  activity_created?: boolean;
  /** PostgREST pode retornar objeto ou array conforme a relação FK */
  step_actions:
    | { id: string; title: string; description: string | null }
    | { id: string; title: string; description: string | null }[]
    | null;
}

interface CardWithActionsSelect {
  id: string;
  title: string;
  flow_id: string;
  assigned_to: string | null;
  agents: string[] | null;
  card_step_actions: CardStepActionSelect[];
}

/** Formato retornado pelo select do Supabase para card_activities */
interface CardActivityRow {
  id: string;
  card_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  assignee_id: string | null;
  completed: boolean;
  client_id: string;
  /** PostgREST pode retornar objeto ou array conforme a relação FK */
  cards?:
    | { id: string; title: string; flow_id: string }
    | { id: string; title: string; flow_id: string }[]
    | null;
}

export interface UseCalendarActivitiesParams {
  filterUserId?: string | null;
  searchQuery?: string;
  showProcesses?: boolean;
  showActivities?: boolean;
}

/**
 * Busca processos (card_step_actions) e atividades (card_activities) do client_id
 * para exibir no calendário. Usa flags para filtrar por tipo.
 * Segue padrão multi-tenant via useSecureClientQuery.
 */
export function useCalendarActivities(params: UseCalendarActivitiesParams = {}) {
  const {
    filterUserId,
    searchQuery,
    showProcesses = true,
    showActivities = true,
  } = params;

  const query = useSecureClientQuery<CalendarEvent[]>({
    queryKey: [
      "calendar",
      "activities",
      filterUserId ?? "all",
      searchQuery ?? "",
      showProcesses,
      showActivities,
    ],
    queryFn: async (supabaseClient: SupabaseClient, clientId: string) => {
      const events: CalendarEvent[] = [];
      const searchQ = searchQuery?.trim().toLowerCase() ?? "";

      // 1. Buscar processos (card_step_actions) se showProcesses
      if (showProcesses) {
        let cardsQuery = supabaseClient
          .from("cards")
          .select(
            `
            id,
            title,
            flow_id,
            assigned_to,
            agents,
            card_step_actions (
              id,
              scheduled_date,
              status,
              step_action_id,
              activity_created,
              step_actions (
                id,
                title,
                description
              )
            )
          `
          )
          .eq("client_id", clientId);

        if (filterUserId) {
          cardsQuery = cardsQuery.eq("assigned_to", filterUserId);
        }

        const { data: cardsData, error: cardsError } = await cardsQuery;

        if (cardsError) {
          console.error("[useCalendarActivities] Erro ao buscar cards:", cardsError);
          throw cardsError;
        }

        const cards = (cardsData ?? []) as unknown as CardWithActionsSelect[];

        for (const card of cards) {
          const actions = card.card_step_actions ?? [];
          for (const csa of actions) {
            if (!csa.scheduled_date) continue;
            // Processos com atividade já criada não aparecem no calendário (evita duplicidade)
            if (csa.activity_created) continue;

            const sa = csa.step_actions;
            const stepTitle = Array.isArray(sa)
              ? sa[0]?.title ?? "Atividade"
              : sa?.title ?? "Atividade";
            const stepDescription = Array.isArray(sa)
              ? sa[0]?.description ?? null
              : sa?.description ?? null;
            const displayTitle = `${stepTitle} - ${card.title}`;

            if (searchQ) {
              const matchesTitle =
                stepTitle.toLowerCase().includes(searchQ) ||
                card.title.toLowerCase().includes(searchQ);
              if (!matchesTitle) continue;
            }

            const startDate = new Date(csa.scheduled_date);
            const endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + 30);

            events.push({
              id: `process-${csa.id}`,
              title: displayTitle,
              start: startDate,
              end: endDate,
              resource: {
                eventType: "process",
                cardStepActionId: csa.id,
                cardId: card.id,
                flowId: card.flow_id,
                stepActionTitle: stepTitle,
                cardTitle: card.title,
                status: csa.status,
                assignedTo: card.assigned_to,
                agents: Array.isArray(card.agents) ? card.agents : [],
                description: stepDescription,
              },
            });
          }
        }
      }

      // 2. Buscar atividades (card_activities) se showActivities
      if (showActivities) {
        let activitiesQuery = supabaseClient
          .from("card_activities")
          .select(
            `
            id,
            card_id,
            title,
            description,
            start_at,
            end_at,
            assignee_id,
            completed,
            client_id,
            cards (
              id,
              title,
              flow_id
            )
          `
          )
          .eq("client_id", clientId);

        if (filterUserId) {
          activitiesQuery = activitiesQuery.eq("assignee_id", filterUserId);
        }

        const { data: activitiesData, error: activitiesError } =
          await activitiesQuery;

        if (activitiesError) {
          console.error(
            "[useCalendarActivities] Erro ao buscar card_activities:",
            activitiesError
          );
          throw activitiesError;
        }

        const activities = (activitiesData ?? []) as unknown as CardActivityRow[];

        for (const ca of activities) {
          const card = Array.isArray(ca.cards) ? ca.cards[0] : ca.cards;
          if (!card) continue;

          const displayTitle = `${ca.title} - ${card.title}`;

          if (searchQ) {
            const matchesTitle =
              ca.title.toLowerCase().includes(searchQ) ||
              (ca.description?.toLowerCase().includes(searchQ) ?? false) ||
              card.title.toLowerCase().includes(searchQ);
            if (!matchesTitle) continue;
          }

          const startDate = new Date(ca.start_at);
          const endDate = new Date(ca.end_at);

          events.push({
            id: `activity-${ca.id}`,
            title: displayTitle,
            start: startDate,
            end: endDate,
            resource: {
              eventType: "activity",
              cardActivityId: ca.id,
              cardId: ca.card_id,
              flowId: card.flow_id,
              activityTitle: ca.title,
              cardTitle: card.title,
              completed: ca.completed,
              assignedTo: ca.assignee_id,
              description: ca.description,
            },
          });
        }
      }

      events.sort((a, b) => a.start.getTime() - b.start.getTime());

      return events;
    },
    queryOptions: {
      staleTime: 1000 * 60 * 2,
      refetchOnMount: "always", // Garante dados atualizados ao acessar a página
    },
  });

  return query;
}
