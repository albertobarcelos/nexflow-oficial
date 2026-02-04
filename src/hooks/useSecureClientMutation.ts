import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentClientId } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";

/** Variáveis da mutação (genéricas) */
export type SecureClientMutationFn<TData = unknown, TVariables = unknown> = (
  supabaseClient: typeof supabase,
  clientId: string,
  variables: TVariables
) => Promise<TData>;

export interface UseSecureClientMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = unknown,
  TContext = unknown
> {
  /** Função da mutação; recebe (supabase, clientId, variables). Deve incluir client_id no payload. */
  mutationFn: SecureClientMutationFn<TData, TVariables>;
  /** Validar que o resultado da mutação contém client_id igual ao atual */
  validateClientIdOnResult?: boolean;
  /** Opções adicionais do useMutation */
  mutationOptions?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
  >;
}

/**
 * Hook seguro para mutações isoladas por client_id.
 * Garante que clientId está disponível antes de executar e que o payload/resultado
 * pode ser validado em relação ao client_id.
 */
export function useSecureClientMutation<
  TData = unknown,
  TError = Error,
  TVariables = unknown,
  TContext = unknown
>(
  options: UseSecureClientMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { currentClient } = useClientStore();

  return useMutation({
    ...options.mutationOptions,
    mutationFn: async (variables: TVariables) => {
      // Obter clientId do store ou do Supabase
      let clientId = currentClient?.id;
      if (!clientId) {
        clientId = await getCurrentClientId();
      }
      if (!clientId) {
        throw new Error("Cliente não definido. Não é possível executar a mutação.");
      }
      const result = await options.mutationFn(supabase, clientId, variables);
      if (options.validateClientIdOnResult && result && typeof result === "object" && "client_id" in result) {
        if ((result as { client_id: string }).client_id !== clientId) {
          console.error("[SECURITY] Resultado da mutação com client_id incorreto");
          throw new Error("Erro de segurança na mutação: client_id incorreto");
        }
      }
      return result;
    },
  });
}

/**
 * Helper para invalidar queries por cliente após mutação.
 * Uso: onSuccess: () => { invalidateClientQueries(queryClient, ['companies']); }
 */
export function invalidateClientQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKeyPrefix: string[]
): void {
  const clientId = useClientStore.getState().currentClient?.id;
  if (clientId) {
    queryClient.invalidateQueries({
      queryKey: [...queryKeyPrefix, clientId],
    });
  }
  queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
}
