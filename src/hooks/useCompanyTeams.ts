import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";

/** Time da empresa com dados de franquia e contagem de membros (uso em CompanyTeamsManager). */
export interface CompanyTeam {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  client_id: string;
  franchise_id: string | null;
  current_level_id: string | null;
  member_count: number;
  franchise_name: string | null;
  franchise_code: string | null;
}

/**
 * Times da empresa do cliente atual (multi-tenant seguro).
 * Usa useSecureClientQuery: clientId do store, queryKey com clientId, validação dupla.
 */
export function useCompanyTeams() {
  return useSecureClientQuery<CompanyTeam[]>({
    queryKey: ["company-teams"],
    queryFn: async (client, clientId) => {
      const { data: teams, error } = await client
        .from("core_teams")
        .select(
          `
          id,
          name,
          description,
          is_active,
          client_id,
          franchise_id,
          current_level_id,
          core_franchises:franchise_id (
            id,
            name,
            code
          )
        `
        )
        .eq("client_id", clientId)
        .order("name");

      if (error) {
        console.error("Erro ao buscar times da empresa:", error);
        return [];
      }

      const teamsWithMembers = await Promise.all(
        (teams || []).map(async (team: Record<string, unknown>) => {
          const { count } = await client
            .from("core_team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id as string);

          const franchise = team.core_franchises as
            | { name?: string; code?: string }
            | null;
          return {
            id: team.id as string,
            name: team.name as string,
            description: team.description as string | null,
            is_active: team.is_active as boolean,
            client_id: team.client_id as string,
            franchise_id: team.franchise_id as string | null,
            current_level_id: team.current_level_id as string | null,
            member_count: (count ?? 0) as number,
            franchise_name: franchise?.name ?? null,
            franchise_code: franchise?.code ?? null,
          };
        })
      );

      return teamsWithMembers;
    },
    validateClientIdOnData: true,
    queryOptions: {
      refetchOnWindowFocus: false,
    },
  });
}
