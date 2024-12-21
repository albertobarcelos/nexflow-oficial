export interface License {
  id: string;
  client_id: string;
  type: 'free' | 'premium';
  start_date: string;
  expiration_date: string;
  status: 'active' | 'suspended' | 'expired';
  created_at: string;
  updated_at: string;
}