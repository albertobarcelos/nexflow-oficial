import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, Kanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Opportunity = {
  id: string;
  title: string;
  status: string;
  value: number | null;
  assigned_to: string | null;
  expected_close_date: string | null;
};

export default function OpportunitiesList() {
  const navigate = useNavigate();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities-list'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data } = await supabase
        .from('opportunities')
        .select(`
          *,
          assigned_to (
            name
          )
        `)
        .eq('client_id', collaborator.client_id);

      return data;
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Oportunidades</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/opportunities')}
          >
            <Kanban className="h-4 w-4 mr-2" />
            Visualizar Kanban
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Previsão de Fechamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities?.map((opportunity: any) => (
              <TableRow
                key={opportunity.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
              >
                <TableCell>{opportunity.title}</TableCell>
                <TableCell>{opportunity.assigned_to?.name || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${opportunity.status === 'won' ? 'bg-green-100 text-green-800' :
                    opportunity.status === 'lost' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'}`}>
                    {opportunity.status === 'won' ? 'Ganho' :
                     opportunity.status === 'lost' ? 'Perdido' : 'Em Aberto'}
                  </span>
                </TableCell>
                <TableCell>
                  {opportunity.value
                    ? `R$ ${opportunity.value.toLocaleString('pt-BR')}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {opportunity.expected_close_date
                    ? new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
