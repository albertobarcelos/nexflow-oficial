import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface GlobalTeamLevel {
  id: string;
  name: string;
  level_order: number;
  commission_one_time_percentage: number | null;
  commission_recurring_percentage: number | null;
  promotion_criteria: any; // JSONB
  demotion_criteria: any; // JSONB
  description: string | null;
  is_active: boolean | null;
  client_id: string; // OBRIGATÓRIO - níveis são por cliente
  created_at: string;
  updated_at: string;
}

export interface CreateGlobalLevelInput {
  name: string;
  level_order: number;
  commission_one_time_percentage: number;
  commission_recurring_percentage: number;
  promotion_criteria?: any;
  demotion_criteria?: any;
  description?: string;
  client_id: string; // OBRIGATÓRIO - níveis são por cliente
}

export interface UpdateGlobalLevelInput {
  name?: string;
  level_order?: number;
  commission_one_time_percentage?: number;
  commission_recurring_percentage?: number;
  promotion_criteria?: any;
  demotion_criteria?: any;
  description?: string;
  is_active?: boolean;
}

/**
 * Hook para buscar níveis por cliente
 */
export function useGlobalTeamLevels(clientId?: string | null) {
  return useQuery({
    queryKey: ["global-team-levels", clientId],
    queryFn: async (): Promise<GlobalTeamLevel[]> => {
      try {
        if (!clientId) {
          // Se não tem clientId, retornar vazio
          return [];
        }

        // Buscar níveis do cliente específico
        const { data, error } = await supabase
          .from("core_team_levels")
          .select("*")
          .eq("client_id", clientId)
          .order("level_order", { ascending: true });

        if (error) {
          console.error("Erro ao buscar níveis globais:", error);
          throw error;
        }

        return (data || []) as GlobalTeamLevel[];
      } catch (error) {
        console.error("Erro ao buscar níveis globais:", error);
        return [];
      }
    },
  });
}

/**
 * Hook para criar um novo nível global
 */
export function useCreateGlobalLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGlobalLevelInput): Promise<GlobalTeamLevel> => {
      const { data, error } = await supabase
        .from("core_team_levels")
        .insert({
          name: input.name,
          level_order: input.level_order,
          commission_percentage: 0, // Padrão, não usado mais
          commission_one_time_percentage: input.commission_one_time_percentage,
          commission_recurring_percentage: input.commission_recurring_percentage,
          promotion_criteria: input.promotion_criteria || {},
          demotion_criteria: input.demotion_criteria || {},
          description: input.description,
          client_id: input.client_id, // OBRIGATÓRIO
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar nível global:", error);
        throw error;
      }

      return data as GlobalTeamLevel;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["global-team-levels"] });
      toast.success("Nível criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao criar nível global:", error);
      toast.error(error?.message || "Erro ao criar nível");
    },
  });
}

/**
 * Hook para atualizar um nível global
 */
export function useUpdateGlobalLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      levelId,
      input,
    }: {
      levelId: string;
      input: UpdateGlobalLevelInput;
    }): Promise<GlobalTeamLevel> => {
      const { data, error } = await supabase
        .from("core_team_levels")
        .update(input)
        .eq("id", levelId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar nível global:", error);
        throw error;
      }

      return data as GlobalTeamLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-team-levels"] });
      toast.success("Nível atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar nível global:", error);
      toast.error(error?.message || "Erro ao atualizar nível");
    },
  });
}

/**
 * Hook para deletar um nível global
 */
export function useDeleteGlobalLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (levelId: string): Promise<void> => {
      const { error } = await supabase
        .from("core_team_levels")
        .delete()
        .eq("id", levelId);

      if (error) {
        console.error("Erro ao deletar nível global:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-team-levels"] });
      toast.success("Nível deletado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao deletar nível global:", error);
      toast.error(error?.message || "Erro ao deletar nível");
    },
  });
}
