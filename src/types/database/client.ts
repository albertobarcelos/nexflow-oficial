export interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string;
  crm_id: string | null;
  partner_portal_id: string | null;
  status: 'active' | 'inactive';
  plan: 'free' | 'premium';
  contact_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  documents: any[] | null;
  history: any[] | null;
  created_at: string;
  updated_at: string;
}