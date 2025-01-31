import { Company } from "./company";

export type PartnerType = "AFILIADO" | "AGENTE_STONE" | "CONTADOR";
export type PartnerStatus = "PENDENTE" | "ATIVO" | "INATIVO" | "BLOQUEADO";

export interface PartnerIndication {
  id: string;
  partner_id: string;
  company_id: string;
  company: Company;
  status: string;
  indication_date: string;
  conversion_date?: string;
  points_earned: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  client_id: string;
  name: string;
  email: string;
  whatsapp: string;
  phone?: string;
  birth_date?: string;
  linkedin?: string;
  instagram?: string;
  partner_type: PartnerType;
  status: PartnerStatus;
  company_id?: string | null;
  company_name?: string | null;
  company_razao_social?: string | null;
  company_cnpj?: string | null;
  company?: Company;
  role?: string;
  description?: string;
  current_level: number;
  points: number;
  total_indications: number;
  toy_number?: number;
  toy_group?: number;
  avatar_type?: string;
  avatar_seed?: string;
  created_at: string;
  updated_at: string;
  indications?: PartnerIndication[];
}

export interface CreatePartnerData {
  name: string;
  email: string;
  whatsapp: string;
  partner_type: PartnerType;
  status?: PartnerStatus;
  phone?: string;
  birth_date?: string;
  linkedin?: string;
  instagram?: string;
  company_id?: string;
  role?: string;
  description?: string;
  toy_number?: number;
  toy_group?: number;
  avatar_type?: string;
  avatar_seed?: string;
}

export interface UpdatePartnerData {
  name?: string;
  email?: string;
  whatsapp?: string;
  phone?: string | null;
  description?: string | null;
  avatar_type?: string | null;
  avatar_seed?: string | null;
  partner_type?: PartnerType;
  status?: PartnerStatus;
  company_id?: string | null;
  points?: number;
  current_level?: number;
  total_indications?: number;
}