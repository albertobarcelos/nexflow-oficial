import {
  useQuery,
  type UseQueryOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";

/** Tipo para função de query que recebe o cliente Supabase e o client_id atual */
export type SecureClientQueryFn<TData = unknown> = (
  supabaseClient: typeof supabase,
  clientId: string
) => Promise<TData>;

export interface UseSecureClientQueryOptions<TData, TError = Error> {
  /** Chave da query; o clientId será inserido após o primeiro elemento se não estiver presente */
  queryKey: QueryKey;
  /** Função que executa a query; sempre recebe supabase e clientId */
  queryFn: SecureClientQueryFn<TData>;
  /** Se true, valida que itens em data (array) possuem client_id igual ao atual */
  validateClientIdOnData?: boolean;
  /** Opções adicionais do useQuery */
  queryOptions?: Omit<
    UseQueryOptions<TData, TError, TData, QueryKey>,
    "queryKey" | "queryFn"
  >;
}

/**
 * Hook seguro para consultas isoladas por client_id.
 * A queryKey deve incluir o clientId (será preenchida automaticamente com o do store).
 * A queryFn sempre recebe (supabase, clientId) e deve filtrar por client_id.
 */
export function useSecureClientQuery<TData = unknown, TError = Error>(
  options: UseSecureClientQueryOptions<TData, TError>
) {
  const { currentClient } = useClientStore();
  const clientId = currentClient?.id ?? null;

  const fullQueryKey = useMemo(() => {
    const key = Array.isArray(options.queryKey) ? [...options.queryKey] : [options.queryKey];
    // Garantir que clientId está na chave para cache isolado
    if (key.length < 2 || key[1] !== clientId) {
      return [key[0], clientId, ...key.slice(1)] as QueryKey;
    }
    return key as QueryKey;
  }, [options.queryKey, clientId]);

  const queryOptions: UseQueryOptions<TData, TError, TData, QueryKey> = {
    ...options.queryOptions,
    queryKey: fullQueryKey,
    enabled:
      options.queryOptions?.enabled !== false && !!clientId,
    queryFn: async () => {
      if (!clientId) {
        throw new Error("Cliente não definido");
      }
      const data = await options.queryFn(supabase, clientId);
      // Validação dupla opcional: itens de array devem ter client_id correto
      if (options.validateClientIdOnData && Array.isArray(data)) {
        const invalid = (data as { client_id?: string }[]).filter(
          (item) => item?.client_id !== clientId
        );
        if (invalid.length > 0) {
          console.error("[SECURITY] Dados de outro cliente detectados:", invalid.length);
          throw new Error("Violação de segurança: dados de outro cliente detectados");
        }
      }
      return data;
    },
  };

  return useQuery(queryOptions);
}
