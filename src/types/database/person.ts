export type PersonType = 'LEAD' | 'CLIENTE' | 'COLABORADOR';

export interface Person {
  id: string;
  client_id: string;
  
  // Dados básicos
  name: string;
  cpf: string;
  rg?: string;
  person_type: PersonType;
  description?: string;
  company_id?: string;
  company_name?: string;
  cargo?: string;
  
  // Contato
  email: string;
  whatsapp: string;
  telefone?: string;
  celular?: string;
  
  // Endereço
  cep: string;
  pais: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento?: string;
  
  // Classificação
  setor: string;
  categoria: string;
  origem: string;
  
  // Operacional
  responsavel_id: string;
  privacidade: 'todos' | 'somente-eu';
  
  created_at: string;
  updated_at: string;
}

export interface PersonCompany {
  id: string;
  client_id: string;
  person_id: string;
  company_id: string;
  role?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  person?: Person;
  company?: Company;
}

export interface PersonPartner {
  id: string;
  client_id: string;
  person_id: string;
  partner_id: string;
  role?: string;
  created_at: string;
  updated_at: string;
  person?: Person;
  partner?: Partner;
}