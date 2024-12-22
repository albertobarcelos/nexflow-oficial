import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/crm/dashboard/MetricCard";
import { LeadChart } from "@/components/crm/dashboard/LeadChart";
import { OpportunityChart } from "@/components/crm/dashboard/OpportunityChart";
import { ConversionChart } from "@/components/crm/dashboard/ConversionChart";
import { RecentLeads } from "@/components/crm/dashboard/RecentLeads";

export default function Dashboard() {
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['crm-metrics'],
    queryFn: async () => {
      const { data: { client_id } } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const [
        { count: totalLeads },
        { count: activeOpportunities },
        { count: convertedLeads }
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', client_id),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('client_id', client_id).eq('status', 'open'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', client_id).not('converted_at', 'is', null)
      ]);

      return {
        totalLeads: totalLeads || 0,
        activeOpportunities: activeOpportunities || 0,
        conversionRate: totalLeads ? ((convertedLeads || 0) / totalLeads) * 100 : 0
      };
    }
  });

  if (isLoadingMetrics) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu CRM
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total de Leads"
          value={metrics?.totalLeads || 0}
          description="Leads cadastrados"
        />
        <MetricCard
          title="Oportunidades Ativas"
          value={metrics?.activeOpportunities || 0}
          description="Em negociação"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${(metrics?.conversionRate || 0).toFixed(1)}%`}
          description="Leads convertidos"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LeadChart />
        <OpportunityChart />
        <ConversionChart />
      </div>

      <RecentLeads />
    </div>
  );
}