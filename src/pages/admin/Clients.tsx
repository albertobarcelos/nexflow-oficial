import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientsTable } from "@/components/client/ClientsTable";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/database";

export default function Clients() {
  const navigate = useNavigate();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((row: any): Client => ({
        ...row,
        documents: (row.documents || []).map((doc: any) => ({
          name: doc.name,
          path: doc.path,
          type: doc.type,
          size: doc.size,
          uploadedAt: doc.uploadedAt
        })),
        history: (row.history || []).map((entry: any) => ({
          timestamp: entry.timestamp,
          action: entry.action,
          changes: entry.changes,
          user: entry.user
        }))
      }));
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da plataforma
          </p>
        </div>
        <Button onClick={() => navigate('/admin/clients/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <ClientsTable clients={clients || []} />
    </div>
  );
}