import { Json } from './json';

export interface Collaborator {
  id: string;
  auth_user_id: string;
  client_id: string;
  name: string;
  email: string;
  role: 'administrator' | 'closer' | 'partnership_director' | 'partner';
  permissions: Json;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}
