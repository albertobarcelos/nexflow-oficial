import { Database } from "@/types/database";

// AIDEV-NOTE: Tipos centralizados para o módulo de empresas
// Mantém consistência de tipos em todo o feature module

export type Company = Database["public"]["Tables"]["web_companies"]["Row"];

export interface CompanyWithRelations extends Company {
  cidade?: string;
  estado?: string;
  uf?: string;
  address?: {
    cep?: string | null;
    rua?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
  };
}

export interface CreateCompanyData {
  name: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  description?: string;
  segment?: string;
  size?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  city_id?: string;
  state_id?: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}