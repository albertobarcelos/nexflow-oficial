import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface FlowVisibilityData {
  visibilityType: "company" | "team" | "user" | "user_exclusion";
  teamIds: string[];
  excludedUserIds: string[];
}

// Hook UNIFICADO para ler visibilidade (Substitui useFlowTeamAccess e useFlowUserExclusions)
export function useFlowVisibilityData(flowId?: string) {
  return useQuery({
    queryKey: ["nexflow", "flow-visibility", flowId],
    enabled: !!flowId,
    queryFn: async (): Promise<FlowVisibilityData> => {
      const { data, error } = await supabase.functions.invoke("get-flow-visibility", {
        body: { flowId },
      });

      if (error) {
        console.error("Erro ao buscar visibilidade:", error);
        return { visibilityType: "company", teamIds: [], excludedUserIds: [] };
      }

      // Normalizar tipo para o frontend (user_exclusion -> user)
      const type = data.visibilityType === "user_exclusion" ? "user" : data.visibilityType;

      return {
        visibilityType: type,
        teamIds: data.teamIds || [],
        excludedUserIds: data.excludedUserIds || [],
      };
    },
  });
}

// Hook para atualizar (Já estava correto, mantendo ajustado)
export function useUpdateFlowVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      flowId,
      visibilityType,
      teamIds,
      excludedUserIds,
    }: {
      flowId: string;
      visibilityType: "company" | "team" | "user" | "user_exclusion";
      teamIds: string[];
      excludedUserIds: string[];
    }) => {
      if (!flowId) throw new Error("FlowId é obrigatório");

      // Mapeamento user -> user_exclusion
      const apiType = visibilityType === "user" ? "user_exclusion" : visibilityType;

      const { data, error } = await supabase.functions.invoke("update-flow-visibility", {
        body: {
          flowId,
          visibilityType: apiType,
          teamIds,
          excludedUserIds,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalida a query unificada
      queryClient.invalidateQueries({
        queryKey: ["nexflow", "flow-visibility", variables.flowId],
      });
      queryClient.invalidateQueries({
        queryKey: ["nexflow", "flows", variables.flowId],
      });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar visibilidade: ${error.message}`);
    },
  });
}

// --- Hooks legados mantidos para compatibilidade (podem ser removidos depois) ---
// Estes hooks ainda são usados em outros lugares do código

import { nexflowClient } from "@/lib/supabase";
import { Database } from "@/types/database";

type FlowTeamAccessRow = Database["nexflow"]["Tables"]["flow_team_access"]["Row"];
type FlowUserExclusionsRow = Database["nexflow"]["Tables"]["flow_user_exclusions"]["Row"];

export interface FlowTeamAccess {
  id: string;
  flowId: string;
  teamId: string;
  createdAt: string;
}

export interface FlowUserExclusion {
  id: string;
  flowId: string;
  userId: string;
  createdAt: string;
}

const mapFlowTeamAccessRow = (row: FlowTeamAccessRow): FlowTeamAccess => ({
  id: row.id,
  flowId: row.flow_id,
  teamId: row.team_id,
  createdAt: row.created_at,
});

const mapFlowUserExclusionRow = (row: FlowUserExclusionsRow): FlowUserExclusion => ({
  id: row.id,
  flowId: row.flow_id,
  userId: row.user_id,
  createdAt: row.created_at,
});

// --- Hooks para FlowTeamAccess (legado) ---
export function useFlowTeamAccess(flowId?: string) {
  return useQuery({
    queryKey: ["nexflow", "flow-team-access", flowId],
    enabled: !!flowId,
    queryFn: async (): Promise<string[]> => {
      if (!flowId) return [];

      try {
        const { data, error } = await nexflowClient()
          .from("flow_team_access")
          .select("team_id")
          .eq("flow_id", flowId);

        if (error) {
          // Se a tabela não existir ou não houver dados, retorna array vazio
          if (error.code === "PGRST116" || error.code === "42P01") {
            console.warn("Tabela flow_team_access não encontrada ou sem dados:", error.message);
            return [];
          }
          console.error("Erro ao carregar acesso de times do flow:", error);
          // Não lança erro, retorna array vazio para permitir continuar
          return [];
        }
        return data?.map((row) => row.team_id) || [];
      } catch (err) {
        console.warn("Erro ao buscar acesso de times, retornando array vazio:", err);
        return [];
      }
    },
  });
}

// --- Hooks para FlowUserExclusions (legado) ---
export function useFlowUserExclusions(flowId?: string) {
  return useQuery({
    queryKey: ["nexflow", "flow-user-exclusions", flowId],
    enabled: !!flowId,
    queryFn: async (): Promise<string[]> => {
      if (!flowId) return [];

      try {
        const { data, error } = await nexflowClient()
          .from("flow_user_exclusions")
          .select("user_id")
          .eq("flow_id", flowId);

        if (error) {
          // Se a tabela não existir ou não houver dados, retorna array vazio
          if (error.code === "PGRST116" || error.code === "42P01") {
            console.warn("Tabela flow_user_exclusions não encontrada ou sem dados:", error.message);
            return [];
          }
          console.error("Erro ao carregar exclusões de usuários do flow:", error);
          // Não lança erro, retorna array vazio para permitir continuar
          return [];
        }
        return data?.map((row) => row.user_id) || [];
      } catch (err) {
        console.warn("Erro ao buscar exclusões de usuários, retornando array vazio:", err);
        return [];
      }
    },
  });
}

// --- Função para verificar se usuário pode ver flow ---
export async function canUserViewFlow(
  flowId: string,
  userId: string,
  userClientId: string,
  userTeamIds: string[]
): Promise<boolean> {
  const client = nexflowClient();

  // 1. Get flow with visibility type
  const { data: flow, error: flowError } = await client
    .from("flows")
    .select("client_id, visibility_type")
    .eq("id", flowId)
    .single();

  if (flowError || !flow) {
    console.error("Erro ao buscar flow para verificar visibilidade:", flowError);
    return false;
  }

  // Must be same client
  if (flow.client_id !== userClientId) {
    return false;
  }

  const visibilityType = (flow.visibility_type as "company" | "team" | "user") || "company";

  // 2. Check based on visibility type
  if (visibilityType === "company") {
    // All users in the same client can see
    return true;
  }

  if (visibilityType === "team") {
    // Check if user is in any of the allowed teams
    const { data: teamAccess, error: teamAccessError } = await client
      .from("flow_team_access")
      .select("team_id")
      .eq("flow_id", flowId);

    if (teamAccessError) {
      console.error("Erro ao buscar acesso de times para visibilidade:", teamAccessError);
      return false;
    }

    const allowedTeamIds = teamAccess?.map((t) => t.team_id) || [];
    if (allowedTeamIds.length === 0) return true; // No teams configured, all can see

    // Check if user is in any allowed team
    return userTeamIds.some((teamId) => allowedTeamIds.includes(teamId));
  }

  if (visibilityType === "user") {
    // Check if user is in any of the allowed teams AND NOT in the exclusion list
    const { data: teamAccess, error: teamAccessError } = await client
      .from("flow_team_access")
      .select("team_id")
      .eq("flow_id", flowId);

    if (teamAccessError) {
      console.error("Erro ao buscar acesso de times para visibilidade (user):", teamAccessError);
      return false;
    }

    const allowedTeamIds = teamAccess?.map((t) => t.team_id) || [];
    if (allowedTeamIds.length === 0) return true; // No teams configured, all can see

    const isInAllowedTeams = userTeamIds.some((teamId) => allowedTeamIds.includes(teamId));
    if (!isInAllowedTeams) return false;

    // Now check for exclusion
    const { data: userExclusions, error: userExclusionsError } = await client
      .from("flow_user_exclusions")
      .select("user_id")
      .eq("flow_id", flowId)
      .eq("user_id", userId);

    if (userExclusionsError) {
      console.error("Erro ao buscar exclusões de usuários para visibilidade:", userExclusionsError);
      return false;
    }

    const isExcluded = (userExclusions?.length || 0) > 0;
    return !isExcluded;
  }

  return true; // Default: allow
}

// Hook to get user's team IDs
export function useUserTeams(userId?: string) {
  return useQuery({
    queryKey: ["user-teams", userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("core_team_members")
        .select("team_id")
        .eq("user_profile_id", userId);

      if (error) {
        console.error("Erro ao buscar times do usuário:", error);
        return [];
      }

      return data?.map((row) => row.team_id) || [];
    },
  });
}
