import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getCurrentClientId } from '@/lib/supabase';
import type {
  CardActivity,
  CreateCardActivityInput,
  UpdateCardActivityInput,
  GroupedCardActivities,
} from '@/types/activities';
import { format, isToday, isFuture, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useCardActivities(cardId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['card-activities', cardId],
    queryFn: async (): Promise<CardActivity[]> => {
      if (!cardId) return [];

      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      // Buscar atividades
      const { data: activities, error } = await (supabase as any)
        .from('card_activities')
        .select('*')
        .eq('card_id', cardId)
        .eq('client_id', clientId)
        .order('start_at', { ascending: true });

      if (error) {
        // Se a tabela não existe (404), retornar array vazio em vez de lançar erro
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('[useCardActivities] Tabela card_activities não encontrada. As migrations podem não ter sido aplicadas.');
          return [];
        }
        throw error;
      }

      if (!activities || activities.length === 0) return [];

      // Buscar tipos de atividade
      const activityTypeIds = [...new Set(activities.map((a: any) => a.activity_type_id))];
      let activityTypes = [];
      if (activityTypeIds.length > 0) {
        const { data, error: typesError } = await (supabase as any)
          .from('flow_activity_types')
          .select('*')
          .in('id', activityTypeIds);
        
        // Se a tabela não existe, continuar com array vazio
        if (typesError && !(typesError.code === 'PGRST116' || typesError.message?.includes('404') || typesError.message?.includes('relation') || typesError.message?.includes('does not exist'))) {
          console.warn('[useCardActivities] Erro ao buscar tipos de atividade:', typesError);
        }
        activityTypes = data || [];
      }

      const activityTypesMap = new Map(
        activityTypes.map((type: any) => [type.id, type])
      );

      // Buscar informações dos usuários (assignee e creator)
      const userIds = [
        ...new Set(
          activities
            .map((a) => [a.assignee_id, a.creator_id])
            .flat()
            .filter(Boolean) as string[]
        ),
      ];

      let usersMap: Record<
        string,
        {
          id: string;
          name: string | null;
          surname: string | null;
          email: string;
          avatar_url: string | null;
        }
      > = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('core_client_users')
          .select('id, name, surname, email, avatar_url')
          .in('id', userIds);

        if (users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as typeof usersMap);
        }
      }

      // Montar resposta com relacionamentos
      return (activities || []).map((activity: any) => ({
        ...activity,
        activity_type: activityTypesMap.get(activity.activity_type_id) || null,
        assignee: activity.assignee_id
          ? usersMap[activity.assignee_id] || null
          : null,
        creator: activity.creator_id
          ? usersMap[activity.creator_id] || null
          : null,
      })) as CardActivity[];
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Realtime subscription para novas atividades
  useEffect(() => {
    if (!cardId) return;

    const channel = supabase
      .channel(`card-activities-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_activities',
          filter: `card_id=eq.${cardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['card-activities', cardId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cardId, queryClient]);

  return query;
}

export function useGroupedCardActivities(
  cardId: string | null,
  filter: 'all' | 'pending' | 'completed' | 'today' | 'upcoming' = 'all'
) {
  const { data: activities = [], ...rest } = useCardActivities(cardId);

  const grouped = useQuery({
    queryKey: ['card-activities-grouped', cardId, filter],
    queryFn: (): GroupedCardActivities[] => {
      let filtered = activities;

      // Aplicar filtros
      if (filter === 'pending') {
        filtered = activities.filter((a) => !a.completed);
      } else if (filter === 'completed') {
        filtered = activities.filter((a) => a.completed);
      } else if (filter === 'today') {
        filtered = activities.filter((a) => {
          const startDate = parseISO(a.start_at);
          return isToday(startDate);
        });
      } else if (filter === 'upcoming') {
        const now = new Date();
        filtered = activities.filter((a) => {
          const startDate = parseISO(a.start_at);
          return isFuture(startDate) && !a.completed;
        });
      }

      // Agrupar por data
      const groupedMap = new Map<string, CardActivity[]>();

      filtered.forEach((activity) => {
        const dateKey = format(parseISO(activity.start_at), 'yyyy-MM-dd');
        if (!groupedMap.has(dateKey)) {
          groupedMap.set(dateKey, []);
        }
        groupedMap.get(dateKey)!.push(activity);
      });

      // Converter para array e ordenar por data
      return Array.from(groupedMap.entries())
        .map(([date, activities]) => ({
          date,
          activities: activities.sort(
            (a, b) =>
              parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime()
          ),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!cardId && activities.length > 0,
  });

  return {
    ...grouped,
    activities,
  };
}

export function useCreateCardActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCardActivityInput): Promise<CardActivity> => {
      // Chamar Edge Function para criar atividade com melhor controle de segurança
      const { data, error } = await supabase.functions.invoke('create-card-activity', {
        body: {
          card_id: input.card_id,
          activity_type_id: input.activity_type_id,
          title: input.title,
          description: input.description || null,
          start_at: input.start_at,
          end_at: input.end_at,
          assignee_id: input.assignee_id || null,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar atividade');
      }

      if (!data || !data.success || !data.activity) {
        throw new Error(data?.error || 'Falha ao criar atividade');
      }

      return data.activity as CardActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['card-activities', data.card_id] });
      queryClient.invalidateQueries({
        queryKey: ['card-activities-grouped', data.card_id],
      });
      queryClient.invalidateQueries({ queryKey: ['flow-activity-types'] });
      toast.success('Atividade criada com sucesso');
    },
    onError: (error: Error) => {
      console.error('[CreateCardActivity] Erro:', error);
      toast.error('Erro ao criar atividade: ' + error.message);
    },
  });
}

export function useUpdateCardActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      cardId,
      input,
    }: {
      id: string;
      cardId: string;
      input: UpdateCardActivityInput;
    }): Promise<CardActivity> => {
      const updateData: Partial<CardActivity> = {};

      if (input.activity_type_id !== undefined)
        updateData.activity_type_id = input.activity_type_id;
      if (input.title !== undefined) updateData.title = input.title.trim();
      if (input.description !== undefined)
        updateData.description = input.description?.trim() || null;
      if (input.start_at !== undefined) updateData.start_at = input.start_at;
      if (input.end_at !== undefined) updateData.end_at = input.end_at;
      if (input.assignee_id !== undefined) updateData.assignee_id = input.assignee_id;
      if (input.completed !== undefined) updateData.completed = input.completed;

      // Validar que end_at > start_at se ambos foram fornecidos
      if (input.start_at && input.end_at) {
        const startAt = new Date(input.start_at);
        const endAt = new Date(input.end_at);
        if (endAt <= startAt) {
          throw new Error('A data de término deve ser posterior à data de início');
        }
      }

      const { data, error } = await (supabase as any)
        .from('card_activities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Se a tabela não existe (404), informar ao usuário
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          throw new Error('A tabela card_activities não foi encontrada. Por favor, aplique as migrations do banco de dados.');
        }
        throw error;
      }
      return data as unknown as CardActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['card-activities', data.card_id] });
      queryClient.invalidateQueries({
        queryKey: ['card-activities-grouped', data.card_id],
      });
      toast.success('Atividade atualizada com sucesso');
    },
    onError: (error: Error) => {
      console.error('[UpdateCardActivity] Erro:', error);
      toast.error('Erro ao atualizar atividade: ' + error.message);
    },
  });
}

