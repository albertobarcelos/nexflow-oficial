/**
 * Tipos para os dashboards dinâmicos por flow.
 * Espelham o retorno das RPCs get_flow_sales_metrics e get_flow_onboarding_metrics.
 */

/** Um item do funil de vendas (contagem e valor por etapa) */
export interface FlowSalesFunnelItem {
  step_id: string;
  step_title: string;
  position: number;
  count: number;
  total_value: number;
}

/** Retorno da RPC get_flow_sales_metrics */
export interface FlowSalesMetrics {
  funnel: FlowSalesFunnelItem[];
  total_open: number;
  total_won: number;
  conversion_rate: number;
}

/** Contagem de cards por status (chaves: inprogress, completed, canceled) */
export type CardsByStatus = Record<string, number>;

/** Faixas de strikes para onboarding */
export interface FlowStrikes {
  with_strikes: number;
  range_0: number;
  range_1_2: number;
  range_3_5: number;
  range_6_plus: number;
}

/** Tempo médio por etapa (gargalos) */
export interface AvgTimePerStepItem {
  step_id: string;
  step_title: string;
  position: number;
  avg_duration_seconds: number;
  card_count: number;
}

/** Atividades agrupadas por responsável */
export interface ActivitiesByAssigneeItem {
  assignee_id: string | null;
  assignee_name: string;
  realized: number;
  pending: number;
  overdue: number;
}

/** Retorno da RPC get_flow_onboarding_metrics */
export interface FlowOnboardingMetrics {
  cards_by_status: CardsByStatus;
  strikes: FlowStrikes;
  avg_time_per_step: AvgTimePerStepItem[];
  activities_by_assignee: ActivitiesByAssigneeItem[];
}
