export type MessageType = 'text' | 'audio' | 'video' | 'file';

export interface CardMessage {
  id: string;
  card_id: string;
  user_id: string;
  content: string | null;
  message_type: MessageType;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  mentions: string[];
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  client_id: string;
  // Relacionamentos (opcionais)
  user?: {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
    avatar_url: string | null;
  };
  reply_to?: CardMessage | null;
}

export interface CardMessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface SendMessageInput {
  card_id: string;
  content?: string;
  message_type: MessageType;
  file?: File;
  mentions?: string[];
  reply_to_id?: string;
}

export interface CardAttachment {
  id: string;
  card_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
  client_id: string;
  // Relacionamentos (opcionais)
  user?: {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
  };
}

export interface UploadAttachmentInput {
  card_id: string;
  file: File;
}





