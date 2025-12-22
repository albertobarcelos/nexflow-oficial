/**
 * Tipos relacionados às indicações do módulo Hunters
 */

export type IndicationStatus = 'pending' | 'processed' | 'converted' | 'rejected';

/**
 * Informações do Hunter
 */
export interface Hunter {
  id: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Indicação completa
 */
export interface Indication {
  id: string;
  client_id: string;
  hunter_id: string;
  related_card_ids: string[];
  status: IndicationStatus;
  responsible?: string | null;
  indication_name?: string | null;
  cnpj_cpf?: string | null;
  phone?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
  hunter?: Hunter | null;
}

/**
 * Resposta da edge function get-indications
 */
export interface GetIndicationsResponse {
  indications: Indication[];
  count: number;
}

