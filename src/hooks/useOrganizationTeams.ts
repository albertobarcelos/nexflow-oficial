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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOrganizationTeams.ts:38',message:'Error fetching teams',data:{error:error.message,code:error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error("Erro ao buscar times:", error);
          return [];
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOrganizationTeams.ts:42',message:'Teams fetched from database',data:{teamsCount:teams?.length || 0,teams:teams?.map((t:any)=>({id:t.id,name:t.name,is_active:t.is_active,client_id:t.client_id})) || []},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

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

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOrganizationTeams.ts:71',message:'Teams processed and returned',data:{teamsCount:teamsWithCount.length,teams:teamsWithCount.map(t=>({id:t.id,name:t.name,is_active:t.is_active,member_count:t.member_count}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        return teamsWithCount;
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOrganizationTeams.ts:76',message:'Exception in useOrganizationTeams',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error("Erro ao buscar times:", error);
        return [];
      }
    },
  });
}

