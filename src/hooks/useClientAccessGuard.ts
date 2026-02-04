import { useEffect } from "react";
import { useClientStore, type CurrentClient } from "@/stores/clientStore";

export interface UseClientAccessGuardResult {
  /** Se o usuário tem acesso ao contexto do cliente */
  hasAccess: boolean;
  /** Mensagem de erro quando não tem acesso */
  accessError: string | null;
  /** Cliente atual (quando hasAccess é true) */
  currentClient: CurrentClient | null;
  /** Role do usuário no cliente */
  userRole: string | null;
  /** Ainda carregando o contexto */
  isLoading: boolean;
}

/**
 * Valida o acesso ao contexto do cliente antes de renderizar a página.
 * Deve ser usado no topo de toda página que exibe dados isolados por client_id.
 * Retorna hasAccess, accessError e currentClient para guard clause e auditoria.
 */
export function useClientAccessGuard(): UseClientAccessGuardResult {
  const {
    currentClient,
    userRole,
    isLoading,
    error,
    loadClientContext,
  } = useClientStore();

  useEffect(() => {
    loadClientContext();
  }, [loadClientContext]);

  const hasAccess = !isLoading && !!currentClient?.id && !error;
  const accessError = error ?? (!currentClient?.id && !isLoading ? "Cliente não definido" : null);

  return {
    hasAccess,
    accessError,
    currentClient,
    userRole,
    isLoading,
  };
}
