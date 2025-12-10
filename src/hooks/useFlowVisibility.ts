import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, supabase } from "@/lib/supabase";
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

// --- Hooks para FlowTeamAccess ---
export function useFlowTeamAccess(flowId?: string) {
  return useQuery({
    queryKey: ["nexflow", "flow-team-access", flowId],
    enabled: !!flowId,
    queryFn: async (): Promise<string[]> => {
      if (!flowId) return [];
      const { data, error } = await nexflowClient()
        .from("flow_team_access")
        .select("team_id")
        .eq("flow_id", flowId);

      if (error) {
        console.error("Erro ao carregar acesso de times do flow:", error);
        throw error;
      }
      return data?.map((row) => row.team_id) || [];
    },
  });
}

export function useSaveFlowTeamAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ flowId, teamIds }: { flowId: string; teamIds: string[] }) => {
      // Delete existing and insert new ones
      await nexflowClient().from("flow_team_access").delete().eq("flow_id", flowId);

      if (teamIds.length > 0) {
        const insertPayload = teamIds.map((team_id) => ({ flow_id: flowId, team_id }));
        const { error } = await nexflowClient().from("flow_team_access").insert(insertPayload);
        if (error) {
          console.error("Erro ao salvar acesso de times do flow:", error);
          throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "flow-team-access", variables.flowId] });
    },
    onError: (error) => {
      toast.error(`Erro ao salvar acesso de times: ${error.message}`);
    },
  });
}

// --- Hooks para FlowUserExclusions ---
export function useFlowUserExclusions(flowId?: string) {
  return useQuery({
    queryKey: ["nexflow", "flow-user-exclusions", flowId],
    enabled: !!flowId,
    queryFn: async (): Promise<string[]> => {
      if (!flowId) return [];
      const { data, error } = await nexflowClient()
        .from("flow_user_exclusions")
        .select("user_id")
        .eq("flow_id", flowId);

      if (error) {
        console.error("Erro ao carregar exclusões de usuários do flow:", error);
        throw error;
      }
      return data?.map((row) => row.user_id) || [];
    },
  });
}

export function useSaveFlowUserExclusions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ flowId, userIds }: { flowId: string; userIds: string[] }) => {
      // Delete existing and insert new ones
      await nexflowClient().from("flow_user_exclusions").delete().eq("flow_id", flowId);

      if (userIds.length > 0) {
        const insertPayload = userIds.map((user_id) => ({ flow_id: flowId, user_id }));
        const { error } = await nexflowClient().from("flow_user_exclusions").insert(insertPayload);
        if (error) {
          console.error("Erro ao salvar exclusões de usuários do flow:", error);
          throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "flow-user-exclusions", variables.flowId] });
    },
    onError: (error) => {
      toast.error(`Erro ao salvar exclusões de usuários: ${error.message}`);
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

    const allowedTeamIds = teamAccess?.map(t => t.team_id) || [];
    if (allowedTeamIds.length === 0) return true; // No teams configured, all can see

    // Check if user is in any allowed team
    return userTeamIds.some(teamId => allowedTeamIds.includes(teamId));
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

    const allowedTeamIds = teamAccess?.map(t => t.team_id) || [];
    if (allowedTeamIds.length === 0) return true; // No teams configured, all can see

    const isInAllowedTeams = userTeamIds.some(teamId => allowedTeamIds.includes(teamId));
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

      return data?.map(row => row.team_id) || [];
    },
  });
}

