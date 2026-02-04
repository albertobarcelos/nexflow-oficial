import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useClientStore } from "@/stores/clientStore";

export interface TeamMemberLevel {
  id: string;
  team_member_id: string;
  team_level_id: string;
  effective_from: string;
  effective_to: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  level?: {
    id: string;
    name: string;
    level_order: number;
    commission_one_time_percentage: number | null;
    commission_recurring_percentage: number | null;
  };
}

export interface TeamMemberWithLevel {
  member_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  current_level_id: string | null;
  current_level_name: string | null;
  current_level_order: number | null;
  role_in_team: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep";
}

/**
 * Hook para buscar níveis de um membro do time (multi-tenant: queryKey inclui clientId para cache isolado).
 */
export function useTeamMemberLevels(teamMemberId: string | null) {
  const clientId = useClientStore((s) => s.currentClient?.id) ?? null;

  return useQuery({
    queryKey: ["team-member-levels", clientId, teamMemberId],
    queryFn: async (): Promise<TeamMemberLevel[]> => {
      if (!teamMemberId) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from("core_team_member_levels")
          .select(`
            *,
            core_team_levels:team_level_id (
              id,
              name,
              level_order,
              commission_one_time_percentage,
              commission_recurring_percentage
            )
          `)
          .eq("team_member_id", teamMemberId)
          .order("effective_from", { ascending: false });

        if (error) {
          console.error("Erro ao buscar níveis do membro:", error);
          throw error;
        }

        return (data || []).map((item: Record<string, unknown>) => ({
          ...item,
          level: item.core_team_levels,
        })) as TeamMemberLevel[];
      } catch (error) {
        console.error("Erro ao buscar níveis do membro:", error);
        return [];
      }
    },
    enabled: !!clientId && !!teamMemberId,
  });
}

/**
 * Hook para buscar membros do time com seus níveis atuais
 */
export function useTeamMembersWithLevels(teamId: string | null) {
  return useQuery({
    queryKey: ["team-members-with-levels", teamId],
    queryFn: async (): Promise<TeamMemberWithLevel[]> => {
      if (!teamId) {
        return [];
      }

      try {
        // Buscar membros do time
        const { data: members, error: membersError } = await supabase
          .from("core_team_members")
          .select(`
            id,
            user_profile_id,
            role,
            core_client_users:user_profile_id (
              id,
              name,
              surname,
              email,
              role
            )
          `)
          .eq("team_id", teamId);

        if (membersError) {
          throw membersError;
        }

        // Para cada membro, buscar nível atual
        const membersWithLevels = await Promise.all(
          (members || []).map(async (member: any) => {
            const user = member.core_client_users;
            if (!user) {
              return null;
            }

            // Buscar nível atual (effective_to IS NULL)
            const { data: currentLevel } = await supabase
              .from("core_team_member_levels")
              .select(`
                team_level_id,
                core_team_levels:team_level_id (
                  id,
                  name,
                  level_order
                )
              `)
              .eq("team_member_id", member.id)
              .is("effective_to", null)
              .single();

            return {
              member_id: member.id,
              user_id: user.id,
              user_name: `${user.name || ""} ${user.surname || ""}`.trim() || user.email,
              user_email: user.email,
              user_role: user.role,
              current_level_id: currentLevel?.team_level_id || null,
              current_level_name: currentLevel?.core_team_levels?.name || null,
              current_level_order: currentLevel?.core_team_levels?.level_order || null,
              role_in_team: member.role,
            } as TeamMemberWithLevel;
          })
        );

        return membersWithLevels.filter((m) => m !== null) as TeamMemberWithLevel[];
      } catch (error) {
        console.error("Erro ao buscar membros com níveis:", error);
        return [];
      }
    },
    enabled: !!teamId,
  });
}

/**
 * Hook para atribuir nível a um membro
 */
export function useAssignLevelToMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamMemberId,
      levelId,
      teamId,
    }: {
      teamMemberId: string;
      levelId: string;
      teamId: string;
    }): Promise<TeamMemberLevel> => {
      // Buscar client_id do time
      const { data: team, error: teamError } = await supabase
        .from("core_teams")
        .select("client_id")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        throw new Error("Time não encontrado");
      }

      // Finalizar nível atual (se existir)
      await supabase
        .from("core_team_member_levels")
        .update({ effective_to: new Date().toISOString() })
        .eq("team_member_id", teamMemberId)
        .is("effective_to", null);

      // Criar novo nível
      const { data, error } = await supabase
        .from("core_team_member_levels")
        .insert({
          team_member_id: teamMemberId,
          team_level_id: levelId,
          effective_from: new Date().toISOString(),
          effective_to: null,
          client_id: team.client_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao atribuir nível:", error);
        throw error;
      }

      return data as TeamMemberLevel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-member-levels"] });
      queryClient.invalidateQueries({ queryKey: ["team-members-with-levels", variables.teamId] });
      toast.success("Nível atribuído com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao atribuir nível:", error);
      toast.error(error?.message || "Erro ao atribuir nível");
    },
  });
}

/**
 * Hook para remover nível de um membro (finalizar)
 */
export function useRemoveLevelFromMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamMemberId,
      teamId,
    }: {
      teamMemberId: string;
      teamId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from("core_team_member_levels")
        .update({ effective_to: new Date().toISOString() })
        .eq("team_member_id", teamMemberId)
        .is("effective_to", null);

      if (error) {
        console.error("Erro ao remover nível:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-member-levels"] });
      queryClient.invalidateQueries({ queryKey: ["team-members-with-levels", variables.teamId] });
      toast.success("Nível removido com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao remover nível:", error);
      toast.error(error?.message || "Erro ao remover nível");
    },
  });
}
