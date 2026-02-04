import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, nexflowClient } from '@/lib/supabase';
import { useSecureClientQuery } from '@/hooks/useSecureClientQuery';
import { useSecureClientMutation } from '@/hooks/useSecureClientMutation';
import { useClientStore } from '@/stores/clientStore';
import type { NotificationSettings, NotificationSettingsUpdate } from '@/types/notifications';

/** Query key base para configurações de notificação (com clientId na key) */
export const NOTIFICATION_SETTINGS_QUERY_KEY = ['notification-settings'] as const;

export function useNotificationSettings() {
  return useSecureClientQuery<NotificationSettings | null>({
    queryKey: NOTIFICATION_SETTINGS_QUERY_KEY,
    queryFn: async (_supabase, clientId): Promise<NotificationSettings | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await nexflowClient()
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .single();

      if (error) {
        // Se não existe, retorna null (será criado na primeira atualização)
        if (error.code === 'PGRST116') {
          return null;
        }
        // Tratamento específico para erro 403 (Forbidden)
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          console.error('Erro 403 ao acessar configurações de notificação:', {
            error,
            userId: user.id,
            clientId,
            message: 'Acesso negado. Verifique se o usuário existe em core_client_users e tem o client_id correto.',
          });
          return null;
        }
        throw error;
      }

      // Validação dupla: garantir que o registro pertence ao cliente atual
      if (data.client_id !== clientId) {
        console.error('[SECURITY] user_notification_settings com client_id incorreto');
        throw new Error('Violação de segurança: dados de outro cliente');
      }

      return {
        ...data,
        notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
          ? data.notify_new_cards_in_stages
          : (data.notify_new_cards_in_stages as unknown as string[]),
      } as NotificationSettings;
    },
  });
}

async function updateNotificationSettingsFn(
  _supabase: typeof supabase,
  clientId: string,
  updates: NotificationSettingsUpdate
): Promise<NotificationSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: existing, error: checkError } = await nexflowClient()
    .from('user_notification_settings')
    .select('id')
    .eq('user_id', user.id)
    .eq('client_id', clientId)
    .single();

  if (
    checkError &&
    checkError.code !== 'PGRST116' &&
    !checkError.message?.includes('403') &&
    !checkError.message?.includes('Forbidden')
  ) {
    console.warn('Erro ao verificar configurações existentes:', checkError);
  }

  const settingsData = {
    ...updates,
    notify_new_cards_in_stages: updates.notify_new_cards_in_stages ?? [],
    client_id: clientId,
    user_id: user.id,
  };

  if (existing && !checkError) {
    const { data, error } = await nexflowClient()
      .from('user_notification_settings')
      .update(settingsData)
      .eq('id', existing.id)
      .select()
      .single();

    if (!error) {
      return {
        ...data,
        notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
          ? data.notify_new_cards_in_stages
          : [],
      } as NotificationSettings;
    }
    if (!error.message?.includes('403') && !error.message?.includes('Forbidden')) {
      throw error;
    }
  }

  const { data, error } = await nexflowClient()
    .from('user_notification_settings')
    .insert(settingsData)
    .select()
    .single();

  if (error) {
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      throw new Error(
        'Acesso negado ao criar configurações de notificação. Verifique se o usuário existe em core_client_users e tem permissões adequadas.'
      );
    }
    throw error;
  }

  return {
    ...data,
    notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
      ? data.notify_new_cards_in_stages
      : [],
  } as NotificationSettings;
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id);

  return useSecureClientMutation<
    NotificationSettings,
    Error,
    NotificationSettingsUpdate
  >({
    mutationFn: updateNotificationSettingsFn,
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [...NOTIFICATION_SETTINGS_QUERY_KEY, clientId],
        });
        if (!clientId) {
          queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY });
        }
      },
    },
  });
}

async function updateStageNotificationsFn(
  _supabase: typeof supabase,
  clientId: string,
  stepIds: string[]
): Promise<NotificationSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: existing, error: checkError } = await nexflowClient()
    .from('user_notification_settings')
    .select('id')
    .eq('user_id', user.id)
    .eq('client_id', clientId)
    .single();

  if (
    checkError &&
    checkError.code !== 'PGRST116' &&
    !checkError.message?.includes('403') &&
    !checkError.message?.includes('Forbidden')
  ) {
    console.warn('Erro ao verificar configurações existentes:', checkError);
  }

  const settingsData = {
    notify_new_cards_in_stages: stepIds,
    client_id: clientId,
    user_id: user.id,
  };

  if (existing && !checkError) {
    const { data, error } = await nexflowClient()
      .from('user_notification_settings')
      .update(settingsData)
      .eq('id', existing.id)
      .select()
      .single();

    if (!error) {
      return {
        ...data,
        notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
          ? data.notify_new_cards_in_stages
          : [],
      } as NotificationSettings;
    }
    if (!error.message?.includes('403') && !error.message?.includes('Forbidden')) {
      throw error;
    }
  }

  const { data, error } = await nexflowClient()
    .from('user_notification_settings')
    .insert({
      ...settingsData,
      notify_card_assigned: true,
      notify_mentions: true,
      email_notifications_enabled: false,
    })
    .select()
    .single();

  if (error) {
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      throw new Error(
        'Acesso negado ao criar configurações de notificação. Verifique se o usuário existe em core_client_users e tem permissões adequadas.'
      );
    }
    throw error;
  }

  return {
    ...data,
    notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
      ? data.notify_new_cards_in_stages
      : [],
  } as NotificationSettings;
}

export function useUpdateStageNotifications() {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id);

  return useSecureClientMutation<NotificationSettings, Error, string[]>({
    mutationFn: updateStageNotificationsFn,
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [...NOTIFICATION_SETTINGS_QUERY_KEY, clientId],
        });
        if (!clientId) {
          queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY });
        }
      },
    },
  });
}

