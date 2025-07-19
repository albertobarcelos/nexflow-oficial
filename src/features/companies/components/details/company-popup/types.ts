// AIDEV-NOTE: Tipos e interfaces compartilhados para o CompanyPopup

export interface Company {
  id: string;
  name: string;
  cnpj?: string | null;
  razao_social?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  telefone?: string | null;
  celular?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  categoria?: 'Cliente em Potencial' | 'Cliente Ativo' | 'Parceiro' | 'Cliente Inativo' | 'Outro' | null;
  origem?: string | null;
  creator_id?: string | null; // Responsável
  setor?: string | null;
  cep?: string | null;
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  city_id?: string | null;
  state_id?: string | null;
  created_at: string;
  updated_at?: string;
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