import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { TaskColumn } from '@/components/crm/tasks/TaskColumn';

interface DatabaseTask {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean | null;
  deal_id: string | null;
  assigned_to: string | null;
  type_id: string;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assigned_to_collaborator?: {
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  due_date: string;
  assigned_to_collaborator?: {
    name: string;
  };
}

type Column = {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
};

type UserData = {
  client_id: string;
  first_name?: string;
};

const initialColumns: Column[] = [
  { id: 'todo', title: 'A Fazer', tasks: [] },
  { id: 'doing', title: 'Em Andamento', tasks: [] },
  { id: 'done', title: 'Concluído', tasks: [] },
];

// Helper function to get current user data
const getCurrentUserData = async (): Promise<UserData> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  try {
    // Try to fetch from core_client_users table
    const { data, error } = await supabase
      .from('core_client_users')
      .select(`
        client_id,
        core_clients (
          contact_name
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (data) {
      return {
        client_id: data.client_id,
        first_name: data.core_clients?.contact_name
      };
    }

    // If not found and it's the test user, return temporary data
    if (user.email === 'barceloshd@gmail.com') {
      return {
        client_id: 'test-client-001',
        first_name: 'usuário'
      };
    }

    throw new Error("Colaborador não encontrado");
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      client_id: 'unknown',
      first_name: 'usuário'
    };
  }
};

// Helper function to convert DatabaseTask to Task
const convertDatabaseTask = (dbTask: DatabaseTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  status: dbTask.status || (dbTask.completed ? 'done' : 'todo'),
  priority: dbTask.priority || 'medium',
  assigned_to: dbTask.assigned_to,
  due_date: dbTask.due_date,
  assigned_to_collaborator: dbTask.assigned_to_collaborator
});

export default function Tasks() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: userData } = useQuery<UserData>({
    queryKey: ["user"],
    queryFn: getCurrentUserData,
  });

  const { isLoading } = useQuery({
    queryKey: ['tasks', userData?.client_id],
    queryFn: async () => {
      if (!userData?.client_id) return [];

      try {
        const { data: tasks, error } = await supabase
          .from('web_tasks')
          .select(`
            id,
            title,
            status,
            priority,
            assigned_to,
            due_date,
            completed,
            assigned_to_collaborator:collaborators!tasks_assigned_to_fkey(name)
          `)
          .eq('client_id', userData.client_id);

        if (error) throw error;

        const convertedTasks = (tasks || []).map(convertDatabaseTask);
        const newColumns = initialColumns.map(col => ({
          ...col,
          tasks: convertedTasks.filter(task => task.status === col.id)
        }));

        setColumns(newColumns);
        return convertedTasks;
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
    enabled: !!userData?.client_id
  });

  const onDragEnd = async (result: {
    destination?: { droppableId: string; index: number };
    source: { droppableId: string; index: number };
    draggableId: string;
  }) => {
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
        .from('web_tasks')
        .update({
          status: destination.droppableId,
          completed: destination.droppableId === 'done'
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
