import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface RecentActivity {
  id: string;
  cardName: string;
  responsible: string;
  date: string;
  value: number | null;
  status: 'completed' | 'pending' | 'cancelled';
}

interface UseRecentActivitiesOptions {
  teamId?: string | null;
  userId?: string | null;
}

export function useRecentActivities(limit: number = 10, options?: UseRecentActivitiesOptions) {
  const { teamId, userId } = options || {};
  const queryClient = useQueryClient();
  const queryKey = ['recent-activities', limit, teamId, userId];
  
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<RecentActivity[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return [];
      }
      
      const client = nexflowClient();
      
      // Buscar flows do cliente
      const { data: flows } = await client
        .from('flows')
        .select('id')
        .eq('client_id', clientId);
      
      if (!flows || flows.length === 0) {
        return [];
      }
      
      const flowIds = flows.map(f => f.id);
      
      // Buscar cards recentes com filtros
      let cardsQuery = client
        .from('cards')
        .select(`
          id,
          title,
          created_at,
          value,
          status,
          step_id,
          assigned_to,
          assigned_team_id
        `)
        .in('flow_id', flowIds);
      
      // Aplicar filtros
      if (teamId) {
        cardsQuery = cardsQuery.eq('assigned_team_id', teamId);
      }
      if (userId) {
        cardsQuery = cardsQuery.eq('assigned_to', userId);
      }
      
      const { data: cards } = await cardsQuery
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!cards) {
        return [];
      }
      
      // Buscar informações dos responsáveis
      const userIds = [...new Set(cards.map(c => c.assigned_to).filter(Boolean))];
      const { data: users } = userIds.length > 0
        ? await client
            .schema('public')
            .from('core_client_users')
            .select('id, name, surname')
            .in('id', userIds)
        : { data: [] };
      
      const userMap = new Map(
        users?.map(u => [u.id, `${u.name || ''} ${u.surname || ''}`.trim() || 'Sem nome']) || []
      );
      
      // Buscar informações dos steps para determinar status
      const { data: allSteps } = await client
        .from('steps')
        .select('id, flow_id, position')
        .in('flow_id', flowIds);
      
      // Encontrar última etapa de cada flow (aproximação para cards completos)
      const lastStepIdsByFlow = new Map<string, Set<string>>();
      flowIds.forEach(flowId => {
        const flowSteps = allSteps?.filter(s => s.flow_id === flowId) || [];
        if (flowSteps.length > 0) {
          const maxPosition = Math.max(...flowSteps.map(s => s.position));
          const lastSteps = new Set(
            flowSteps.filter(s => s.position === maxPosition).map(s => s.id)
          );
          lastStepIdsByFlow.set(flowId, lastSteps);
        }
      });
      
      return cards.map(card => {
        // Determinar status baseado na posição do step
        let status: 'completed' | 'pending' | 'cancelled' = 'pending';
        
        if (card.step_id) {
          // Verificar se está na última etapa do flow
          const cardFlow = flows.find(f => f.id === card.flow_id);
          if (cardFlow) {
            const lastSteps = lastStepIdsByFlow.get(card.flow_id);
            if (lastSteps && lastSteps.has(card.step_id)) {
              status = 'completed';
            }
          }
        }
        
        // Obter nome do responsável
        const responsibleName = card.assigned_to
          ? userMap.get(card.assigned_to) || 'Sem responsável'
          : card.assigned_team_id
          ? 'Equipe'
          : 'Sem responsável';
        
        return {
          id: card.id,
          cardName: card.title,
          responsible: responsibleName,
          date: format(new Date(card.created_at), "dd 'de' MMM, yyyy", { locale: ptBR }),
          value: card.value ? Number(card.value) : null,
          status,
        };
      });
    },
    staleTime: 1000 * 30, // 30 segundos para atualização mais rápida
  });
  
  // Subscribe to real-time changes in cards table
  useEffect(() => {
    const channel = supabase
      .channel('recent-activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'nexflow',
          table: 'cards',
        },
        () => {
          // Invalidate and refetch when cards change
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryKey, queryClient]);
  
  return {
    activities: data || [],
    isLoading,
  };
}

