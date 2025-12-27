import { useQuery } from "@tanstack/react-query";

export interface SalesOrigin {
  source: string;
  percentage: number;
  color: string;
}

// Mock data por enquanto - em produção, isso viria de uma query real
export function useSalesOriginData() {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-origin-data'],
    queryFn: async (): Promise<SalesOrigin[]> => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data baseado no HTML
      return [
        {
          source: 'Google Ads',
          percentage: 45,
          color: '#3b82f6', // blue-500
        },
        {
          source: 'Referrals',
          percentage: 35,
          color: '#6366f1', // indigo-500
        },
        {
          source: 'Organic',
          percentage: 20,
          color: '#2dd4bf', // teal-400
        },
      ];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
  
  return {
    data: data || [],
    isLoading,
  };
}

