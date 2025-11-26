import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte hex (#fff ou #ffffff) em RGB.
 */
export function hexToRgb(hex?: string) {
  if (!hex) {
    return null;
  }

  const sanitized = hex.replace("#", "").trim();
  if (![3, 6].includes(sanitized.length)) {
    return null;
  }

  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized;

  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) {
    return null;
  }

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

/**
 * Retorna rgba() com base na cor hex.
 */
export function hexToRgba(hex?: string, alpha = 1) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(15, 23, 42, ${alpha})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Garante contraste mínimo entre fundo e texto.
 */
export function getReadableTextColor(
  hex?: string,
  darkColor = "#0f172a",
  lightColor = "#ffffff"
) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return darkColor;
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? darkColor : lightColor;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function validateCNPJ(cnpj: string): boolean {
  // Remove tudo que não for dígito
  const cleaned = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se possui 14 dígitos
  if (cleaned.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Converte para array de números
  const digits = cleaned.split('').map(Number);
  
  // Cálculo do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum1 = digits.slice(0, 12).reduce((acc, digit, i) => acc + digit * weights1[i], 0);
  const rest1 = sum1 % 11;
  const dv1 = rest1 < 2 ? 0 : 11 - rest1;
  
  // Cálculo do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum2 = digits.slice(0, 13).reduce((acc, digit, i) => acc + digit * weights2[i], 0);
  const rest2 = sum2 % 11;
  const dv2 = rest2 < 2 ? 0 : 11 - rest2;
  
  return digits[12] === dv1 && digits[13] === dv2;
}
