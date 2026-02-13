import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useFlowSalesMetrics } from "../hooks/useFlowSalesMetrics";
import type { FlowSalesFunnelItem } from "../types";
import { cn } from "@/lib/utils";

/** Formata valor em BRL */
function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

interface SalesDashboardProps {
  flowId: string;
  className?: string;
}

/**
 * Dashboard de vendas: funil por etapa, valor em aberto/ganho e taxa de conversão.
 * Usado para flows com category = 'finance'.
 */
export function SalesDashboard({ flowId, className }: SalesDashboardProps) {
  const { data, isLoading, error } = useFlowSalesMetrics(flowId);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-[350px] animate-pulse rounded bg-muted" />
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
            Erro ao carregar métricas de vendas. Tente novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const funnel = data?.funnel ?? [];
  const totalOpen = data?.total_open ?? 0;
  const totalWon = data?.total_won ?? 0;
  const conversionRate = data?.conversion_rate ?? 0;

  // Dados para o gráfico de barras (funil): ordem sequencial por position
  const chartData: { name: string; quantidade: number; fullLabel: string }[] =
    funnel.map((item: FlowSalesFunnelItem) => ({
      name:
        item.step_title.length > 20
          ? item.step_title.slice(0, 20) + "…"
          : item.step_title,
      fullLabel: item.step_title,
      quantidade: item.count,
    }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* KPIs: Valor em aberto, Valor ganho, Taxa de conversão */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor em aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(totalOpen)}</div>
            <p className="text-xs text-muted-foreground">Cards em progresso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor ganho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(totalWon)}</div>
            <p className="text-xs text-muted-foreground">Cards concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Até a etapa final</p>
          </CardContent>
        </Card>
      </div>

      {/* Funil de conversão: barras horizontais por etapa */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de conversão</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quantidade de cards em cada etapa
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum dado no funil para este flow.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 8, right: 24 }}
              >
                <XAxis
                  type="number"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [value, "Quantidade"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullLabel ?? ""
                  }
                />
                <Bar
                  dataKey="quantidade"
                  fill="currentColor"
                  radius={[0, 4, 4, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
