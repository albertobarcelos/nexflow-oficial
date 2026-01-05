import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { OrganizationTeam } from "./useOrganizationTeams";

export function useCompanyTeams(clientId?: string | null) {
  return useQuery({
    queryKey: ["company-teams", clientId],
    queryFn: async (): Promise<OrganizationTeam[]> => {
      if (!clientId) return [];

      const { data: teams, error } = await supabase
        .from("core_teams")
        .select(`
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
        `)
        .eq("client_id", clientId)
        .order("name");

      if (error) {
        console.error("Erro ao buscar times da empresa:", error);
        return [];
      }

      // Buscar contagem de membros para cada time
      const teamsWithMembers = await Promise.all(
        (teams || []).map(async (team: any) => {
          const { count } = await supabase
            .from("core_team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id);

          return {
            id: team.id,
            name: team.name,
            description: team.description,
            is_active: team.is_active,
            client_id: team.client_id,
            franchise_id: team.franchise_id,
            current_level_id: team.current_level_id,
            member_count: count || 0,
            franchise_name: team.core_franchises?.name || null,
            franchise_code: team.core_franchises?.code || null,
          };
        })
      );

      return teamsWithMembers;
    },
    enabled: !!clientId,
  });
}
