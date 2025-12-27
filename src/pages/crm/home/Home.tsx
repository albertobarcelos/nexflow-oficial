import { useState } from "react";
import { Share2, Lightbulb, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStats, PeriodFilter } from "@/hooks/useDashboardStats";
import { useOpportunityFlowData } from "@/hooks/useOpportunityFlowData";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { useSalesOriginData } from "@/hooks/useSalesOriginData";
import { MetricCard } from "@/components/crm/dashboard/MetricCard";
import { OpportunityFlowChart } from "@/components/crm/dashboard/OpportunityFlowChart";
import { SalesOriginChart } from "@/components/crm/dashboard/SalesOriginChart";
import { RecentActivitiesTable } from "@/components/crm/dashboard/RecentActivitiesTable";
import { Skeleton } from "@/components/ui/skeleton";

export function Home() {
  const [period, setPeriod] = useState<PeriodFilter>('today');
  
  const { metrics, isLoading: isLoadingStats } = useDashboardStats(period);
  const { data: flowData, isLoading: isLoadingFlow } = useOpportunityFlowData(period);
  const { activities, isLoading: isLoadingActivities } = useRecentActivities(10);
  const { data: salesOriginData, isLoading: isLoadingSales } = useSalesOriginData();

  const periodButtons: { label: string; value: PeriodFilter }[] = [
    { label: 'Hoje', value: 'today' },
    { label: '7 Dias', value: '7days' },
    { label: '30 Dias', value: '30days' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#111827] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Olá! <span className="font-normal text-gray-500 dark:text-gray-400">vamos analisar os dados hoje?</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Visão geral do desempenho e métricas chave.
            </p>
          </div>
          
          {/* Period Filter Buttons */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {periodButtons.map(({ label, value }) => (
              <Button
                key={value}
                variant={period === value ? 'default' : 'ghost'}
                size="sm"
                className={period === value 
                  ? "bg-[#25335b] text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }
                onClick={() => setPeriod(value)}
              >
                {value === 'custom' && <Calendar className="w-3 h-3 mr-1" />}
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingStats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <MetricCard
                title="Indicações"
                value={metrics.indications}
                trend={metrics.indicationsTrend}
                icon={Share2}
                iconColor="text-blue-500"
                showInfo
              />
              <MetricCard
                title="Oportunidades"
                value={metrics.opportunities}
                trend={metrics.opportunitiesTrend}
                icon={Lightbulb}
                iconColor="text-yellow-500"
              />
              <MetricCard
                title="Cards Completos"
                value={metrics.completedCards}
                trend={metrics.completedCardsTrend}
                icon={CheckCircle}
                iconColor="text-green-500"
              />
              <MetricCard
                title="Cards Cancelados"
                value={metrics.cancelledCards}
                trend={metrics.cancelledCardsTrend}
                icon={XCircle}
                iconColor="text-red-500"
              />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OpportunityFlowChart 
            data={flowData} 
            isLoading={isLoadingFlow}
          />
          <SalesOriginChart 
            data={salesOriginData} 
            isLoading={isLoadingSales}
          />
        </div>

        {/* Recent Activities Table */}
        <RecentActivitiesTable 
          activities={activities} 
          isLoading={isLoadingActivities}
        />
      </div>
    </div>
  );
}
