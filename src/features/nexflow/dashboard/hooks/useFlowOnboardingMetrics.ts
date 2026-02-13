import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FlowOnboardingMetrics } from "../types";

/**
 * Busca métricas do dashboard de onboarding para um flow (RPC get_flow_onboarding_metrics).
 * Usar apenas para flows com category = 'onboarding'.
 */
export function useFlowOnboardingMetrics(flowId: string | null) {
  return useQuery({
    queryKey: ["flow-onboarding-metrics", flowId],
    queryFn: async (): Promise<FlowOnboardingMetrics> => {
      if (!flowId) throw new Error("flowId é obrigatório");
      const { data, error } = await (supabase.rpc as (name: string, args: { p_flow_id: string }) => ReturnType<typeof supabase.rpc>)(
        "get_flow_onboarding_metrics",
        { p_flow_id: flowId },
      );
      if (error) throw error;
      return data as unknown as FlowOnboardingMetrics;
    },
    enabled: Boolean(flowId),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
