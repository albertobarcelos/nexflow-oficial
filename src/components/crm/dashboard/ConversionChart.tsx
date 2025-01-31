import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConversionChart() {
  const { data: conversionData, isLoading } = useQuery({
    queryKey: ['conversion-rate-history'],
    queryFn: async () => {
      const { data: { client_id } } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
          start: startOfMonth(date).toISOString(),
          end: endOfMonth(date).toISOString(),
          month: format(date, 'MMM', { locale: ptBR })
        };
      }).reverse();

      const data = await Promise.all(
        months.map(async ({ start, end, month }) => {
          const [{ count: totalLeads }, { count: convertedLeads }] = await Promise.all([
            supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', client_id)
              .gte('created_at', start)
              .lte('created_at', end),
            supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', client_id)
              .not('converted_at', 'is', null)
              .gte('converted_at', start)
              .lte('converted_at', end)
          ]);

          return {
            month,
            taxa: totalLeads ? ((convertedLeads || 0) / totalLeads) * 100 : 0
          };
        })
      );

      return data;
    }
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="taxa" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
