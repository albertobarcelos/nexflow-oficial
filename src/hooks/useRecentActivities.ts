import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";

/** Tipo de evento de card (lançamento, conclusão, cancelamento, movimentação) */
export type CardEventType =
  | "card_created"
  | "completed"
  | "cancelled"
  | "in_progress";

/** Tipo de evento de atividade lançada no card */
export type ActivityEventType =
  | "activity_created"
  | "activity_completed"
  | "activity_updated";

/** Tipo unificado para exibição na timeline */
export type RecentActivityType =
  | CardEventType
  | ActivityEventType;

export interface RecentActivity {
  id: string;
  kind: "card" | "activity";
  /** Tipo específico do evento para ícone/label */
  type: RecentActivityType;
  cardName: string;
  responsible: string;
  date: string;
  dateRaw: string;
  value: number | null;
  /** Título da atividade (quando kind === 'activity') */
  activityTitle?: string;
  /** ID do card para navegação */
  cardId?: string;
}

interface UseRecentActivitiesOptions {
  teamId?: string | null;
  userId?: string | null;
}

/** Tipo interno para eventos de card na query */
interface CardRow {
  id: string;
  title: string;
  created_at: string;
  value: number | null;
  assigned_to?: string | null;
  assigned_team_id?: string | null;
  flow_id: string;
  step_id?: string | null;
}

/** Tipo interno para eventos de card_history na query */
interface CardHistoryRow {
  id: string;
  card_id: string;
  created_at: string;
  action_type: string;
  created_by?: string | null;
  details: Record<string, unknown> | null;
}

/**
 * Atividades recentes unificadas (cards + atividades nos cards) do cliente atual.
 * Inclui: lançamentos de cards, conclusões, cancelamentos, movimentações e
 * atividades lançadas nos cards (criação, conclusão, atualização).
 */
