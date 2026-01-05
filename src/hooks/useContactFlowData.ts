import { useQuery } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";

export type PeriodFilter = 'today' | '7days' | '30days' | 'custom';

interface ChartDataPoint {
  label: string;
  opportunitiesCreated: number;
  cardsCompleted: number;
}

function getPeriodRange(period: PeriodFilter): { start: Date; end: Date } {
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
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
  }
  
  return { start, end };
}

function getDayLabels(period: PeriodFilter): string[] {
  switch (period) {
    case 'today':
      // Horas do dia
      return ['00h', '04h', '08h', '12h', '16h', '20h'];
    case '7days':
      return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    case '30days':
      // Semanas
      return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    default:
      return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  }
}

export function useContactFlowData(period: PeriodFilter = 'today') {
  const periodRange = getPeriodRange(period);
  const labels = getDayLabels(period);
  
  const { data, isLoading } = useQuery({
    queryKey: ['contact-flow-data', period],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return labels.map(label => ({
          label,
          opportunitiesCreated: 0,
          cardsCompleted: 0,
        }));
      }
      
      const client = nexflowClient();
      
      // Buscar flows do cliente
      const { data: flows } = await client
        .from('flows')
        .select('id')
        .eq('client_id', clientId);
      
      if (!flows || flows.length === 0) {
        return labels.map(label => ({
          label,
          opportunitiesCreated: 0,
          cardsCompleted: 0,
        }));
      }
      
      const flowIds = flows.map(f => f.id);
      
      // Buscar todas as steps para encontrar última etapa de cada flow
      const { data: allSteps } = await client
        .from('steps')
        .select('id, flow_id, position')
        .in('flow_id', flowIds);
      
      // Encontrar última etapa de cada flow
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
      
      // Agregar dados por período
      const dataPoints: ChartDataPoint[] = [];
      
      if (period === 'today') {
        // Agregar por horas
        for (let i = 0; i < 6; i++) {
          const hourStart = new Date(periodRange.start);
          hourStart.setHours(i * 4, 0, 0, 0);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(hourStart.getHours() + 4, 0, 0, 0);
          
          // Oportunidades criadas (simplificado - contar cards criados)
          const { count: oppCount } = await client
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .in('flow_id', flowIds)
            .gte('created_at', hourStart.toISOString())
            .lt('created_at', hourEnd.toISOString());
          
          // Cards completos (na última etapa)
          const { count: completedCount } = await client
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .in('flow_id', flowIds)
            .in('step_id', lastStepIds.length > 0 ? lastStepIds : [''])
            .gte('created_at', hourStart.toISOString())
            .lt('created_at', hourEnd.toISOString());
          
          dataPoints.push({
            label: labels[i],
            opportunitiesCreated: oppCount || 0,
            cardsCompleted: completedCount || 0,
          });
        }
      } else if (period === '7days') {
        // Agregar por dias da semana
        for (let i = 0; i < 7; i++) {
          const dayStart = new Date(periodRange.start);
          dayStart.setDate(dayStart.getDate() + i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          
          const { count: oppCount } = await client
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .in('flow_id', flowIds)
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());
          
          const { count: completedCount } = await client
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .in('flow_id', flowIds)
            .in('step_id', lastStepIds.length > 0 ? lastStepIds : [''])
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());
          
          dataPoints.push({
            label: labels[i],
            opportunitiesCreated: oppCount || 0,
            cardsCompleted: completedCount || 0,
          });
        }
      } else {
        // Para 30 dias, agregar por semanas
        for (let i = 0; i < 4; i++) {
          const weekStart = new Date(periodRange.start);
          weekStart.setDate(weekStart.getDate() + i * 7);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          weekEnd.setHours(23, 59, 59, 999);
          
          const { count: oppCount } = await client
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .in('flow_id', flowIds)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString());
          
          const { count: completedCount } = await client
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .in('flow_id', flowIds)
            .in('step_id', lastStepIds.length > 0 ? lastStepIds : [''])
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString());
          
          dataPoints.push({
            label: labels[i],
            opportunitiesCreated: oppCount || 0,
            cardsCompleted: completedCount || 0,
          });
        }
      }
      
      return dataPoints;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  return {
    data: data || labels.map(label => ({
      label,
      opportunitiesCreated: 0,
      cardsCompleted: 0,
    })),
    isLoading,
  };
}

