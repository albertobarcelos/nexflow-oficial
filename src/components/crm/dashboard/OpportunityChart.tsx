import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444'];

export function OpportunityChart() {
  const { data: dealsByStage, isLoading } = useQuery({
    queryKey: ['deals-by-stage'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) return [];

      const { data } = await supabase
        .from('web_deals')
        .select(`
          *,
          stage:web_funnel_stages(name)
        `)
        .eq('client_id', collaborator.client_id);

      const counts: Record<string, number> = {};

      data?.forEach(deal => {
        const stageName = deal.stage?.name || 'Sem etapa';
        counts[stageName] = (counts[stageName] || 0) + 1;
      });

      return Object.entries(counts).map(([stage, value]) => ({
        name: stage,
        value
      }));
    }
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Negócios por Etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dealsByStage}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dealsByStage?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
