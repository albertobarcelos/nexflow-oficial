import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface FlowPermissions {
  isAdministrator: boolean;
  isLeader: boolean;
  isTeamAdmin: boolean;
  isMember: boolean;
  canCreateFlow: boolean;
  canEditFlow: boolean | null; // null se flowId não foi fornecido
  cannotBeExcluded: boolean;
  teamRoles: string[];
  clientId: string | null;
}

/**
 * Hook para verificar permissões do usuário atual relacionadas a flows
 * @param flowId - ID do flow para verificar permissão de edição específica (opcional)
 */
export function useFlowPermissions(flowId?: string): {
  permissions: FlowPermissions | null;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useQuery({
    queryKey: ["flow-permissions", flowId],
    queryFn: async (): Promise<FlowPermissions> => {
      const { data, error } = await supabase.functions.invoke("check-flow-permissions", {
        body: flowId ? { flowId } : {},
      });

      if (error) {
        console.error("Erro ao verificar permissões:", error);
        throw error;
      }

      return {
        isAdministrator: data.isAdministrator || false,
        isLeader: data.isLeader || false,
        isTeamAdmin: data.isTeamAdmin || false,
        isMember: data.isMember || false,
        canCreateFlow: data.canCreateFlow || false,
        canEditFlow: data.canEditFlow ?? null,
        cannotBeExcluded: data.cannotBeExcluded || false,
        teamRoles: data.teamRoles || [],
        clientId: data.clientId || null,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false, // #region agent log - Fix: Disable auto refetch, rely on soft reload
    // #endregion
    retry: 1,
  });

  return {
    permissions: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
