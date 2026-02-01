import * as z from "zod";

/**
 * Normaliza um número de telefone removendo caracteres especiais
 * @param phone - Número de telefone a ser normalizado
 * @returns Número normalizado (apenas dígitos)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Valida o formato de um telefone brasileiro
 * Aceita formatos:
 * - (99) 99999-9999 (celular com 9)
 * - (99) 9999-9999 (telefone fixo)
 * - 99999999999 (apenas dígitos)
 * @param phone - Número de telefone a ser validado
 * @returns true se o formato é válido
 */
export function validatePhoneFormat(phone: string): boolean {
  if (!phone || phone.trim() === "") return false;
  
  const normalized = normalizePhone(phone);
  
  // Deve ter 10 ou 11 dígitos (fixo ou celular)
  if (normalized.length < 10 || normalized.length > 11) {
    return false;
  }
  
  // Verifica se todos os caracteres são dígitos
  return /^\d+$/.test(normalized);
}

/**
 * Formata um telefone para o padrão brasileiro
 * @param phone - Número de telefone a ser formatado
 * @returns Telefone formatado como (99) 99999-9999 ou (99) 9999-9999
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 11) {
    // Celular: (99) 99999-9999
    return normalized.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (normalized.length === 10) {
    // Fixo: (99) 9999-9999
    return normalized.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  return phone; // Retorna original se não puder formatar
}

/**
 * Schema Zod para validação de telefone
 */
export const phoneSchema = z
  .string()
  .min(1, "Telefone é obrigatório")
  .refine(
    (phone) => validatePhoneFormat(phone),
    {
      message: "Telefone inválido. Use o formato (99) 99999-9999 ou (99) 9999-9999",
    }
  );

/**
 * Schema Zod para telefone opcional
 */
export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => !phone || phone.trim() === "" || validatePhoneFormat(phone),
    {
      message: "Telefone inválido. Use o formato (99) 99999-9999 ou (99) 9999-9999",
    }
  );
