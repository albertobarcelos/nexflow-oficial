import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";

export interface RecentActivity {
  id: string;
  cardName: string;
  responsible: string;
  date: string;
  value: number | null;
  status: "completed" | "pending" | "cancelled";
}

interface UseRecentActivitiesOptions {
  teamId?: string | null;
  userId?: string | null;
}

/**
 * Atividades recentes (cards) do cliente atual (multi-tenant seguro).
 * QueryKey inclui clientId; filtra flows/cards por client_id.
 */
export function useRecentActivities(
  limit: number = 10,
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

      let cardsQuery = client
        .from("cards")
        .select(
          `
          id,
          title,
          created_at,
          value,
          status,
          step_id,
          assigned_to,
          assigned_team_id,
          flow_id
        `
        )
        .in("flow_id", flowIds);

      if (teamId) {
        cardsQuery = cardsQuery.eq("assigned_team_id", teamId);
      }
      if (userId) {
        cardsQuery = cardsQuery.eq("assigned_to", userId);
      }

      const { data: cards } = await cardsQuery
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!cards || cards.length === 0) {
        return [];
      }

      const userIds = [
        ...new Set(
          (cards as { assigned_to?: string }[])
            .map((c) => c.assigned_to)
            .filter(Boolean) as string[]
        ),
      ];
      const { data: users } =
        userIds.length > 0
          ? await client
              .from("core_client_users")
              .select("id, name, surname")
              .in("id", userIds)
          : { data: [] };

      const userMap = new Map<string, string>(
        (users ?? []).map((u) => [
          u.id,
          `${u.name ?? ""} ${u.surname ?? ""}`.trim() || "Sem nome",
        ])
      );

      const { data: allSteps } = await client
        .from("steps")
        .select("id, flow_id, position")
        .in("flow_id", flowIds);

      const lastStepIdsByFlow = new Map<string, Set<string>>();
      flowIds.forEach((flowId) => {
        const flowSteps =
          allSteps?.filter((s) => s.flow_id === flowId) ?? [];
        if (flowSteps.length > 0) {
          const maxPosition = Math.max(...flowSteps.map((s) => s.position));
          const lastSteps = new Set(
            flowSteps
              .filter((s) => s.position === maxPosition)
              .map((s) => s.id)
          );
          lastStepIdsByFlow.set(flowId, lastSteps);
        }
      });

      return (cards as { id: string; title: string; created_at: string; value: unknown; step_id: string; flow_id: string; assigned_to?: string; assigned_team_id?: string }[]).map(
        (card) => {
          let status: "completed" | "pending" | "cancelled" = "pending";
          if (card.step_id) {
            const lastSteps = lastStepIdsByFlow.get(card.flow_id);
            if (lastSteps?.has(card.step_id)) {
              status = "completed";
            }
          }
          const responsibleName = card.assigned_to
            ? userMap.get(card.assigned_to) ?? "Sem responsável"
            : card.assigned_team_id
              ? "Equipe"
              : "Sem responsável";
          return {
            id: card.id,
            cardName: card.title,
            responsible: responsibleName,
            date: format(new Date(card.created_at), "dd 'de' MMM, yyyy", {
              locale: ptBR,
            }),
            value: card.value != null ? Number(card.value) : null,
            status,
          };
        }
      );
    },
    queryOptions: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  });

  // Invalidação em tempo real quando cards mudam (prefixo para cobrir qualquer clientId)
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
