export interface Client {
  id: string;
  name: string;
  email: string;
  crm_id: string | null;
  partner_portal_id: string | null;
  status: 'active' | 'inactive';
  plan: 'free' | 'premium';
  created_at: string;
  updated_at: string;
}