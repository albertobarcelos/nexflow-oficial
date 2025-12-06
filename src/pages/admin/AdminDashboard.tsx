import { Users, Handshake, CreditCard, Network, UserCircle, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOrganizationUsers } from "@/hooks/useOrganizationUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Interface para dados do gráfico
interface ChartData {
  month: string;
  completions: number;
}

// Dados mockados do gráfico (baseado no HTML)
const chartData: ChartData[] = [
  { month: "Jan", completions: 125 },
  { month: "Feb", completions: 340 },
  { month: "Mar", completions: 970 },
  { month: "Apr", completions: 850 },
  { month: "May", completions: 750 },
  { month: "Jun", completions: 220 },
];

// Atividades recentes mockadas
const recentActivities = [
  {
    id: 1,
    text: "New Client Completed Sitimhans service",
    time: "3 month ago",
  },
  {
    id: 2,
    text: "Created acogrimn for whiscosters oeronad",
    time: "12 hours ago",
  },
  {
    id: 3,
    text: "Completed Nabluoser & Rekeholar sunora uch",
    time: "8 hours ago",
  },
  {
    id: 4,
    text: "New Client Completed in NinwJoriorecminators",
    time: "10 hours ago",
  },
];

export function AdminDashboard() {
  // Buscar dados de usuários
  const { data: users } = useOrganizationUsers();
  const { data: teams } = useOrganizationTeams();

  // Buscar total de clientes
  const { data: clientsCount } = useQuery({
    queryKey: ["admin-companies-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("web_companies")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  // Calcular estatísticas
  const totalUsers = users?.length || 0;
  const totalClients = clientsCount || 0;
  const totalTeams = teams?.length || 0;
  const totalCompletedCards = 0; // Placeholder - pode ser implementado depois

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 ">Dashboard Principal</h2>
        <div className="flex items-center space-x-4 text-gray-600">
          <UserCircle className="text-2xl cursor-pointer hover:text-gray-800" />
          <Settings className="text-2xl cursor-pointer hover:text-gray-800" />
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Users */}
        <div className="bg-nex-dark-blue p-6 rounded-lg text-white flex items-center space-x-4">
          <div className="bg-nex-orange p-4 rounded-full">
            <Users className="text-2xl text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-300">Total de Usuários</p>
            <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-green-400">+12%</p>
          </div>
        </div>

        {/* Card 2: Total Clients */}
        <div className="bg-nex-dark-blue p-6 rounded-lg text-white flex items-center space-x-4">
          <div className="bg-nex-orange p-4 rounded-full">
            <Handshake className="text-2xl text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-300">Total de Clientes</p>
            <p className="text-2xl font-bold">{totalClients.toLocaleString()}</p>
            <p className="text-xs text-green-400">+5%</p>
          </div>
        </div>

        {/* Card 3: Total Completed Cards */}
        <div className="bg-nex-dark-blue p-6 rounded-lg text-white flex items-center space-x-4">
          <div className="bg-nex-orange p-4 rounded-full">
            <CreditCard className="text-2xl text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-300">Total de tarefas concluídas</p>
            <p className="text-2xl font-bold">{totalCompletedCards.toLocaleString()}</p>
            <p className="text-xs text-gray-300 whitespace-nowrap">Clientes imersos</p>
          </div>
        </div>

        {/* Card 4: Total Teams */}
        <div className="bg-nex-dark-blue p-6 rounded-lg text-white flex items-center space-x-4">
          <div className="bg-nex-orange p-4 rounded-full">
            <Network className="text-2xl text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-300">Total de equipes</p>
            <p className="text-2xl font-bold">{totalTeams.toLocaleString()}</p>
            <p className="text-xs text-gray-300">Ativas</p>
          </div>
        </div>
      </section>

      {/* Monthly Statistics Chart */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Estatísticas mensais de conclusão</h3>
          <button className="bg-nex-orange text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors">
            Ações rápidas
          </button>
        </div>
        <div className="relative h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff8c00" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ff8c00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fill: "#6b7280" }}
                axisLine={false}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: "#6b7280" }}
                domain={[0, 1100]}
                ticks={[0, 250, 500, 750, 1000]}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a2c5b",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  padding: "10px",
                }}
                labelStyle={{ color: "#fff", fontWeight: "bold" }}
              />
              <Area
                type="monotone"
                dataKey="completions"
                stroke="#ff8c00"
                strokeWidth={2}
                fill="url(#colorGradient)"
                dot={{ fill: "#ff8c00", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Activities */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Atividades recentes</h3>
        <ul className="space-y-4">
          {recentActivities.map((activity) => (
            <li key={activity.id} className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <span className="h-2 w-2 bg-nex-dark-blue rounded-full mr-3"></span>
                <p className="text-gray-700">{activity.text}</p>
              </div>
              <span className="text-gray-500">{activity.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
} 