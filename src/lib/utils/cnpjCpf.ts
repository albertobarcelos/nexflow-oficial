/**
 * Utilitários para validação e formatação de CNPJ e CPF
 */

/**
 * Remove caracteres não numéricos
 */
function clean(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Detecta automaticamente se o valor é CPF (11 dígitos) ou CNPJ (14 dígitos)
 */
export function detectType(value: string): "cpf" | "cnpj" | null {
  const cleaned = clean(value);
  if (cleaned.length === 11) return "cpf";
  if (cleaned.length === 14) return "cnpj";
  return null;
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function maskCpf(value: string): string {
  const cleaned = clean(value).slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6)
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9)
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 */
export function maskCnpj(value: string): string {
  const cleaned = clean(value).slice(0, 14);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5)
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8)
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12)
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
}

/**
 * Valida CPF verificando dígitos verificadores
 */
export function validateCpf(cpf: string): boolean {
  const cleaned = clean(cpf);
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos os dígitos iguais

  let sum = 0;
  let remainder: number;

  // Valida primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

  sum = 0;
  // Valida segundo dígito verificador
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

  return true;
}

/**
 * Valida CNPJ verificando dígitos verificadores
 */
export function validateCnpj(cnpj: string): boolean {
  const cleaned = clean(cnpj);
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false; // Todos os dígitos iguais

  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  // Valida primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  // Valida segundo dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Formata CNPJ ou CPF baseado no tipo especificado ou detectado automaticamente
 */
export function formatCnpjCpf(
  value: string,
  type?: "auto" | "cpf" | "cnpj"
): string {
  const cleaned = clean(value);
  if (!cleaned) return "";

  // Se tipo específico foi solicitado
  if (type === "cpf") {
    return maskCpf(cleaned);
  }

  if (type === "cnpj") {
    return maskCnpj(cleaned);
  }

  // Auto: detecta baseado no tamanho
  // Se tem mais de 11 dígitos, assume CNPJ
  if (cleaned.length > 11) {
    return maskCnpj(cleaned);
  }

  // Caso contrário, assume CPF
  return maskCpf(cleaned);
}

/**
 * Valida CNPJ ou CPF baseado no tipo especificado ou detectado automaticamente
 */
export function validateCnpjCpf(
  value: string,
  type?: "auto" | "cpf" | "cnpj"
): boolean {
  const cleaned = clean(value);
  if (!cleaned) return false;

  // Se tipo específico foi solicitado
  if (type === "cpf") {
    return validateCpf(cleaned);
  }

  if (type === "cnpj") {
    return validateCnpj(cleaned);
  }

  // Auto: detecta baseado no tamanho
  const detectedType = detectType(cleaned);

  if (detectedType === "cpf") {
    return validateCpf(cleaned);
  }

  if (detectedType === "cnpj") {
    return validateCnpj(cleaned);
  }

  return false;
}

