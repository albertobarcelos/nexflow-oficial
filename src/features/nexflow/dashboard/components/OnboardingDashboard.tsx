import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFlowOnboardingMetrics } from "../hooks/useFlowOnboardingMetrics";
import type {
  ActivitiesByAssigneeItem,
  AvgTimePerStepItem,
  CardsByStatus,
} from "../types";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444"];
const STACK_COLORS = {
  realized: "#22c55e",
  pending: "#3b82f6",
  overdue: "#ef4444",
};

/** Mapeamento status → cor para o pie (Cancelado sempre vermelho) */
const STATUS_COLORS: Record<string, string> = {
  canceled: "#ef4444",
  completed: "#22c55e",
  inprogress: "#3b82f6",
};

/** Ordem fixa dos status para a legenda do pie */
const PIE_STATUS_ORDER = ["inprogress", "completed", "canceled"] as const;

/** Converte segundos em dias para exibição */
function secondsToDays(seconds: number): number {
  return Math.round((seconds / 86400) * 10) / 10;
}

const STATUS_LABELS: Record<string, string> = {
  inprogress: "Em progresso",
  completed: "Concluído",
  canceled: "Cancelado",
};

interface OnboardingDashboardProps {
  flowId: string;
  className?: string;
}

/**
 * Dashboard de onboarding: saúde da carteira (pie), gargalos (tempo por etapa),
 * atividades por responsável (stacked bar).
 */
export function OnboardingDashboard({
  flowId,
  className,
}: OnboardingDashboardProps) {
  const { data, isLoading, error } = useFlowOnboardingMetrics(flowId);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-[280px] animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-[300px] animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            Erro ao carregar métricas de onboarding. Tente novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cardsByStatus: CardsByStatus = data?.cards_by_status ?? {};
  const strikes = data?.strikes ?? {
    with_strikes: 0,
    range_0: 0,
    range_1_2: 0,
    range_3_5: 0,
    range_6_plus: 0,
  };
  const avgTimePerStep: AvgTimePerStepItem[] = data?.avg_time_per_step ?? [];
  const activitiesByAssignee: ActivitiesByAssigneeItem[] =
    data?.activities_by_assignee ?? [];

  // Pie: saúde da carteira (cards por status), ordem fixa e cor por status (Cancelado = vermelho)
  const pieData = PIE_STATUS_ORDER.filter(
    (status) => (cardsByStatus[status] ?? 0) > 0,
  ).map((status) => ({
    name: STATUS_LABELS[status] ?? status,
    value: Number(cardsByStatus[status]),
    status,
  }));

  // Bar: gargalos (tempo médio por etapa em dias)
  const barData = avgTimePerStep.map((item: AvgTimePerStepItem) => ({
    name:
      item.step_title.length > 18
        ? item.step_title.slice(0, 18) + "…"
        : item.step_title,
    fullName: item.step_title,
    dias: secondsToDays(item.avg_duration_seconds),
    avg_duration_seconds: item.avg_duration_seconds,
    card_count: item.card_count,
  }));

  // Stacked bar: atividades por responsável
  const stackData = activitiesByAssignee.map((a: ActivitiesByAssigneeItem) => ({
    name: a.assignee_name?.trim() || "Sem responsável",
    realizadas: a.realized,
    pendentes: a.pending,
    atrasadas: a.overdue,
  }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* KPI: Cards com strikes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cards com strikes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strikes.with_strikes}</div>
            <p className="text-xs text-muted-foreground">
              Total com pelo menos 1 strike
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Saúde da carteira: Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Saúde da carteira</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribuição por status
            </p>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum card neste flow.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.status ?? index}`}
                        fill={
                          STATUS_COLORS[entry.status] ??
                          PIE_COLORS[index % PIE_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gargalos: tempo médio por etapa */}
        <Card>
          <CardHeader>
            <CardTitle>Gargalos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tempo médio de permanência por etapa (dias)
            </p>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sem dados de tempo por etapa.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ left: 8, right: 24 }}>
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}d`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      value + " dias",
                      "Tempo médio",
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ?? ""
                    }
                  />
                  <Bar
                    dataKey="dias"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-amber-500"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atividades por responsável: Stacked Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades por responsável</CardTitle>
          <p className="text-sm text-muted-foreground">
            Realizadas, pendentes e atrasadas
          </p>
        </CardHeader>
        <CardContent>
          {stackData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma atividade registrada.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stackData} margin={{ left: 8, right: 24 }}>
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="realizadas"
                  fill={STACK_COLORS.realized}
                  name="Realizadas"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="pendentes"
                  fill={STACK_COLORS.pending}
                  name="Pendentes"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="atrasadas"
                  fill={STACK_COLORS.overdue}
                  name="Atrasadas"
                  stackId="a"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
