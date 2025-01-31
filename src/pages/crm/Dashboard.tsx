import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Target, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];
type Task = Tables["tasks"]["Row"];
type Opportunity = Tables["opportunities"]["Row"] & {
  company: Tables["companies"]["Row"] | null;
};

export function Dashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      const [
        { count: companiesCount },
        { count: peopleCount },
        { count: opportunitiesCount },
        { count: tasksCount },
      ] = await Promise.all([
        supabase
          .from("companies")
          .select("*", { count: "exact", head: true })
          .eq("client_id", collaborator.client_id),
        supabase
          .from("people")
          .select("*", { count: "exact", head: true })
          .eq("client_id", collaborator.client_id),
        supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("client_id", collaborator.client_id),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("client_id", collaborator.client_id),
      ]);

      return {
        companies: companiesCount || 0,
        people: peopleCount || 0,
        opportunities: opportunitiesCount || 0,
        tasks: tasksCount || 0,
      };
    },
  });

  const cards = [
    {
      title: "Empresas",
      value: stats?.companies || 0,
      icon: Building2,
      onClick: () => navigate("/crm/companies"),
    },
    {
      title: "Pessoas",
      value: stats?.people || 0,
      icon: Users,
      onClick: () => navigate("/crm/people"),
    },
    {
      title: "Oportunidades",
      value: stats?.opportunities || 0,
      icon: Target,
      onClick: () => navigate("/crm/opportunities"),
    },
    {
      title: "Tarefas",
      value: stats?.tasks || 0,
      icon: CheckSquare,
      onClick: () => navigate("/crm/tasks"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTasks />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oportunidades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOpportunities />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentTasks() {
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) return [];

      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", collaborator.client_id)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  if (!tasks?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma tarefa encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between border-b pb-2 last:border-0"
        >
          <div>
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-muted-foreground">
              {task.status === "todo"
                ? "A Fazer"
                : task.status === "doing"
                ? "Em Andamento"
                : "Concluído"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentOpportunities() {
  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ["recent-opportunities"],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) return [];

      const { data } = await supabase
        .from("opportunities")
        .select(`
          *,
          company:companies(*)
        `)
        .eq("client_id", collaborator.client_id)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  if (!opportunities?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma oportunidade encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity) => (
        <div
          key={opportunity.id}
          className="flex items-center justify-between border-b pb-2 last:border-0"
        >
          <div>
            <p className="font-medium">{opportunity.title}</p>
            <p className="text-sm text-muted-foreground">
              {opportunity.company?.name}
            </p>
          </div>
          <div className="text-sm font-medium">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(opportunity.value || 0)}
          </div>
        </div>
      ))}
    </div>
  );
}