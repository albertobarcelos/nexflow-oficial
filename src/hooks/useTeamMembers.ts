import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TeamMember {
  id: string; // user_profile_id
  member_id: string; // ID do core_team_members
  name: string;
  surname: string;
  email: string;
  role: string; // Role do membro no time (EC, EV, SDR, EP, etc.)
  division_percentage: number;
  is_active: boolean;
  avatar_url?: string | null;
  custom_avatar_url?: string | null;
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) {
        return [];
      }

      try {
        // Buscar membros do time com JOIN em core_client_users
        const { data: members, error } = await (supabase as any)
          .from("core_team_members")
          .select(`
            id,
            role,
            division_percentage,
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

        // Processar dados do JOIN
        const processedMembers = (members || [])
          .map((member: any) => {
            const user = member.core_client_users;
            if (!user) {
              return null;
            }

            return {
              id: user.id,
              member_id: member.id, // ID do core_team_members
              name: user.name || "",
              surname: user.surname || "",
              email: user.email,
              role: member.role || "member", // Role do membro no time (default: member)
              division_percentage: member.division_percentage || 0,
              is_active: user.is_active,
              avatar_url: user.avatar_url,
              custom_avatar_url: user.custom_avatar_url,
            };
          })
          .filter((member: TeamMember | null) => member !== null) as TeamMember[];

        return processedMembers;
      } catch (error) {
        console.error("Erro ao buscar membros do time:", error);
        return [];
      }
    },
    enabled: !!teamId,
  });
}

