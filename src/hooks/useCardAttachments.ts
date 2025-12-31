import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, nexflowClient } from '@/lib/supabase';
import { getCurrentClientId } from '@/lib/supabase';
import { appConfig } from '@/lib/config';
import type { CardAttachment, UploadAttachmentInput } from '@/types/messages';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function useCardAttachments(cardId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['card-attachments', cardId],
    queryFn: async (): Promise<CardAttachment[]> => {
      if (!cardId) return [];

      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      // Buscar anexos do schema nexflow
      const { data, error } = await nexflowClient()
        .from('card_attachments')
        .select('*')
        .eq('card_id', cardId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar informações dos usuários separadamente para evitar problemas de join cross-schema
      const userIds = [...new Set((data || []).map((att: any) => att.user_id))];
      let usersMap: Record<string, { id: string; name: string | null; surname: string | null; email: string }> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('core_client_users')
          .select('id, name, surname, email')
          .in('id', userIds);

        if (!usersError && users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, { id: string; name: string | null; surname: string | null; email: string }>);
        }
      }

      return (data || []).map((att: any) => {
        const user = usersMap[att.user_id];
        return {
          ...att,
          user: user ? {
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
          } : undefined,
        };
      }) as CardAttachment[];
    },
    enabled: !!cardId,
  });

  // Realtime subscription para novos anexos
  useEffect(() => {
    if (!cardId) return;

    const channel = supabase
      .channel(`card-attachments-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'nexflow',
          table: 'card_attachments',
          filter: `card_id=eq.${cardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['card-attachments', cardId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cardId, queryClient]);

  return query;
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadAttachmentInput): Promise<CardAttachment> => {
      // Validar tamanho do arquivo (validação também feita na Edge Function)
      if (input.file.size > MAX_FILE_SIZE) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Preparar FormData para enviar à Edge Function
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('cardId', input.card_id);

      // Obter token de autenticação e URL do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = appConfig.supabase.url;

      // Chamar Edge Function usando fetch (supabase.functions.invoke não suporta FormData)
      const response = await fetch(`${supabaseUrl}/functions/v1/upload-card-attachment`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload do anexo');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as CardAttachment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card-attachments', variables.card_id] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, cardId }: { attachmentId: string; cardId: string }): Promise<void> => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Buscar anexo para deletar arquivo
      const { data: attachment } = await nexflowClient()
        .from('card_attachments')
        .select('file_url')
        .eq('id', attachmentId)
        .eq('user_id', user.id)
        .single();

      // Deletar arquivo do storage se existir
      if (attachment?.file_url) {
        const filePath = attachment.file_url.split('/').slice(-3).join('/'); // client_id/card_id/filename
        await supabase.storage
          .from('card-attachments')
          .remove([filePath]);
      }

      // Deletar registro
      const { error } = await nexflowClient()
        .from('card_attachments')
        .delete()
        .eq('id', attachmentId)
        .eq('user_id', user.id)
        .eq('client_id', clientId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card-attachments', variables.cardId] });
    },
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async (fileUrl: string): Promise<Blob> => {
      // Extrair caminho do arquivo da URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex((part) => part === 'card-attachments' || part === 'card-messages');
      
      if (bucketIndex === -1) {
        throw new Error('URL inválida');
      }

      const bucket = pathParts[bucketIndex];
      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;
      if (!data) throw new Error('Arquivo não encontrado');

      return data;
    },
  });
}

