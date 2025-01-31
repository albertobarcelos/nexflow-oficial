export type PartnerType = 'LEAD' | 'PARCEIRO' | 'FORNECEDOR';

export interface Partner {
  id: string;
  client_id: string;
  
  // Dados básicos
  name: string;
  partner_type: string;
  status: string;
  description?: string;
  company_id?: string;
  cargo?: string;
  
  // Contato
  email: string;
  whatsapp: string;
  phone?: string;
  
  // Redes Sociais
  linkedin?: string;
  instagram?: string;
  
  created_at: string;
  updated_at: string;
}

export interface PartnerCompany {
  id: string;
  client_id: string;
  partner_id: string;
  company_id: string;
  partnership_type?: string;
  created_at: string;
  updated_at: string;
  partner?: Partner;
  company?: Company;
}

export interface PartnerPerson {
  id: string;
  client_id: string;
  partner_id: string;
  person_id: string;
  role?: string;
  created_at: string;
  updated_at: string;
  partner?: Partner;
  person?: Person;
}

export interface AddPartnerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
}

export interface UpdatePartnerInput extends Partial<AddPartnerInput> {}
