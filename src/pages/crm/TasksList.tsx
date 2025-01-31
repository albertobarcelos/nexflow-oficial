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
import { Badge } from '@/components/ui/badge';

type Task = {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  due_date: string | null;
  assigned_to_collaborator?: {
    name: string;
  };
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const statusLabels = {
  todo: 'A Fazer',
  doing: 'Em Andamento',
  done: 'Concluído',
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  doing: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

export default function TasksList() {
  const navigate = useNavigate();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_collaborator:collaborators!tasks_assigned_to_fkey(name)
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
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/tasks')}
          >
            <Kanban className="h-4 w-4 mr-2" />
            Visualizar Kanban
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
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
              <TableHead>Prioridade</TableHead>
              <TableHead>Prazo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks?.map((task: Task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => navigate(`/crm/tasks/${task.id}`)}
              >
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  {task.assigned_to_collaborator ? (
                    <Badge variant="outline">
                      {task.assigned_to_collaborator.name}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[task.status]}>
                    {statusLabels[task.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority === 'low' ? 'Baixa' : 
                     task.priority === 'medium' ? 'Média' : 'Alta'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString('pt-BR')
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
