import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, nexflowClient } from '@/lib/supabase';
import { getCurrentClientId } from '@/lib/supabase';
import type { CardMessage, SendMessageInput } from '@/types/messages';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Função auxiliar para extrair menções do texto (@username)
export function parseMentions(text: string, users: Array<{ id: string; firstName: string | null; lastName: string | null; email: string }>): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1].toLowerCase();
    const user = users.find(
      (u) =>
        (u.firstName?.toLowerCase() || '').includes(mentionText) ||
        (u.lastName?.toLowerCase() || '').includes(mentionText) ||
        u.email.toLowerCase().includes(mentionText)
    );
    if (user) {
      mentions.push(user.id);
    }
  }

  return [...new Set(mentions)]; // Remove duplicatas
}

export function useCardMessages(cardId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['card-messages', cardId],
    queryFn: async (): Promise<CardMessage[]> => {
      if (!cardId) return [];

      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      // Buscar mensagens do schema public
      const { data, error } = await (nexflowClient() as any)
        .from('card_messages')
        .select('*')
        .eq('card_id', cardId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar informações dos usuários separadamente para evitar problemas de join cross-schema
      const userIds = [...new Set((data || []).map((msg: any) => msg.user_id).filter(Boolean) as string[])];
      let usersMap: Record<string, { id: string; name: string | null; surname: string | null; email: string; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('core_client_users')
          .select('id, name, surname, email, avatar_url')
          .in('id', userIds);

        if (!usersError && users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, { id: string; name: string | null; surname: string | null; email: string; avatar_url: string | null }>);
        }
      }

      return (data || []).map((msg: any) => {
        const user = usersMap[msg.user_id];
        return {
          ...msg,
          user: user ? {
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            avatar_url: user.avatar_url,
          } : undefined,
          mentions: Array.isArray(msg.mentions) ? msg.mentions : [],
        };
      }) as CardMessage[];
    },
    enabled: !!cardId,
  });

  // Realtime subscription para novas mensagens
  useEffect(() => {
    if (!cardId) return;

    const channel = supabase
      .channel(`card-messages-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_messages',
          filter: `card_id=eq.${cardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['card-messages', cardId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cardId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput): Promise<CardMessage> => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let fileType: string | null = null;
      let messageType: 'text' | 'audio' | 'video' | 'file' = 'text';

      // Se há arquivo, fazer upload
      if (input.file) {
        if (input.file.size > MAX_FILE_SIZE) {
          throw new Error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        // Determinar tipo de mensagem baseado no tipo de arquivo
        if (input.file.type.startsWith('audio/')) {
          messageType = 'audio';
        } else if (input.file.type.startsWith('video/')) {
          messageType = 'video';
        } else {
          messageType = 'file';
        }

        // Upload para storage
        const fileExt = input.file.name.split('.').pop();
        const fileNameStorage = `${clientId}/${input.card_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('card-messages')
          .upload(fileNameStorage, input.file, {
            contentType: input.file.type,
            upsert: false,
          });

        if (uploadError) {
          // Mensagem mais clara para erro de bucket não encontrado
          if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('404')) {
            throw new Error('Bucket "card-messages" não encontrado no Supabase Storage. Por favor, crie o bucket no dashboard do Supabase.');
          }
          throw uploadError;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('card-messages')
          .getPublicUrl(fileNameStorage);

        fileUrl = urlData.publicUrl;
        fileName = input.file.name;
        fileSize = input.file.size;
        fileType = input.file.type;
      } else if (!input.content) {
        throw new Error('Mensagem deve ter conteúdo ou arquivo');
      }

      // Extrair menções se houver conteúdo de texto
      let mentions: string[] = [];
      if (input.content) {
        // Buscar usuários do cliente para fazer parse de menções
        const { data: users } = await supabase
          .from('core_client_users')
          .select('id, name, surname, email')
          .eq('client_id', clientId);

        if (users) {
          mentions = parseMentions(input.content, users.map(u => ({
            id: u.id,
            firstName: u.name,
            lastName: u.surname,
            email: u.email,
          })));
        }
      }

      // Inserir mensagem
      const { data: insertedData, error } = await (nexflowClient() as any)
        .from('card_messages')
        .insert({
          card_id: input.card_id,
          user_id: user.id,
          content: input.content || null,
          message_type: messageType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          mentions: mentions.length > 0 ? mentions : [],
          reply_to_id: input.reply_to_id || null,
          client_id: clientId,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Buscar informações do usuário separadamente
      const { data: userData } = await supabase
        .from('core_client_users')
        .select('id, name, surname, email, avatar_url')
        .eq('id', user.id)
        .single();

      return {
        ...(insertedData as any),
        user: userData ? {
          id: userData.id,
          name: userData.name,
          surname: userData.surname,
          email: userData.email,
          avatar_url: userData.avatar_url,
        } : undefined,
        mentions: Array.isArray((insertedData as any).mentions) ? (insertedData as any).mentions : [],
      } as CardMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card-messages', variables.card_id] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, cardId }: { messageId: string; cardId: string }): Promise<void> => {
      const clientId = await getCurrentClientId();
      if (!clientId) throw new Error('Client ID not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Buscar mensagem para deletar arquivo se houver
      const { data: message } = await (nexflowClient() as any)
        .from('card_messages')
        .select('file_url')
        .eq('id', messageId)
        .eq('user_id', user.id)
        .single();

      // Deletar arquivo do storage se existir
      if ((message as any)?.file_url) {
        const filePath = (message as any).file_url.split('/').slice(-3).join('/'); // client_id/card_id/filename
        await supabase.storage
          .from('card-messages')
          .remove([filePath]);
      }

      // Deletar mensagem
      const { error } = await (nexflowClient() as any)
        .from('card_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id)
        .eq('client_id', clientId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card-messages', variables.cardId] });
    },
  });
}

