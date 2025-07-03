import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Target, CheckSquare, TrendingUp, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Database } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

// Atualizar tipo para usar web_deals ao invés de opportunities
type Deal = Database["public"]["Tables"]["web_deals"]["Row"] & {
  company: Database["public"]["Tables"]["web_companies"]["Row"] | null;
};

// Função helper para obter dados do usuário (incluindo usuário de teste)
const getCurrentUserData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Tentar buscar na tabela core_client_users
  const { data: collaborator } = await supabase
    .from("core_client_users")
    .select("client_id")
    .eq("id", user.id)
    .single();

  // Se encontrou, retorna os dados
  if (collaborator) {
    return collaborator;
  }

  // Se não encontrou e é o usuário de teste, retorna dados temporários
  if (user.email === 'barceloshd@gmail.com') {
    return {
      client_id: 'test-client-001'
    };
  }

  throw new Error("Colaborador não encontrado");
};

export function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        const collaborator = await getCurrentUserData();

        const [
          { count: companiesCount },
          { count: peopleCount },
          { count: dealsCount },
          { count: tasksCount },
        ] = await Promise.all([
          supabase
            .from("web_companies")
            .select("*", { count: "exact", head: true })
            .eq("client_id", collaborator.client_id),
          supabase
            .from("web_people")
            .select("*", { count: "exact", head: true })
            .eq("client_id", collaborator.client_id),
          supabase
            .from("web_deals")
            .select("*", { count: "exact", head: true })
            .eq("client_id", collaborator.client_id),
          supabase
            .from("web_tasks")
            .select("*", { count: "exact", head: true })
            .eq("client_id", collaborator.client_id),
        ]);

        return {
          companies: companiesCount || 0,
          people: peopleCount || 0,
          deals: dealsCount || 0,
          tasks: tasksCount || 0,
        };
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        // Retornar dados padrão em caso de erro
        return {
          companies: 0,
          people: 0,
          deals: 0,
          tasks: 0,
        };
      }
    },
  });

  const { data: recentDeals } = useQuery({
    queryKey: ["recent-deals"],
    queryFn: async () => {
      try {
        const collaborator = await getCurrentUserData();

        const { data } = await supabase
          .from("web_deals")
          .select(`
            *,
            company:web_companies(*)
          `)
          .eq("client_id", collaborator.client_id)
          .order("created_at", { ascending: false })
          .limit(isMobile ? 3 : 5);

        return data || [];
      } catch (error) {
        console.error("Erro ao carregar negócios recentes:", error);
        return [];
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dashboard</p>
          <p className="text-gray-600">Verifique sua conexão e tente novamente</p>
        </div>
      </div>
    );
  }

  const statsData = stats || {
    companies: 0,
    people: 0,
    deals: 0,
    tasks: 0,
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header responsivo */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Visão geral do seu CRM
        </p>
      </div>

      {/* Grid responsivo de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate("/crm/companies")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{statsData.companies}</div>
            <p className="text-xs text-muted-foreground">
              {isMobile ? "Total" : "Total de empresas cadastradas"}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate("/crm/people")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Pessoas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{statsData.people}</div>
            <p className="text-xs text-muted-foreground">
              {isMobile ? "Contatos" : "Total de contatos"}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate("/crm/deals")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Negócios</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{statsData.deals}</div>
            <p className="text-xs text-muted-foreground">
              {isMobile ? "Ativas" : "Oportunidades ativas"}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate("/crm/tasks")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Tarefas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{statsData.tasks}</div>
            <p className="text-xs text-muted-foreground">
              {isMobile ? "Pendentes" : "Tarefas pendentes"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid principal responsivo */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Negócios Recentes */}
        <Card className={`${isMobile ? 'col-span-full' : 'md:col-span-2 lg:col-span-4'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Negócios Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDeals deals={recentDeals} isMobile={isMobile} />
          </CardContent>
        </Card>

        {/* Resumo de Atividades */}
        <Card className={`${isMobile ? 'col-span-full' : 'md:col-span-2 lg:col-span-3'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Empresas cadastradas</p>
                  <p className="text-xs text-muted-foreground">{statsData.companies} total</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Contatos ativos</p>
                  <p className="text-xs text-muted-foreground">{statsData.people} pessoas</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Negócios em andamento</p>
                  <p className="text-xs text-muted-foreground">{statsData.deals} oportunidades</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tarefas pendentes</p>
                  <p className="text-xs text-muted-foreground">{statsData.tasks} itens</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas mobile */}
      {isMobile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className="cursor-pointer hover:bg-accent/50 transition-colors p-3"
                onClick={() => navigate("/crm/companies/new")}
              >
                <div className="text-center">
                  <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Nova Empresa</p>
                </div>
              </Card>
              <Card
                className="cursor-pointer hover:bg-accent/50 transition-colors p-3"
                onClick={() => navigate("/crm/people/new")}
              >
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Novo Contato</p>
                </div>
              </Card>
              <Card
                className="cursor-pointer hover:bg-accent/50 transition-colors p-3"
                onClick={() => navigate("/crm/deals/new")}
              >
                <div className="text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Novo Negócio</p>
                </div>
              </Card>
              <Card
                className="cursor-pointer hover:bg-accent/50 transition-colors p-3"
                onClick={() => navigate("/crm/tasks/new")}
              >
                <div className="text-center">
                  <CheckSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Nova Tarefa</p>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecentDeals({ deals, isMobile }: { deals: Deal[] | undefined; isMobile: boolean }) {
  if (!deals?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum negócio encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {deals.map((deal) => (
        <div
          key={deal.id}
          className="flex items-center justify-between border-b pb-2 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <p className={`font-medium truncate ${isMobile ? 'text-sm' : ''}`}>{deal.title}</p>
            <p className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {deal.company?.name}
            </p>
          </div>
          <div className={`font-medium flex-shrink-0 ml-2 ${isMobile ? 'text-sm' : ''}`}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(deal.value || 0)}
          </div>
        </div>
      ))}
    </div>
  );
}