import { useState, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarUi } from "@/components/ui/calendar";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useDashboardStats, PeriodFilter } from "@/hooks/useDashboardStats";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { useSalesByProduct } from "@/hooks/useSalesByProduct";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useOrganizationUsers } from "@/hooks/useOrganizationUsers";
import { FunnelCard } from "@/components/crm/dashboard/FunnelCard";
import { SalesByProductChart } from "@/components/crm/dashboard/SalesByProductChart";
import { ActivitiesTimeline } from "@/components/crm/dashboard/ActivitiesTimeline";
import { useNavigate } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();
  const { hasAccess, accessError, currentClient } = useClientAccessGuard();

  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activitiesUserId, setActivitiesUserId] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<
    DateRange | undefined
  >(undefined);

  // Auditoria: registro de acesso à página Dashboard
  useEffect(() => {
    if (hasAccess && currentClient?.name) {
      console.log(`[AUDIT] Dashboard acessado - Client: ${currentClient.name}`);
    }
  }, [hasAccess, currentClient?.name]);

  const { data: teams = [] } = useOrganizationTeams();
  const { data: users = [] } = useOrganizationUsers();

  const customRange =
    customDateRange?.from && customDateRange?.to
      ? {
          start: (() => {
            const d = new Date(customDateRange.from!);
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
          end: (() => {
            const d = new Date(customDateRange.to!);
            d.setHours(23, 59, 59, 999);
            return d;
          })(),
        }
      : undefined;

  const { metrics, isLoading: isLoadingStats } = useDashboardStats(period, {
    teamId: selectedTeamId,
    customRange: period === "custom" ? customRange ?? null : undefined,
  });
  const { activities, isLoading: isLoadingActivities } = useRecentActivities(
    10,
    {
      teamId: selectedTeamId,
      userId: activitiesUserId,
    }
  );
  const { data: salesByProduct, isLoading: isLoadingSalesByProduct } =
    useSalesByProduct();

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background-light  p-6 md:p-8 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p className="font-medium">Sem acesso ao dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">
            {accessError ?? "Cliente não definido"}
          </p>
        </div>
      </div>
    );
  }

  const periodButtons: { label: string; value: PeriodFilter }[] = [
    { label: "Hoje", value: "today" },
    { label: "7 Dias", value: "7days" },
    { label: "30 Dias", value: "30days" },
  ];

  const funnelMetrics = {
    indications: metrics.indications,
    opportunities: metrics.opportunities,
    completedCards: metrics.completedCards,
    indicationsValue: undefined,
    opportunitiesValue: undefined,
    completedValue: undefined,
  };

  // Badge "Hoje: N" exibe a quantidade de atividades na lista (período já filtrado pela página)
  const todayCount = activities.length;

  return (
    <main className="bg-background-light  text-slate-800  transition-colors duration-200 min-h-full">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Título + barra de filtros (estilo HTML referência) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800  flex items-center gap-2">
              Dashboard
              
            </h1>
            <p className="text-sm text-slate-500 ">Bem-vindo ao seu dashboard Nexflow</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white  p-2 rounded-xl shadow-sm border border-border-light ">
            <Select
              value={selectedTeamId ?? "all"}
              onValueChange={(v) => setSelectedTeamId(v === "all" ? null : v)}
            >
              <SelectTrigger className="appearance-none border-0 bg-transparent text-sm font-medium text-slate-700  focus:ring-0 cursor-pointer pr-8 pl-3 py-1 w-auto min-w-[140px] h-8 shadow-none">
                <SelectValue placeholder="Todos os times" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os times</SelectItem>
                {teams
                  .filter((t) => t.is_active)
                  .map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="h-6 w-px bg-slate-200 " />
            <div className="flex items-center bg-gray-100  rounded-lg p-1">
              {periodButtons.map(({ label, value }) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className={
                    period === value
                      ? "px-3 py-1 text-xs font-medium bg-slate-800 text-white   rounded shadow-sm"
                      : "px-3 py-1 text-xs font-medium text-slate-600  hover:text-slate-900 :text-white"
                  }
                  onClick={() => setPeriod(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    period === "custom"
                      ? "flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 text-white   border-slate-200  rounded-lg"
                      : "flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600  border-slate-200  rounded-lg hover:bg-slate-50 :bg-slate-800"
                  }
                >
                  <Calendar className="h-4 w-4" />
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarUi
                  mode="range"
                  selected={customDateRange}
                  onSelect={(range) => {
                    setCustomDateRange(range);
                    if (range?.from && range?.to) {
                      setPeriod("custom");
                    }
                  }}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Grid 12 colunas: 8 (funil + vendas) + 4 (atividades). Em mobile: coluna única, ordem funil → vendas → atividades. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[calc(100vh-10rem)] relative z-0">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <FunnelCard
              metrics={funnelMetrics}
              isLoading={isLoadingStats}
              onVerDetalhes={() => navigate("/crm/flows")}
            />
            <SalesByProductChart
              data={salesByProduct}
              isLoading={isLoadingSalesByProduct}
            />
          </div>
          <div className="lg:col-span-4 flex flex-col min-h-[400px] lg:min-h-0 lg:overflow-hidden">
            <ActivitiesTimeline
              activities={activities}
              isLoading={isLoadingActivities}
              todayCount={todayCount}
              users={users.filter((u) => u.is_active)}
              selectedUserId={activitiesUserId}
              onUserIdChange={setActivitiesUserId}
              onVerTodas={() => navigate("/crm/flows")}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
