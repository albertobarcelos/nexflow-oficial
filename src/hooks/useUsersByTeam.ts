import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentClientId } from "@/lib/supabase";

export interface UserByTeam {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  is_active: boolean;
  avatar_url?: string | null;
  custom_avatar_url?: string | null;
}

/**
 * Hook para buscar usuários filtrados por time
 * Retorna lista de usuários ativos do time especificado
 */
export function useUsersByTeam(teamId: string | null) {
  return useQuery({
    queryKey: ["users-by-team", teamId],
    queryFn: async (): Promise<UserByTeam[]> => {
      if (!teamId) {
        return [];
      }

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      try {
        // Buscar membros do time com JOIN em core_client_users
        const { data: members, error } = await (supabase as any)
          .from("core_team_members")
          .select(`
            id,
            role,
            user_profile_id,
            core_client_users:user_profile_id (
              id,
              name,
              surname,
              email,
              role,
              is_active,
              avatar_url,
              custom_avatar_url
            )
          `)
          .eq("team_id", teamId);

        if (error) {
          console.error("Erro ao buscar membros do time:", error);
          return [];
        }

        // Processar dados do JOIN e filtrar apenas usuários ativos
        const users = (members || [])
          .map((member: any) => {
            const user = member.core_client_users;
            if (!user || !user.is_active) {
              return null;
            }

            return {
              id: user.id,
              name: user.name || "",
              surname: user.surname || "",
              email: user.email,
              role: user.role,
              is_active: user.is_active,
              avatar_url: user.avatar_url,
              custom_avatar_url: user.custom_avatar_url,
            } as UserByTeam;
          })
          .filter((user: UserByTeam | null) => user !== null) as UserByTeam[];

        return users;
      } catch (error) {
        console.error("Erro ao buscar usuários do time:", error);
        return [];
      }
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
