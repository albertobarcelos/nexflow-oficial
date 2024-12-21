export interface Report {
  id: string;
  client_id: string;
  type: 'usage' | 'financial';
  generated_at: string;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}