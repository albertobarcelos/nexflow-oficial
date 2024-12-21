import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, KeyRound, Users, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface DashboardMetrics {
  totalClients: number;
  activeLicenses: number;
  totalReports: number;
  licenseDistribution: {
    name: string;
    count: number;
  }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      try {
        // Get total clients
        const { count: totalClients } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        // Get active licenses
        const { count: activeLicenses } = await supabase
          .from('licenses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get total reports
        const { count: totalReports } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true });

        // Get license distribution
        const { data: licenseData } = await supabase
          .from('licenses')
          .select('status, count')
          .select('status')
          .then(({ data }) => {
            const distribution = data?.reduce((acc, curr) => {
              const status = curr.status;
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return Object.entries(distribution || {}).map(([name, count]) => ({
              name,
              count,
            }));
          });

        return {
          totalClients: totalClients || 0,
          activeLicenses: activeLicenses || 0,
          totalReports: totalReports || 0,
          licenseDistribution: licenseData || [],
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
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Portal Administrador OEM Nexsyn
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/clients/new')}>
            Novo Cliente
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/reports')}>
            Ver Relatórios
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeLicenses}</div>
            <p className="text-xs text-muted-foreground">
              Licenças em uso atualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Relatórios gerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Administradores do sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Licenças</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.licenseDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Nenhuma atividade registrada ainda.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licenças a Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Nenhuma licença próxima do vencimento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}