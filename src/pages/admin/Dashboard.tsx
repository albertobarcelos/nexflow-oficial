import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { LicenseDistribution } from "@/components/dashboard/LicenseDistribution";
import { ActivityCards } from "@/components/dashboard/ActivityCards";

interface DashboardMetrics {
  totalClients: number;
  activeLicenses: number;
  totalReports: number;
  licenseDistribution: Array<{
    name: string;
    count: number;
  }>;
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      try {
        const [clientsResult, licensesResult, reportsResult] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('licenses').select('status')
        ]);

        const distribution = licensesResult.data?.reduce((acc, curr) => {
          const status = curr.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const licenseDistribution = Object.entries(distribution || {}).map(([name, count]) => ({
          name,
          count,
        }));

        return {
          totalClients: clientsResult.count || 0,
          activeLicenses: licensesResult.count || 0,
          totalReports: reportsResult.count || 0,
          licenseDistribution,
        };
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        toast({
          title: "Erro ao carregar métricas",
          description: "Não foi possível carregar as métricas do dashboard.",
          variant: "destructive",
        });
        return {
          totalClients: 0,
          activeLicenses: 0,
          totalReports: 0,
          licenseDistribution: [],
        };
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Prefetch related data
  useEffect(() => {
    const prefetchData = async () => {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['clients'],
          queryFn: async () => {
            const { data } = await supabase
              .from('clients')
              .select('*')
              .order('created_at', { ascending: false });
            return data;
          },
        }),
        queryClient.prefetchQuery({
          queryKey: ['reports'],
          queryFn: async () => {
            const { data } = await supabase
              .from('reports')
              .select('*')
              .order('created_at', { ascending: false });
            return data;
          },
        }),
      ]);
    };

    prefetchData();
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <MetricCards
        totalClients={metrics?.totalClients || 0}
        activeLicenses={metrics?.activeLicenses || 0}
        totalReports={metrics?.totalReports || 0}
      />

      <LicenseDistribution data={metrics?.licenseDistribution || []} />
      
      <ActivityCards />
    </div>
  );
}