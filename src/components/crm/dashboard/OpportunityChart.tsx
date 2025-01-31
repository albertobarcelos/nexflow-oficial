import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444'];

export function OpportunityChart() {
  const { data: opportunitiesByStatus, isLoading } = useQuery({
    queryKey: ['opportunities-by-status'],
    queryFn: async () => {
      const { data: { client_id } } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data } = await supabase
        .from('opportunities')
        .select('status')
        .eq('client_id', client_id);

      const counts = {
        open: 0,
        won: 0,
        lost: 0
      };

      data?.forEach(opp => {
        counts[opp.status as keyof typeof counts]++;
      });

      return Object.entries(counts).map(([status, value]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value
      }));
    }
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oportunidades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={opportunitiesByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {opportunitiesByStatus?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
