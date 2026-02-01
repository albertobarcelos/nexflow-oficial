import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, nexflowClient } from '@/lib/supabase';
import { getCurrentClientId } from '@/lib/supabase';
import type { NotificationSettings, NotificationSettingsUpdate } from '@/types/notifications';

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async (): Promise<NotificationSettings | null> => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

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
        if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
          console.error('Erro 403 ao acessar configurações de notificação:', {
            error,
            userId: user.id,
            clientId,
            message: 'Acesso negado. Verifique se o usuário existe em core_client_users e tem o client_id correto.',
          });
          
          // Retorna null para permitir que o sistema tente criar as configurações
          // Isso evita que a aplicação quebre completamente
          return null;
        }
        
        throw error;
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

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: NotificationSettingsUpdate): Promise<NotificationSettings> => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verificar se já existe configuração
      const { data: existing, error: checkError } = await nexflowClient()
        .from('user_notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .single();

      // Se erro 403 ao verificar, tentar criar mesmo assim
      if (checkError && checkError.status !== 403 && checkError.code !== 'PGRST116') {
        console.warn('Erro ao verificar configurações existentes:', checkError);
      }

      const settingsData = {
        ...updates,
        notify_new_cards_in_stages: updates.notify_new_cards_in_stages || [],
        client_id: clientId,
        user_id: user.id,
      };

      if (existing && !checkError) {
        // Atualizar existente
        const { data, error } = await nexflowClient()
          .from('user_notification_settings')
          .update(settingsData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          // Se erro 403, tentar criar novo registro
          if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
            console.warn('Erro 403 ao atualizar, tentando criar novo registro:', error);
            // Continuar para criar novo registro
          } else {
            throw error;
          }
        } else {
          return {
            ...data,
            notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
              ? data.notify_new_cards_in_stages
              : [],
          } as NotificationSettings;
        }
      }
      
      // Criar novo (ou se houve erro ao atualizar)
      const { data, error } = await nexflowClient()
        .from('user_notification_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) {
        // Tratamento específico para erro 403
        if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
          const errorMessage = 'Acesso negado ao criar configurações de notificação. Verifique se o usuário existe em core_client_users e tem permissões adequadas.';
          console.error(errorMessage, { error, userId: user.id, clientId });
          throw new Error(errorMessage);
        }
        throw error;
      }
      
      return {
        ...data,
        notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
          ? data.notify_new_cards_in_stages
          : [],
      } as NotificationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}

export function useUpdateStageNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stepIds: string[]): Promise<NotificationSettings> => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verificar se já existe configuração
      const { data: existing, error: checkError } = await nexflowClient()
        .from('user_notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .single();

      // Se erro 403 ao verificar, tentar criar mesmo assim
      if (checkError && checkError.status !== 403 && checkError.code !== 'PGRST116') {
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

        if (error) {
          // Se erro 403, tentar criar novo registro
          if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
            console.warn('Erro 403 ao atualizar, tentando criar novo registro:', error);
            // Continuar para criar novo registro
          } else {
            throw error;
          }
        } else {
          return {
            ...data,
            notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
              ? data.notify_new_cards_in_stages
              : [],
          } as NotificationSettings;
        }
      }
      
      // Criar novo (ou se houve erro ao atualizar)
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
        // Tratamento específico para erro 403
        if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
          const errorMessage = 'Acesso negado ao criar configurações de notificação. Verifique se o usuário existe em core_client_users e tem permissões adequadas.';
          console.error(errorMessage, { error, userId: user.id, clientId });
          throw new Error(errorMessage);
        }
        throw error;
      }
      
      return {
        ...data,
        notify_new_cards_in_stages: Array.isArray(data.notify_new_cards_in_stages)
          ? data.notify_new_cards_in_stages
          : [],
      } as NotificationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}

