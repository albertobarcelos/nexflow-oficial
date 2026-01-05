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

type Contact = {
  id: string;
  title: string;
  status: string;
  value: number | null;
  assigned_to: string | null;
  expected_close_date: string | null;
};

export default function ContactsList() {
  const navigate = useNavigate();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts-list'],
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
        <h1 className="text-2xl font-bold">Contatos</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/contacts')}
          >
            <Kanban className="h-4 w-4 mr-2" />
            Visualizar Kanban
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
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
            {contacts?.map((contact: any) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => navigate(`/crm/contacts/${contact.id}`)}
              >
                <TableCell>{contact.title}</TableCell>
                <TableCell>{contact.assigned_to?.name || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${contact.status === 'won' ? 'bg-green-100 text-green-800' :
                    contact.status === 'lost' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'}`}>
                    {contact.status === 'won' ? 'Ganho' :
                     contact.status === 'lost' ? 'Perdido' : 'Em Aberto'}
                  </span>
                </TableCell>
                <TableCell>
                  {contact.value
                    ? `R$ ${contact.value.toLocaleString('pt-BR')}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {contact.expected_close_date
                    ? new Date(contact.expected_close_date).toLocaleDateString('pt-BR')
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