export function useDeleteCardActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      cardId,
    }: {
      id: string;
      cardId: string;
    }): Promise<void> => {
      const { error } = await (supabase as any)
        .from('card_activities')
        .delete()
        .eq('id', id);

      if (error) {
        // Se a tabela não existe (404), informar ao usuário
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          throw new Error('A tabela card_activities não foi encontrada. Por favor, aplique as migrations do banco de dados.');
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['card-activities', variables.cardId],
      });
      queryClient.invalidateQueries({
        queryKey: ['card-activities-grouped', variables.cardId],
      });
      toast.success('Atividade deletada com sucesso');
    },
    onError: (error: Error) => {
      console.error('[DeleteCardActivity] Erro:', error);
      toast.error('Erro ao deletar atividade: ' + error.message);
    },
  });
}

export function useCompleteCardActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      cardId,
      completed,
    }: {
      id: string;
      cardId: string;
      completed: boolean;
    }): Promise<CardActivity> => {
      const { data, error } = await (supabase as any)
        .from('card_activities')
        .update({ completed })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Se a tabela não existe (404), informar ao usuário
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          throw new Error('A tabela card_activities não foi encontrada. Por favor, aplique as migrations do banco de dados.');
        }
        throw error;
      }
      return data as unknown as CardActivity;
    },
    // Atualização otimista - atualiza a UI antes da resposta do servidor
    onMutate: async ({ id, cardId, completed }) => {
      // Cancelar queries em andamento para evitar sobrescrever a atualização otimista
      await queryClient.cancelQueries({ queryKey: ['card-activities', cardId] });
      await queryClient.cancelQueries({ queryKey: ['card-activities-grouped', cardId] });

      // Snapshot do valor anterior
      const previousActivities = queryClient.getQueryData<CardActivity[]>(['card-activities', cardId]);
      const previousGrouped = queryClient.getQueryData<GroupedCardActivities[]>(['card-activities-grouped', cardId]);

      // Atualizar otimisticamente a lista de atividades
      if (previousActivities) {
        queryClient.setQueryData<CardActivity[]>(['card-activities', cardId], (old) => {
          if (!old) return old;
          return old.map((activity) =>
            activity.id === id
              ? {
                  ...activity,
                  completed,
                  completed_at: completed ? new Date().toISOString() : null,
                }
              : activity
          );
        });
      }

      // Atualizar otimisticamente a lista agrupada
      if (previousGrouped) {
        queryClient.setQueryData<GroupedCardActivities[]>(['card-activities-grouped', cardId], (old) => {
          if (!old) return old;
          return old.map((group) => ({
            ...group,
            activities: group.activities.map((activity) =>
              activity.id === id
                ? {
                    ...activity,
                    completed,
                    completed_at: completed ? new Date().toISOString() : null,
                  }
                : activity
            ),
          }));
        });
      }

      // Retornar contexto com snapshot para rollback em caso de erro
      return { previousActivities, previousGrouped };
    },
    onSuccess: (data) => {
      // Invalidar queries para garantir sincronização com o servidor
      queryClient.invalidateQueries({ queryKey: ['card-activities', data.card_id] });
      queryClient.invalidateQueries({
        queryKey: ['card-activities-grouped', data.card_id],
      });
      toast.success(
        data.completed ? 'Atividade marcada como concluída' : 'Atividade reaberta'
      );
    },
    onError: (error: Error, variables, context) => {
      // Rollback em caso de erro
      if (context?.previousActivities) {
        queryClient.setQueryData(['card-activities', variables.cardId], context.previousActivities);
      }
      if (context?.previousGrouped) {
        queryClient.setQueryData(['card-activities-grouped', variables.cardId], context.previousGrouped);
      }
      console.error('[CompleteCardActivity] Erro:', error);
      toast.error('Erro ao atualizar atividade: ' + error.message);
    },
  });
}
