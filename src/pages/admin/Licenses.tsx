import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LicenseDialog } from "@/components/admin/licenses/LicenseDialog";
import { LicensesTable } from "@/components/admin/licenses/LicensesTable";
import type { License } from "@/types/database";

export default function Licenses() {
  const { data: licenses, isLoading, refetch } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          clients (
            name,
            email,
            plan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (License & { clients: { name: string; email: string; plan: string } })[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')  // Adicionado email à consulta
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Licenças</h1>
          <p className="text-muted-foreground">
            Gerencie as licenças dos clientes
          </p>
        </div>

        <LicenseDialog clients={clients} onSuccess={refetch} />
      </div>

      <LicensesTable licenses={licenses || []} />
    </div>
  );
}