import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useIndications } from "./useIndications";
import { useOpportunities } from "./useOpportunities";
import { useSecureClientQuery } from "./useSecureClientQuery";

export type PeriodFilter = "today" | "7days" | "30days" | "custom";

interface DashboardMetrics {
  indications: number;
  opportunities: number;
  completedCards: number;
  cancelledCards: number;
  indicationsTrend: number;
  opportunitiesTrend: number;
  completedCardsTrend: number;
  cancelledCardsTrend: number;
}

interface PeriodRange {
  start: Date;
  end: Date;
}

interface CardsStats {
  completed: number;
  cancelled: number;
  previousCompleted: number;
  previousCancelled: number;
}

function getPeriodRange(period: PeriodFilter): PeriodRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7days":
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "30days":
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end };
}

function getPreviousPeriodRange(period: PeriodFilter): PeriodRange {
  const current = getPeriodRange(period);
  const diff = current.end.getTime() - current.start.getTime();

  return {
    start: new Date(current.start.getTime() - diff),
    end: new Date(current.start.getTime() - 1),
  };
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

interface UseDashboardStatsOptions {
  teamId?: string | null;
  userId?: string | null;
  /** Range customizado (usado quando period === "custom") */
  customRange?: { start: Date; end: Date } | null;
}

/**
 * Estatísticas do dashboard (cards completos/cancelados + indicações + oportunidades).
 * Multi-tenant: queryKey inclui clientId; cards via useSecureClientQuery.
 */
export function useDashboardStats(
  period: PeriodFilter = "today",
  options?: UseDashboardStatsOptions
) {
  const { teamId, userId, customRange } = options ?? {};
  const queryClient = useQueryClient();

  const { indications } = useIndications();
  const { opportunities } = useOpportunities();

  const periodRange =
    period === "custom" && customRange
      ? { start: customRange.start, end: customRange.end }
      : getPeriodRange(period);
  const previousPeriodRange =
    period === "custom" && customRange
      ? (() => {
          const diff = customRange.end.getTime() - customRange.start.getTime();
          return {
            start: new Date(customRange.start.getTime() - diff),
            end: new Date(customRange.start.getTime() - 1),
          };
        })()
      : getPreviousPeriodRange(period);

  const { data: cardsStats, isLoading: isLoadingCards } =
    useSecureClientQuery<CardsStats>({
      queryKey: [
        "dashboard-cards-stats",
        period,
        teamId ?? null,
        userId ?? null,
        customRange?.start?.toISOString() ?? null,
        customRange?.end?.toISOString() ?? null,
      ],
      queryFn: async (client, clientId): Promise<CardsStats> => {
        const { data: flows } = await client
          .from("flows")
          .select("id")
          .eq("client_id", clientId);

        if (!flows || flows.length === 0) {
          return {
            completed: 0,
            cancelled: 0,
            previousCompleted: 0,
            previousCancelled: 0,
          };
        }

        const flowIds = flows.map((f) => f.id);

        const { data: allSteps } = await client
          .from("steps")
          .select("id, flow_id, position")
          .in("flow_id", flowIds);

        const lastStepIdsByFlow = new Map<string, string[]>();
        flowIds.forEach((flowId) => {
          const flowSteps = allSteps?.filter((s) => s.flow_id === flowId) ?? [];
          if (flowSteps.length > 0) {
            const maxPosition = Math.max(...flowSteps.map((s) => s.position));
            const lastSteps = flowSteps
              .filter((s) => s.position === maxPosition)
              .map((s) => s.id);
            lastStepIdsByFlow.set(flowId, lastSteps);
          }
        });

        const lastStepIds = Array.from(lastStepIdsByFlow.values()).flat();

        const buildCardsQuery = (startDate: string, endDate: string) => {
          let query = client
            .from("cards")
            .select("*", { count: "exact", head: true })
            .in("flow_id", flowIds)
            .in("step_id", lastStepIds.length > 0 ? lastStepIds : [""])
            .gte("created_at", startDate)
            .lte("created_at", endDate);

          if (teamId) {
            query = query.eq("assigned_team_id", teamId);
          }
          if (userId) {
            query = query.eq("assigned_to", userId);
          }
          return query;
        };

        const { count: completedCount } = await buildCardsQuery(
          periodRange.start.toISOString(),
          periodRange.end.toISOString()
        );

        const { count: previousCompletedCount } = await buildCardsQuery(
          previousPeriodRange.start.toISOString(),
          previousPeriodRange.end.toISOString()
        );

        return {
          completed: completedCount ?? 0,
          cancelled: 0,
          previousCompleted: previousCompletedCount ?? 0,
          previousCancelled: 0,
        };
      },
      queryOptions: {
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
        retry: 1,
        retryDelay: 1000,
      },
    });

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-stats-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-cards-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const indicationsCount = indications?.length ?? 0;
  const opportunitiesCount = opportunities?.length ?? 0;

  const metrics: DashboardMetrics = {
    indications: indicationsCount,
    opportunities: opportunitiesCount,
    completedCards: cardsStats?.completed ?? 0,
    cancelledCards: cardsStats?.cancelled ?? 0,
    indicationsTrend: 12.5,
    opportunitiesTrend: 5.2,
    completedCardsTrend: calculateTrend(
      cardsStats?.completed ?? 0,
      cardsStats?.previousCompleted ?? 0
    ),
    cancelledCardsTrend: calculateTrend(
      cardsStats?.cancelled ?? 0,
      cardsStats?.previousCancelled ?? 0
    ),
  };

  return {
    metrics,
    isLoading: isLoadingCards && !cardsStats,
  };
}
