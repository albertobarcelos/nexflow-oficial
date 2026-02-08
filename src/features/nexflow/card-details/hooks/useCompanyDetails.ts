import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";
import type { Database } from "@/types/database";

type WebCompanyRow = Database["public"]["Tables"]["web_companies"]["Row"];

interface WebCity {
  name: string;
}

interface WebState {
  name: string;
  uf: string;
}

/** Resultado da query com joins opcionais para city/state */
export interface CompanyDetails extends Omit<WebCompanyRow, "city_id" | "state_id"> {
  city_id: string | null;
  state_id: string | null;
  city?: WebCity | null;
  state?: WebState | null;
}

/**
 * Hook para buscar dados completos de uma empresa (web_companies).
 * Usado quando há empresa vinculada ao card para exibir todos os campos.
 * Só executa a query quando companyId está presente.
 */
export function useCompanyDetails(companyId: string | null) {
  const { data: company, isLoading, error } = useSecureClientQuery<
    CompanyDetails | null,
    Error
  >({
    queryKey: ["company-details", companyId ?? ""],
    queryFn: async (client, clientId) => {
      if (!companyId) return null;

      const { data, error: queryError } = await client
        .from("web_companies")
        .select(
          `
          *,
          city:web_cities(name),
          state:web_states(name, uf)
        `
        )
        .eq("id", companyId)
        .eq("client_id", clientId)
        .single();

      if (queryError) {
        console.error("Erro ao buscar detalhes da empresa:", queryError);
        return null;
      }

      if (!data) return null;

      // Validação de segurança
      const row = data as CompanyDetails & { client_id?: string };
      if (row.client_id !== clientId) {
        console.error("[SECURITY] Empresa de outro cliente detectada");
        throw new Error("Violação de segurança: dados de outro cliente detectados");
      }

      return data as CompanyDetails;
    },
    queryOptions: {
      enabled: !!companyId,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  });

  return {
    company: company ?? null,
    isLoading,
    error,
  };
}
