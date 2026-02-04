import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";

export interface OrganizationTeam {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  client_id: string;
  clientName: string;
  is_active: boolean;
}

/**
 * Times da organização do cliente atual (multi-tenant seguro).
 * QueryKey inclui clientId; validação dupla nos dados retornados.
 */
export function useOrganizationTeams() {
  return useSecureClientQuery<OrganizationTeam[]>({
    queryKey: ["organization-teams"],
    queryFn: async (client, clientId) => {
      const { data: teams, error } = await client
        .from("core_teams")
        .select(
          `
            id,
            name,
            description,
            client_id,
            is_active,
            core_clients:client_id (
              id,
              name,
              company_name
            )
          `
        )
        .eq("client_id", clientId)
        .order("name");

      if (error) {
        console.error("Erro ao buscar times:", error);
        return [];
      }

      const teamsWithCount = await Promise.all(
        (teams || []).map(async (team: Record<string, unknown>) => {
          const { count, error: countError } = await client
            .from("core_team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id);

          if (countError) {
            console.error(`Erro ao contar membros do time ${team.id}:`, countError);
          }

          const clientData = team.core_clients as { company_name?: string; name?: string } | null;
          const clientName = clientData?.company_name || clientData?.name || "Cliente não encontrado";

          return {
            id: team.id as string,
            name: team.name as string,
            description: team.description as string | null,
            member_count: count || 0,
            client_id: team.client_id as string,
            clientName,
            is_active: team.is_active as boolean,
          };
        })
      );

      return teamsWithCount;
    },
    validateClientIdOnData: true,
    queryOptions: {
      refetchOnWindowFocus: false,
    },
  });
}
