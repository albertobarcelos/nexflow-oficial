import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentClientId } from '@/lib/supabase';
import { useClientStore } from '@/stores/clientStore';
import type { Notification } from '@/types/notifications';

/** Prefixos de query key para notificações (sempre usar com clientId) */
export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const;

export function useNotifications(limit = 50) {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id);

  const query = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, clientId, limit],
    enabled: !!clientId,
    queryFn: async (): Promise<Notification[]> => {
      const cid = clientId ?? (await getCurrentClientId());
      if (!cid) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', cid)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      const list = (data || []) as Notification[];

      // Validação dupla: apenas itens do cliente atual
      const invalid = list.filter((n) => n.client_id !== cid);
      if (invalid.length > 0) {
        console.error('[SECURITY] Notificações de outro cliente detectadas:', invalid.length);
        throw new Error('Violação de segurança: dados de outro cliente detectados');
      }
      return list;
    },
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || cancelled) return;

      const ch = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, clientId] });
            queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY, clientId] });
          }
        )
        .subscribe();

      if (cancelled) {
        supabase.removeChannel(ch);
        return;
      }
      channelRef.current = ch;
    };

    setupSubscription();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, clientId]);

  return query;
}

export function useUnreadNotificationsCount() {
  const clientId = useClientStore((s) => s.currentClient?.id);

  return useQuery({
    queryKey: [...NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY, clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<number> => {
      const cid = clientId ?? (await getCurrentClientId());
      if (!cid) return 0;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('client_id', cid)
        .eq('read', false);

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id);

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const cid = clientId ?? (await getCurrentClientId());
      if (!cid) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .eq('client_id', cid)
        .select();

      if (error) {
        console.error('[useMarkNotificationAsRead] Erro ao marcar notificação como lida:', {
          error,
          notificationId,
          userId: user.id,
          clientId: cid,
        });
        throw new Error(`Erro ao marcar notificação como lida: ${error.message ?? 'Erro desconhecido'}`);
      }

      if (!data || data.length === 0) {
        console.warn('[useMarkNotificationAsRead] Nenhuma notificação foi atualizada:', {
          notificationId,
          userId: user.id,
          clientId: cid,
        });
        throw new Error('Notificação não encontrada ou você não tem permissão para atualizá-la');
      }
    },
    onSuccess: () => {
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, clientId] });
        queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY, clientId] });
      } else {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY });
      }
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id);

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const cid = clientId ?? (await getCurrentClientId());
      if (!cid) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('client_id', cid)
        .eq('read', false)
        .select();

      if (error) {
        console.error('[useMarkAllNotificationsAsRead] Erro ao marcar todas as notificações como lidas:', {
          error,
          userId: user.id,
          clientId: cid,
        });
        throw new Error(`Erro ao marcar notificações como lidas: ${error.message ?? 'Erro desconhecido'}`);
      }
    },
    onSuccess: () => {
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, clientId] });
        queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY, clientId] });
      } else {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY });
      }
    },
  });
}

