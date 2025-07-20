// AIDEV-NOTE: Tipos para o popup de empresa - compatível com useCompany

export interface Company {
  id: string;
  name: string;
  company_name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  industry?: string;
  company_size?: string;
  annual_revenue?: number;
  description?: string;
  tags?: string[];
  status: 'active' | 'inactive' | 'prospect' | 'customer';
  created_at: string;
  updated_at: string;
  client_id: string;
  // AIDEV-NOTE: Campos relacionados carregados via join
  city_id?: string;
  state_id?: string;
  creator_id?: string;
  city?: {
    id: string;
    name: string;
  };
  state?: {
    id: string;
    name: string;
    uf: string;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  // AIDEV-NOTE: Campos de endereço específicos
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
}

export interface Location {
  id: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  role?: string;
  is_primary?: boolean;
}

export interface Attachment {
  id: number;
  name: string;
  size: number;
  type: string;
  created_at: string;
  uploaded_by: string;
}

export interface CompanyPopupProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface TabProps {
  company: Company | null;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage_name?: string;
  stage_color?: string;
  funnel_name?: string;
  created_at: string;
}