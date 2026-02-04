import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import { Indication, GetIndicationsResponse } from "@/types/indications";

/**
 * Hook para buscar indicações do módulo Hunters (multi-tenant: queryKey e body com clientId).
 * Cache isolado por cliente; Edge Function deve isolar por client_id quando receber body.client_id.
 */
export function useIndications() {
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  const indicationsQuery = useQuery({
    queryKey: ["indications", clientId],
    queryFn: async (): Promise<Indication[]> => {
      const { data, error } = await supabase.functions.invoke("get-indications", {
        body: { client_id: clientId ?? undefined },
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

      const list = response.indications as Indication[];
      // Validação dupla: apenas indicações do cliente atual
      if (clientId) {
        const invalid = list.filter((i) => i.client_id && i.client_id !== clientId);
        if (invalid.length > 0) {
          console.error("[SECURITY] useIndications: indicações de outro cliente detectadas:", invalid.length);
          return [];
        }
      }
      return list;
    },
    enabled: !!clientId,
    staleTime: 1000 * 30, // 30 segundos
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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

