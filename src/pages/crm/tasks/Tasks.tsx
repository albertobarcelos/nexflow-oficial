import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, List, Menu, Users, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { TaskColumn } from '@/components/crm/tasks/TaskColumn';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const getTotalTasks = () => columns.reduce((total, col) => total + col.tasks.length, 0);
  const getCompletedTasks = () => columns.find(col => col.id === 'done')?.tasks.length || 0;
  const getPendingTasks = () => getTotalTasks() - getCompletedTasks();

  const MobileMenu = () => (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="py-4">
          <h2 className="font-semibold mb-4">Menu</h2>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/crm/tasks/list')}
            >
              <List className="mr-2 h-4 w-4" />
              Visualizar Lista
            </Button>
          </div>

          {/* Estatísticas no menu mobile */}
          <div className="mt-6 space-y-3">
            <h3 className="font-medium">Estatísticas</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total
                </span>
                <span className="font-medium">{getTotalTasks()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Pendentes
                </span>
                <span className="font-medium">{getPendingTasks()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Concluídas
                </span>
                <span className="font-medium">{getCompletedTasks()}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header responsivo */}
      <div className="bg-white border-b px-4 py-3 md:px-6 md:py-4 flex-shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <MobileMenu />

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">Tarefas</h1>
          </div>

          {/* Estatísticas desktop */}
          {!isMobile && (
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{getTotalTasks()} Total</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{getPendingTasks()} Pendentes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{getCompletedTasks()} Concluídas</span>
              </div>
            </div>
          )}

          {/* Ações desktop */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/crm/tasks/list')}
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          )}
        </div>

        {/* Estatísticas mobile */}
        {isMobile && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>{getPendingTasks()} pendentes</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{getCompletedTasks()} concluídas</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          {isMobile ? (
            // Layout mobile: cards em coluna única
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {columns.map(column => (
                <Card key={column.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{column.title}</span>
                      <span className="text-sm font-normal bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {column.tasks.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <TaskColumn
                      id={column.id}
                      title=""
                      tasks={column.tasks}
                      isMobileLayout={true}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Layout desktop: kanban horizontal
            <div className="h-full p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {columns.map(column => (
                  <div key={column.id} className="flex flex-col min-h-0">
                    <TaskColumn
                      id={column.id}
                      title={column.title}
                      tasks={column.tasks}
                      isMobileLayout={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </DragDropContext>
      </div>

      {/* Botão flutuante mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
