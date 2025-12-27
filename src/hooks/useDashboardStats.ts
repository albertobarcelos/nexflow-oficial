import { useQuery } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { useIndications } from "./useIndications";
import { useOpportunities } from "./useOpportunities";

export type PeriodFilter = 'today' | '7days' | '30days' | 'custom';

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

function getPeriodRange(period: PeriodFilter): PeriodRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case '30days':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      // Por enquanto, usar 30 dias como padrão
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

export function useDashboardStats(period: PeriodFilter = 'today') {
  const { indications } = useIndications();
  const { opportunities } = useOpportunities();
  
  const periodRange = getPeriodRange(period);
  const previousPeriodRange = getPreviousPeriodRange(period);
  
  const { data: cardsStats, isLoading: isLoadingCards } = useQuery({
    queryKey: ['dashboard-cards-stats', period],
    queryFn: async () => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return {
          completed: 0,
          cancelled: 0,
          previousCompleted: 0,
          previousCancelled: 0,
        };
      }
      
      const client = nexflowClient();
      
      // Buscar cards completos no período atual
      // Cards completos são aqueles em steps de finalização (isCompletionStep = true)
      const { data: flows } = await client
        .from('flows')
        .select('id')
        .eq('client_id', clientId);
      
      if (!flows || flows.length === 0) {
        return {
          completed: 0,
          cancelled: 0,
          previousCompleted: 0,
          previousCancelled: 0,
        };
      }
      
      const flowIds = flows.map(f => f.id);
      
      // Buscar todos os cards do período para análise
      // Por enquanto, vamos usar uma abordagem simplificada:
      // Cards completos = cards que estão na última posição de cada flow (aproximação)
      // Cards cancelados = 0 por enquanto (precisa de lógica específica baseada em step_type)
      
      // Buscar última posição de steps por flow (aproximação para cards completos)
      const { data: allSteps } = await client
        .from('steps')
        .select('id, flow_id, position')
        .in('flow_id', flowIds);
      
      // Encontrar steps com maior posição por flow (última etapa)
      const lastStepIdsByFlow = new Map<string, string[]>();
      flowIds.forEach(flowId => {
        const flowSteps = allSteps?.filter(s => s.flow_id === flowId) || [];
        if (flowSteps.length > 0) {
          const maxPosition = Math.max(...flowSteps.map(s => s.position));
          const lastSteps = flowSteps.filter(s => s.position === maxPosition).map(s => s.id);
          lastStepIdsByFlow.set(flowId, lastSteps);
        }
      });
      
      const lastStepIds = Array.from(lastStepIdsByFlow.values()).flat();
      
      // Cards completos: cards na última etapa de cada flow
      const { count: completedCount } = await client
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .in('flow_id', flowIds)
        .in('step_id', lastStepIds.length > 0 ? lastStepIds : [''])
        .gte('created_at', periodRange.start.toISOString())
        .lte('created_at', periodRange.end.toISOString());
      
      // Cards cancelados: por enquanto retornar 0 (precisa de lógica específica)
      const cancelledCount = 0;
      
      // Período anterior para calcular tendência
      const { count: previousCompletedCount } = await client
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .in('flow_id', flowIds)
        .in('step_id', lastStepIds.length > 0 ? lastStepIds : [''])
        .gte('created_at', previousPeriodRange.start.toISOString())
        .lte('created_at', previousPeriodRange.end.toISOString());
      
      const previousCancelledCount = 0;
      
      return {
        completed: completedCount || 0,
        cancelled: cancelledCount || 0,
        previousCompleted: previousCompletedCount || 0,
        previousCancelled: previousCancelledCount || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Calcular tendências para indicações e oportunidades (simplificado)
  // Em produção, isso deveria comparar com período anterior
  const indicationsCount = indications?.length || 0;
  const opportunitiesCount = opportunities?.length || 0;
  
  const metrics: DashboardMetrics = {
    indications: indicationsCount,
    opportunities: opportunitiesCount,
    completedCards: cardsStats?.completed || 0,
    cancelledCards: cardsStats?.cancelled || 0,
    indicationsTrend: 12.5, // Mock - em produção calcular baseado em período anterior
    opportunitiesTrend: 5.2, // Mock
    completedCardsTrend: calculateTrend(
      cardsStats?.completed || 0,
      cardsStats?.previousCompleted || 0
    ),
    cancelledCardsTrend: calculateTrend(
      cardsStats?.cancelled || 0,
      cardsStats?.previousCancelled || 0
    ),
  };
  
  return {
    metrics,
    isLoading: isLoadingCards,
  };
}

