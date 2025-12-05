import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OrganizationTeam {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
}

export function useOrganizationTeams() {
  return useQuery({
    queryKey: ["organization-teams"],
    queryFn: async () => {
      try {
        // Buscar todos os times
        // Nota: core_teams pode não estar no schema TypeScript, mas existe no banco
        const { data: teams, error } = await (supabase as any)
          .from("core_teams")
          .select(`
            id,
            name,
            description
          `)
          .order("name");

        if (error) {
          console.error("Erro ao buscar times:", error);
          return [];
        }

        // Para cada time, contar os membros
        const teamsWithCount = await Promise.all(
          (teams || []).map(async (team: any) => {
            const { count, error: countError } = await (supabase as any)
              .from("core_team_members")
              .select("*", { count: "exact", head: true })
              .eq("team_id", team.id);

            if (countError) {
              console.error(`Erro ao contar membros do time ${team.id}:`, countError);
              return {
                id: team.id,
                name: team.name,
                description: team.description,
                member_count: 0,
              };
            }

            return {
              id: team.id,
              name: team.name,
              description: team.description,
              member_count: count || 0,
            };
          })
        );

        return teamsWithCount;
      } catch (error) {
        console.error("Erro ao buscar times:", error);
        return [];
      }
    },
  });
}

