import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, DollarSign, TrendingUp, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalCommissions: number;
  monthlyCommissions: number;
}

interface RecentClient {
  id: string;
  name: string;
  company_name: string;
  status: string;
  created_at: string;
}

export function ResellerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalCommissions: 0,
    monthlyCommissions: 0,
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [resellerData, setResellerData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Buscar dados do revendedor
        const { data: reseller } = await supabase
          .from('core_reseller_users')
          .select(`
            reseller_id,
            first_name,
            last_name,
            reseller:core_resellers!reseller_id (
              name,
              company_name,
              commission_percentage
            )
          `)
          .eq('id', session.user.id)
          .single();

        setResellerData(reseller);

        if (reseller?.reseller_id) {
          // Buscar estatísticas de clientes
          const { data: clients } = await supabase
            .from('core_clients')
            .select('id, status')
            .eq('reseller_id', reseller.reseller_id);

          const totalClients = clients?.length || 0;
          const activeClients = clients?.filter(c => c.status === 'active').length || 0;

          // Buscar clientes recentes
          const { data: recent } = await supabase
            .from('core_clients')
            .select('id, name, company_name, status, created_at')
            .eq('reseller_id', reseller.reseller_id)
            .order('created_at', { ascending: false })
            .limit(5);

          setStats({
            totalClients,
            activeClients,
            totalCommissions: 0, // TODO: Implementar cálculo de comissões
            monthlyCommissions: 0, // TODO: Implementar cálculo mensal
          });

          setRecentClients(recent || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {resellerData?.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {resellerData?.reseller?.company_name} • Comissão: {resellerData?.reseller?.commission_percentage}%
          </p>
        </div>
        <Button
          onClick={() => navigate('/reseller/clients/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeClients} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">
              Desde o início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyCommissions)}</div>
            <p className="text-xs text-muted-foreground">
              Comissões do mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clientes Recentes</CardTitle>
            <CardDescription>
              Últimos clientes adicionados à sua carteira
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentClients.length > 0 ? (
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <p className="text-sm text-gray-600">{client.company_name}</p>
                      <p className="text-xs text-gray-500">
                        Adicionado em {formatDate(client.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/reseller/clients/${client.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum cliente ainda
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece adicionando seu primeiro cliente
                </p>
                <Button
                  onClick={() => navigate('/reseller/clients/new')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/reseller/clients/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Cliente
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/reseller/clients')}
              >
                <Users className="w-4 h-4 mr-2" />
                Ver Todos os Clientes
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/reseller/commissions')}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Ver Comissões
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/reseller/reports')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Relatórios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 