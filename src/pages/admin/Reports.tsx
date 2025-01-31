import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Report } from "@/types/database";

interface ReportWithClient extends Report {
  clients: {
    name: string;
    email: string;
  };
  title: string;
  download_count: number;
}

export default function Reports() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          clients (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReportWithClient[];
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize e baixe os relatórios gerados
        </p>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Título</th>
              <th className="p-4 text-left">Tipo</th>
              <th className="p-4 text-left">Gerado em</th>
              <th className="p-4 text-left">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {reports?.map((report) => (
              <tr key={report.id} className="border-b">
                <td className="p-4">{report.clients.name}</td>
                <td className="p-4">{report.title}</td>
                <td className="p-4">{report.type}</td>
                <td className="p-4">
                  {new Date(report.generated_at).toLocaleDateString()}
                </td>
                <td className="p-4">{report.download_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
