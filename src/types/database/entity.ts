export interface CustomEntity {
  id: string;
  name: string;
  template_name: string | null;
  client_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}