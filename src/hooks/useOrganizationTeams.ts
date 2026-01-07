import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OrganizationTeam {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  client_id: string;
  clientName: string;
  is_active: boolean;
}

export function useOrganizationTeams() {
  return useQuery({
    queryKey: ["organization-teams"],
    queryFn: async () => {
      try {
        // Buscar todos os times com JOIN em core_clients e filtrar apenas ativos
        // Nota: core_teams pode não estar no schema TypeScript, mas existe no banco
        const { data: teams, error } = await (supabase as any)
          .from("core_teams")
          .select(`
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
          `)
          
          .order("name");

        if (error) {
          console.error("Erro ao buscar times:", error);
          return [];
        }

        // Para cada time, contar os membros e processar dados do cliente
        const teamsWithCount = await Promise.all(
          (teams || []).map(async (team: any) => {
            const { count, error: countError } = await (supabase as any)
              .from("core_team_members")
              .select("*", { count: "exact", head: true })
              .eq("team_id", team.id);

            if (countError) {
              console.error(`Erro ao contar membros do time ${team.id}:`, countError);
            }

            // Extrair nome do cliente do JOIN
            const client = team.core_clients;
            const clientName = client?.company_name || client?.name || "Cliente não encontrado";

            return {
              id: team.id,
              name: team.name,
              description: team.description,
              member_count: count || 0,
              client_id: team.client_id,
              clientName: clientName,
              is_active: team.is_active,
            };
          })
        );

        return teamsWithCount;
      } catch (error) {
        console.error("Erro ao buscar times:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false, // #region agent log - Fix: Disable auto refetch, rely on soft reload
    // #endregion
  });
}

