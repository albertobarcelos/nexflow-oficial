import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function LeadChart() {
  const { data: leadsByStatus, isLoading } = useQuery({
    queryKey: ['leads-by-status'],
    queryFn: async () => {
      const { data: { client_id } } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data } = await supabase
        .from('leads')
        .select('status')
        .eq('client_id', client_id);

      const counts = {
        new: 0,
        in_progress: 0,
        closed: 0
      };

      data?.forEach(lead => {
        counts[lead.status as keyof typeof counts]++;
      });

      return Object.entries(counts).map(([status, count]) => ({
        status: status.replace('_', ' '),
        quantidade: count
      }));
    }
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Leads por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
