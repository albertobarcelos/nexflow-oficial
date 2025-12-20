/**
 * Tipos relacionados às indicações do módulo Hunters
 */

export type IndicationStatus = 'pending' | 'processed' | 'converted' | 'rejected';

/**
 * Dados do formulário de indicação (armazenado em form_data como JSONB)
 */
export interface IndicationFormData {
  nome?: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  necessidades?: string;
  observacoes?: string;
  [key: string]: unknown; // Permite campos adicionais flexíveis
}

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
  form_data: IndicationFormData;
  status: IndicationStatus;
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

