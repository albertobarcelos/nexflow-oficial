export interface Administrator {
  id: string;
  name: string;
  email: string;
  access_level: 'general' | 'limited';
  created_at: string;
  updated_at: string;
  auth_user_id: string;
}
