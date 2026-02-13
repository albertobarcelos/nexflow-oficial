import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FlowSalesMetrics } from "../types";

/**
 * Busca métricas do dashboard de vendas para um flow (RPC get_flow_sales_metrics).
 * Usar apenas para flows com category = 'finance'.
 */
export function useFlowSalesMetrics(flowId: string | null) {
  return useQuery({
    queryKey: ["flow-sales-metrics", flowId],
    queryFn: async (): Promise<FlowSalesMetrics> => {
      if (!flowId) throw new Error("flowId é obrigatório");
      const { data, error } = await (supabase.rpc as (name: string, args: { p_flow_id: string }) => ReturnType<typeof supabase.rpc>)(
        "get_flow_sales_metrics",
        { p_flow_id: flowId },
      );
      if (error) throw error;
      return data as unknown as FlowSalesMetrics;
    },
    enabled: Boolean(flowId),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
