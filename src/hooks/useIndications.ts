import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Indication, GetIndicationsResponse } from "@/types/indications";

/**
 * Hook para buscar indicações do módulo Hunters
 */
export function useIndications() {
  const indicationsQuery = useQuery({
    queryKey: ["indications"],
    queryFn: async (): Promise<Indication[]> => {
      // Chamar edge function get-indications
      const { data, error } = await supabase.functions.invoke("get-indications", {
        body: {},
      });

      if (error) {
        console.error("Erro ao carregar indicações via Edge Function:", error);
        throw error;
      }

      if (!data) {
        return [];
      }

      const response = data as GetIndicationsResponse;

      if (!response.indications || !Array.isArray(response.indications)) {
        return [];
      }

      return response.indications;
    },
    staleTime: 1000 * 30, // 30 segundos
    refetchOnMount: true,
    retry: 1,
  });

  return {
    indications: indicationsQuery.data || [],
    isLoading: indicationsQuery.isLoading,
    isError: indicationsQuery.isError,
    error: indicationsQuery.error,
    refetch: indicationsQuery.refetch,
  };
}

