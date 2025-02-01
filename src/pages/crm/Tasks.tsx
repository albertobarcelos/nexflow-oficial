import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { TaskColumn } from '@/components/crm/tasks/TaskColumn';
import { useAuth } from '@/hooks/useAuth';

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

type Column = {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
};

const initialColumns: Column[] = [
  { id: 'todo', title: 'A Fazer', tasks: [] },
  { id: 'doing', title: 'Em Andamento', tasks: [] },
  { id: 'done', title: 'Concluído', tasks: [] },
];

export default function Tasks() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data: collaborator } = await supabase
          .from('collaborators')
          .select('client_id')
          .eq('auth_user_id', user?.id)
          .single();

        if (!collaborator) throw new Error('Collaborator not found');

        const { data: tasks, error } = await supabase
          .from('tasks')
          .select(`
            *,
            assigned_to_collaborator:collaborators!tasks_assigned_to_fkey(name)
          `)
          .eq('client_id', collaborator.client_id);

        if (error) throw error;

        const newColumns = initialColumns.map(col => ({
          ...col,
          tasks: tasks?.filter(task => task.status === col.id) || []
        }));

        setColumns(newColumns);
        return tasks || [];
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Erro ao carregar tarefas",
          description: "Não foi possível carregar as tarefas.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user?.id
  });

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceCol = columns.find(col => col.id === source.droppableId);
    const destCol = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceCol || !destCol) return;

    const task = sourceCol.tasks[source.index];

    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        const newTasks = Array.from(col.tasks);
        newTasks.splice(source.index, 1);
        return { ...col, tasks: newTasks };
      }
      if (col.id === destination.droppableId) {
        const newTasks = Array.from(col.tasks);
        newTasks.splice(destination.index, 0, task);
        return { ...col, tasks: newTasks };
      }
      return col;
    });

    setColumns(newColumns);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: destination.droppableId,
          title: task.title // Adicionando o título para satisfazer a tipagem
        })
        .eq('id', draggableId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status da tarefa foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da tarefa.",
        variant: "destructive",
      });
    }
  };

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
            onClick={() => navigate('/crm/tasks/list')}
          >
            <List className="h-4 w-4 mr-2" />
            Visualizar Lista
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(column => (
            <TaskColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={column.tasks}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
