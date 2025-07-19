// AIDEV-NOTE: Funções utilitárias para o CompanyPopup

/**
 * Formata o tamanho do arquivo para exibição
 * @param bytes Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Gera as iniciais do nome da empresa
 * @param name Nome da empresa
 * @returns Iniciais (ex: "NF" para "Nexflow")
 */
export const getCompanyInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
};

/**
 * Verifica se há informações de contato disponíveis
 * @param company Dados da empresa
 * @returns true se houver pelo menos uma informação de contato
 */
export const hasContactInfo = (company: any): boolean => {
  return !!(company?.email || company?.phone || company?.mobile || company?.whatsapp || company?.website);
};

/**
 * Verifica se há informações de localização disponíveis
 * @param location Dados de localização
 * @returns true se houver pelo menos uma informação de localização
 */
export const hasLocationInfo = (location: any): boolean => {
  return !!(location?.street || location?.number || location?.complement || 
           location?.neighborhood || location?.city || location?.state);
};