export function useRecentActivities(
  limit: number = 15,
  options?: UseRecentActivitiesOptions
) {
  const { teamId, userId } = options ?? {};
  const queryClient = useQueryClient();

  const { data, isLoading } = useSecureClientQuery<RecentActivity[]>({
    queryKey: ["recent-activities", limit, teamId ?? null, userId ?? null],
    queryFn: async (client, clientId): Promise<RecentActivity[]> => {
      const { data: flows } = await client
        .from("flows")
        .select("id")
        .eq("client_id", clientId);

      if (!flows || flows.length === 0) {
        return [];
      }

      const flowIds = flows.map((f) => f.id);

      // 1. Buscar cards (para eventos card_created)
      let cardsQuery = client
        .from("cards")
        .select(
          "id, title, created_at, value, assigned_to, assigned_team_id, flow_id, step_id"
        )
        .in("flow_id", flowIds)
        .eq("client_id", clientId);

      if (teamId) {
        cardsQuery = cardsQuery.eq("assigned_team_id", teamId);
      }
      if (userId) {
        cardsQuery = cardsQuery.eq("assigned_to", userId);
      }

      const { data: cards } = await cardsQuery
        .order("created_at", { ascending: false })
        .limit(limit * 2);

      const cardMap = new Map(
        (cards ?? []).map((c: CardRow) => [c.id, c as CardRow])
      );

      const allUserIds = new Set<string>();

      // 2. Buscar card_history para o cliente (sem filtro de card_id - client_id basta)
      const { data: history } = await client
        .from("card_history")
        .select("id, card_id, created_at, action_type, created_by, details")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(80);

      let historyRows = (history ?? []) as CardHistoryRow[];

      // Filtrar apenas eventos relevantes (move, complete, cancel, activity)
      historyRows = historyRows.filter((row) =>
        ["move", "complete", "cancel", "activity"].includes(row.action_type)
      );

      // Filtrar apenas eventos de cards que pertencem aos flows do cliente
      const historyCardIds = [...new Set(historyRows.map((r) => r.card_id))];
      const { data: historyCards } =
        historyCardIds.length > 0
          ? await client
              .from("cards")
              .select("id, title, value")
              .in("id", historyCardIds)
              .in("flow_id", flowIds)
              .eq("client_id", clientId)
          : { data: [] };

      const validCardIds = new Set(
        (historyCards ?? []).map((c: { id: string }) => c.id)
      );
      (historyCards ?? []).forEach((c: CardRow) => {
        cardMap.set(c.id, c as CardRow);
      });

      historyRows = historyRows.filter((row) => validCardIds.has(row.card_id));

      historyRows.forEach((row) => {
        if (row.created_by) allUserIds.add(row.created_by);
        const details = row.details as Record<string, unknown> | null;
        if (details?.creator_id) allUserIds.add(details.creator_id as string);
        if (details?.assignee_id) allUserIds.add(details.assignee_id as string);
      });

      // Coletar userIds dos cards
      (cards ?? []).forEach((c: CardRow) => {
        if (c.assigned_to) allUserIds.add(c.assigned_to);
      });

      // 4. Buscar nomes dos usuários
      const { data: users } =
        allUserIds.size > 0
          ? await client
              .from("core_client_users")
              .select("id, name, surname")
              .in("id", Array.from(allUserIds))
          : { data: [] };

      const userMap = new Map<string, string>(
        (users ?? []).map((u: { id: string; name: string; surname: string }) => [
          u.id,
          `${u.name ?? ""} ${u.surname ?? ""}`.trim() || "Sem nome",
        ])
      );

      const events: Array<{
        id: string;
        dateRaw: string;
        type: RecentActivityType;
        kind: "card" | "activity";
        cardName: string;
        responsible: string;
        value: number | null;
        activityTitle?: string;
        cardId?: string;
      }> = [];

      // 5. Mapear cards para eventos card_created
      (cards ?? []).forEach((card: CardRow) => {
        events.push({
          id: `card-created-${card.id}`,
          dateRaw: card.created_at,
          type: "card_created",
          kind: "card",
          cardName: card.title,
          responsible: card.assigned_to
            ? userMap.get(card.assigned_to) ?? "Sem responsável"
            : card.assigned_team_id
              ? "Equipe"
              : "Sem responsável",
          value: card.value != null ? Number(card.value) : null,
          cardId: card.id,
        });
      });

      // 6. Mapear card_history para eventos
      if (historyRows.length > 0) {
        let filteredHistory = historyRows;
        if (userId) {
          filteredHistory = historyRows.filter((row) => {
            if (row.action_type === "activity") {
              const details = row.details as Record<string, unknown> | null;
              const creatorId = details?.creator_id as string | undefined;
              const assigneeId = details?.assignee_id as string | undefined;
              return creatorId === userId || assigneeId === userId;
            }
            return row.created_by === userId;
          });
        }

        filteredHistory.forEach((row) => {
          const card = cardMap.get(row.card_id);
          const cardName = card?.title ?? "Card";
          const cardValue = card?.value != null ? Number(card.value) : null;

          if (row.action_type === "activity") {
            const details = row.details as Record<string, unknown> | null;
            const activityAction = details?.activity_action as
              | string
              | undefined;
            const activityTitle = details?.activity_title as string | undefined;
            const userName = details?.user_name as string | undefined;
            const creatorId = details?.creator_id as string | undefined;

            let type: ActivityEventType = "activity_created";
            if (activityAction === "completed") {
              type = "activity_completed";
            } else if (activityAction === "updated") {
              type = "activity_updated";
            }

            const responsible =
              userName ??
              (creatorId ? userMap.get(creatorId) : null) ??
              (row.created_by ? userMap.get(row.created_by) : null) ??
              "Sem responsável";

            events.push({
              id: `history-${row.id}`,
              dateRaw: row.created_at,
              type,
              kind: "activity",
              cardName,
              responsible,
              value: cardValue,
              activityTitle: activityTitle ?? "Atividade",
              cardId: row.card_id,
            });
          } else {
            let type: CardEventType = "in_progress";
            if (row.action_type === "complete") {
              type = "completed";
            } else if (row.action_type === "cancel") {
              type = "cancelled";
            }

            const details = row.details as Record<string, unknown> | null;
            const userName = details?.user_name as string | undefined;
            const responsible =
              userName ??
              (row.created_by ? userMap.get(row.created_by) : null) ??
              "Sem responsável";

            events.push({
              id: `history-${row.id}`,
              dateRaw: row.created_at,
              type,
              kind: "card",
              cardName,
              responsible,
              value: cardValue ?? null,
              cardId: row.card_id,
            });
          }
        });
      }

      // 7. Ordenar por data (mais recente primeiro) e limitar
      events.sort(
        (a, b) =>
          new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime()
      );

      return events.slice(0, limit).map((e) => ({
        ...e,
        date: format(new Date(e.dateRaw), "dd 'de' MMM, yyyy", {
          locale: ptBR,
        }),
      }));
    },
    queryOptions: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  });

  // Invalidação em tempo real
  useEffect(() => {
    const channel = supabase
      .channel("recent-activities-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "card_activities",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "card_history",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    activities: data ?? [],
    isLoading,
  };
}
