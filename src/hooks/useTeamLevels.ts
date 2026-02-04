import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useClientStore } from "@/stores/clientStore";

export interface TeamLevel {
  id: string;
  team_id: string;
  name: string;
  level_order: number;
  commission_percentage: number;
  commission_one_time_percentage: number | null;
  commission_recurring_percentage: number | null;
  description: string | null;
  is_active: boolean | null;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamLevelInput {
  team_id: string;
  name: string;
  level_order: number;
  commission_one_time_percentage: number;
  commission_recurring_percentage: number;
  description?: string;
}

export interface UpdateTeamLevelInput {
  name?: string;
  level_order?: number;
  commission_one_time_percentage?: number;
  commission_recurring_percentage?: number;
  description?: string;
  is_active?: boolean;
}

/**
 * Hook para buscar níveis de um time (multi-tenant: queryKey inclui clientId para cache isolado).
 */
export function useTeamLevels(teamId: string | null) {
  const clientId = useClientStore((s) => s.currentClient?.id) ?? null;

  return useQuery({
    queryKey: ["team-levels", clientId, teamId],
    queryFn: async (): Promise<TeamLevel[]> => {
      if (!teamId) {
        return [];
      }

      try {
        // Cast evita "Type instantiation is excessively deep" do Supabase/Postgrest com Database grande
        const fromTable = supabase.from("core_team_levels") as unknown as {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              order: (col: string, opts: { ascending: boolean }) => Promise<{
                data: TeamLevel[] | null;
                error: Error | null;
              }>;
            };
          };
        };
        const { data, error } = await fromTable
          .select("*")
          .eq("team_id", teamId)
          .order("level_order", { ascending: true });

        if (error) {
          console.error("Erro ao buscar níveis do time:", error);
          throw error;
        }

        return data ?? [];
      } catch (error) {
        console.error("Erro ao buscar níveis do time:", error);
        return [];
      }
    },
    enabled: !!clientId && !!teamId,
  });
}

/**
 * Hook para criar um novo nível
 */
export function useCreateTeamLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTeamLevelInput): Promise<TeamLevel> => {
      // Buscar client_id do time
      const { data: team, error: teamError } = await supabase
        .from("core_teams")
        .select("client_id")
        .eq("id", input.team_id)
        .single();

      if (teamError || !team) {
        throw new Error("Time não encontrado");
      }

      const { data, error } = await supabase
        .from("core_team_levels")
        .insert({
          team_id: input.team_id,
          name: input.name,
          level_order: input.level_order,
          commission_percentage: 0, // Padrão, não usado mais
          commission_one_time_percentage: input.commission_one_time_percentage,
          commission_recurring_percentage: input.commission_recurring_percentage,
          description: input.description,
          client_id: team.client_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar nível:", error);
        throw error;
      }

      return data as unknown as TeamLevel;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-levels", data.team_id] });
      toast.success("Nível criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao criar nível:", error);
      toast.error(error?.message || "Erro ao criar nível");
    },
  });
}

/**
 * Hook para atualizar um nível
 */
export function useUpdateTeamLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      levelId,
      input,
    }: {
      levelId: string;
      input: UpdateTeamLevelInput;
    }): Promise<TeamLevel> => {
      const { data, error } = await supabase
        .from("core_team_levels")
        .update(input)
        .eq("id", levelId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar nível:", error);
        throw error;
      }

      return data as unknown as TeamLevel;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-levels", data.team_id] });
      toast.success("Nível atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar nível:", error);
      toast.error(error?.message || "Erro ao atualizar nível");
    },
  });
}

/**
 * Hook para deletar um nível
 */
export function useDeleteTeamLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (levelId: string): Promise<void> => {
      // Buscar team_id antes de deletar para invalidar cache
      const { data: level } = (await supabase
        .from("core_team_levels")
        .select("team_id")
        .eq("id", levelId)
        .single()) as { data: { team_id: string } | null };

      const { error } = await supabase
        .from("core_team_levels")
        .delete()
        .eq("id", levelId);

      if (error) {
        console.error("Erro ao deletar nível:", error);
        throw error;
      }

      if (level?.team_id) {
        queryClient.invalidateQueries({ queryKey: ["team-levels", level.team_id] });
      }
    },
    onSuccess: () => {
      toast.success("Nível deletado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao deletar nível:", error);
      toast.error(error?.message || "Erro ao deletar nível");
    },
  });
}

/**
 * Hook para reordenar níveis (atualizar level_order)
 */
export function useReorderTeamLevels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      levels,
    }: {
      teamId: string;
      levels: { id: string; level_order: number }[];
    }): Promise<void> => {
      // Atualizar level_order de todos os níveis
      const updates = levels.map((level) =>
        supabase
          .from("core_team_levels")
          .update({ level_order: level.level_order })
          .eq("id", level.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        console.error("Erro ao reordenar níveis:", errors);
        throw new Error("Erro ao reordenar níveis");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-levels", variables.teamId] });
      toast.success("Níveis reordenados com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao reordenar níveis:", error);
      toast.error(error?.message || "Erro ao reordenar níveis");
    },
  });
}
