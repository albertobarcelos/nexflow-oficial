import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { License } from "@/types/database";

export default function Licenses() {
  const { data: licenses, isLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          clients (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (License & { clients: { name: string; email: string } })[];
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Licenças</h1>
        <p className="text-muted-foreground">
          Gerencie as licenças dos clientes
        </p>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Tipo</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Início</th>
              <th className="p-4 text-left">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {licenses?.map((license) => (
              <tr key={license.id} className="border-b">
                <td className="p-4">{license.clients.name}</td>
                <td className="p-4">{license.type}</td>
                <td className="p-4">{license.status}</td>
                <td className="p-4">
                  {new Date(license.start_date).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {new Date(license.expiration_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}