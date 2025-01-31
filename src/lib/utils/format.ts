export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return "";
  
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, "");
  
  // Se tiver 11 dígitos (com DDD e 9), formata como celular
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  
  // Se tiver 10 dígitos (com DDD), formata como telefone fixo
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  // Se tiver 9 dígitos (sem DDD), formata como celular
  if (numbers.length === 9) {
    return numbers.replace(/(\d{5})(\d{4})/, "$1-$2");
  }
  
  // Se tiver 8 dígitos (sem DDD), formata como telefone fixo
  if (numbers.length === 8) {
    return numbers.replace(/(\d{4})(\d{4})/, "$1-$2");
  }
  
  // Se não se encaixar em nenhum padrão, retorna como está
  return numbers;
} 