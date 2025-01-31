import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeactivate = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: 'inactive' })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Cliente desativado",
        description: "O cliente foi desativado com sucesso.",
      });

      // Atualiza os dados em cache
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    } catch (error) {
      console.error('Erro ao desativar cliente:', error);
      toast({
        title: "Erro ao desativar",
        description: "Ocorreu um erro ao tentar desativar o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Plano</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>{client.name}</TableCell>
            <TableCell>{client.email}</TableCell>
            <TableCell>{client.company_name}</TableCell>
            <TableCell>{client.status}</TableCell>
            <TableCell>{client.plan}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/admin/clients/${client.id}`)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeactivate(client)}
                  disabled={client.status === 'inactive'}
                >
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
