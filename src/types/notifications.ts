export type NotificationType = 
  | 'card_assigned' 
  | 'card_mentioned' 
  | 'new_card_in_stage' 
  | 'message_mention';

export interface Notification {
  id: string;
  user_id: string;
  card_id: string | null;
  message_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  client_id: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  notify_card_assigned: boolean;
  notify_mentions: boolean;
  notify_new_cards_in_stages: string[]; // Array de step_ids
  email_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
  client_id: string;
}

export interface NotificationSettingsUpdate {
  notify_card_assigned?: boolean;
  notify_mentions?: boolean;
  notify_new_cards_in_stages?: string[];
  email_notifications_enabled?: boolean;
}




