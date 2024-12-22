import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Task = {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  due_date: string | null;
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

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function Tasks() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_collaborator:collaborators!tasks_assigned_to_fkey(name)
        `)
        .eq('client_id', collaborator.client_id);

      if (!tasks) return;

      const newColumns = initialColumns.map(col => ({
        ...col,
        tasks: tasks.filter(task => task.status === col.id)
      }));

      setColumns(newColumns);
      return tasks;
    }
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

    // Update columns locally
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

    // Update in database
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: destination.droppableId })
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
            <div key={column.id} className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-4">{column.title}</h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 min-h-[200px]"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing"
                            onClick={() => navigate(`/crm/tasks/${task.id}`)}
                          >
                            <CardContent className="p-4">
                              <h4 className="font-medium">{task.title}</h4>
                              <div className="flex gap-2 mt-2">
                                <Badge 
                                  variant="secondary"
                                  className={priorityColors[task.priority]}
                                >
                                  {task.priority === 'low' ? 'Baixa' : 
                                   task.priority === 'medium' ? 'Média' : 'Alta'}
                                </Badge>
                                {task.assigned_to_collaborator && (
                                  <Badge variant="outline">
                                    {task.assigned_to_collaborator.name}
                                  </Badge>
                                )}
                              </div>
                              {task.due_date && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}