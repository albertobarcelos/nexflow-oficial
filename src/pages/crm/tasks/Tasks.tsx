import { useState, useEffect } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, List, Menu, Users, CheckCircle, Clock, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { TaskBoardView } from '@/components/crm/tasks/TaskBoardView';
import { TaskListView } from '@/components/crm/tasks/TaskListView';
import { NewTaskDialog } from '@/components/crm/tasks/NewTaskDialog';
import { EditTaskDialog } from '@/components/crm/tasks/EditTaskDialog';
import { TaskDetailsDialog } from '@/components/crm/tasks/TaskDetailsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { mockTasks } from '@/components/crm/tasks/MockTaskData';
import { useAddTaskHistory } from '@/hooks/useTaskHistory';
import { TasksFilterBar } from '@/components/crm/tasks/TasksFilterBar';

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
  type?: string;
}

interface MockTask {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
  assigned_to: string;
  opportunity_id?: string;
  opportunity_name?: string;
  created_by: string;
  responsible: string;
  completed: boolean;
}

interface DetailedTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done' | 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  due_date: string;
  created_at?: string;
  responsible?: string;
  completed?: boolean;
  type?: string;
  opportunity_id?: string | null;
  opportunity_name?: string | null;
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

// Helper function to convert mock task to board task format
const convertMockTaskToBoardTask = (mockTask: MockTask): Task => {
  // Map status from mock to board format
  let boardStatus: 'todo' | 'doing' | 'done' = 'todo';
  if (mockTask.completed) {
    boardStatus = 'done';
  } else if (mockTask.status === 'pending') {
    boardStatus = 'todo';
  }

  return {
    id: mockTask.id,
    title: mockTask.title,
    status: boardStatus,
    priority: mockTask.priority as 'low' | 'medium' | 'high',
    assigned_to: mockTask.assigned_to,
    due_date: mockTask.due_date,
    assigned_to_collaborator: mockTask.responsible ? { name: mockTask.responsible } : undefined,
    type: mockTask.type
  };
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
  const [mockTaskList, setMockTaskList] = useState(mockTasks);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DetailedTask | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const addTaskHistory = useAddTaskHistory();
  // Filtros globais
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Função para filtrar tasks
  const getBaseFilteredTasks = () => {
    let filtered = mockTaskList;
    // Prioridade
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);
    // Período
    if (periodFilter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(t => new Date(t.due_date).toDateString() === today);
    } else if (periodFilter === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      filtered = filtered.filter(t => new Date(t.due_date) <= weekFromNow);
    }
    // Tipo
    if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
    return filtered;
  };

  // Para o modo lista, aplica também o filtro de status
  const getFilteredTasks = () => {
    let filtered = getBaseFilteredTasks();
    if (viewMode === 'list') {
      if (statusFilter === 'pending') filtered = filtered.filter(t => !t.completed);
      else if (statusFilter === 'completed') filtered = filtered.filter(t => t.completed);
    }
    return filtered;
  };
  const filteredTasks = getFilteredTasks();

  // Para o board, distribui as tarefas filtradas nas colunas
  const getFilteredColumns = () => {
    const boardFiltered = getBaseFilteredTasks();
    // Converte as tarefas mockadas filtradas para o formato do board
    const boardTasks = boardFiltered.map(convertMockTaskToBoardTask);

    return columns.map(col => ({
      ...col,
      tasks: boardTasks.filter(task => task.status === col.id)
    }));
  };
  const filteredColumns = getFilteredColumns();

  // Sync mock tasks with board columns on component mount
  useEffect(() => {
    const boardTasks = mockTasks.map(convertMockTaskToBoardTask);

    const newColumns = initialColumns.map(col => ({
      ...col,
      tasks: boardTasks.filter(task => task.status === col.id)
    }));

    setColumns(newColumns);
  }, []);

  const getTotalTasks = () => columns.reduce((total, col) => total + col.tasks.length, 0);
  const getCompletedTasks = () => columns.find(col => col.id === 'done')?.tasks.length || 0;
  const getPendingTasks = () => getTotalTasks() - getCompletedTasks();

  const handleAddTask = () => {
    setIsNewTaskDialogOpen(true);
  };

  const handleSaveTask = async (newTask: MockTask) => {
    setMockTaskList(prev => [...prev, newTask]);

    // Also add to board if it's a board task
    const boardTask = convertMockTaskToBoardTask(newTask);
    setColumns(prev => prev.map(col =>
      col.id === boardTask.status
        ? { ...col, tasks: [...col.tasks, boardTask] }
        : col
    ));

    // Registrar no histórico
    try {
      await addTaskHistory.mutateAsync({
        taskId: newTask.id,
        actionType: 'created',
        description: `Tarefa criada: ${newTask.title}`,
        metadata: {
          priority: newTask.priority,
          due_date: newTask.due_date,
          assigned_to: newTask.assigned_to
        }
      });
    } catch (error) {
      console.error('Erro ao registrar histórico:', error);
    }

    toast({
      title: "Tarefa criada",
      description: "A nova tarefa foi criada com sucesso.",
    });
  };

  const handleTaskClick = (taskId: string) => {
    // Find task in mock data first (contains more complete information)
    let task = mockTaskList.find(t => t.id === taskId);

    // If not found in mock data, try to find in board columns
    if (!task) {
      for (const column of columns) {
        const foundTask = column.tasks.find(t => t.id === taskId);
        if (foundTask) {
          const detailedTask: DetailedTask = {
            ...foundTask,
            description: `Tarefa do board: ${foundTask.title}`,
            responsible: foundTask.assigned_to_collaborator?.name,
            created_at: new Date().toISOString(),
            completed: foundTask.status === 'done',
            status: foundTask.status === 'done' ? 'completed' : 'pending'
          };
          task = detailedTask as MockTask;
          break;
        }
      }
    }

    if (task) {
      const detailedTask: DetailedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.completed ? 'completed' : 'pending',
        priority: task.priority as 'low' | 'medium' | 'high',
        assigned_to: task.assigned_to,
        due_date: task.due_date,
        created_at: task.created_at,
        responsible: task.responsible,
        completed: task.completed,
        type: task.type || 'call',
        opportunity_id: task.opportunity_id,
        opportunity_name: task.opportunity_name,
        assigned_to_collaborator: task.responsible ? { name: task.responsible } : undefined
      };
      setSelectedTask(detailedTask);
      setIsTaskDetailsOpen(true);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
    // Get current task to capture old status
    const currentTask = mockTaskList.find(task => task.id === taskId);
    const oldStatus = currentTask?.completed ? 'done' : currentTask?.status === 'pending' ? 'todo' : 'doing';

    // Update board columns
    setColumns(prev => {
      const allTasks: Task[] = [];
      prev.forEach(col => allTasks.push(...col.tasks));

      const taskToMove = allTasks.find(t => t.id === taskId);
      if (!taskToMove) return prev;

      const updatedTask = { ...taskToMove, status: newStatus };

      return prev.map(col => ({
        ...col,
        tasks: col.id === newStatus
          ? [...col.tasks.filter(t => t.id !== taskId), updatedTask]
          : col.tasks.filter(t => t.id !== taskId)
      }));
    });

    // Update mock task list
    setMockTaskList(prev => prev.map(task =>
      task.id === taskId
        ? {
          ...task,
          completed: newStatus === 'done',
          status: newStatus === 'done' ? 'completed' : 'pending'
        }
        : task
    ));

    // Update selected task if it's currently open
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev: DetailedTask | null) => prev ? ({
        ...prev,
        status: newStatus === 'done' ? 'completed' : 'pending',
        completed: newStatus === 'done'
      }) : null);
    }

    // Registrar mudança de status no histórico
    if (currentTask && oldStatus !== newStatus) {
      try {
        const statusLabels = {
          todo: 'A Fazer',
          doing: 'Em Andamento',
          done: 'Concluído'
        };

        await addTaskHistory.mutateAsync({
          taskId: taskId,
          actionType: 'status_changed',
          description: `Status alterado de "${statusLabels[oldStatus as keyof typeof statusLabels]}" para "${statusLabels[newStatus]}"`,
          fieldChanges: {
            status: {
              old: oldStatus,
              new: newStatus
            }
          },
          oldValues: { status: oldStatus },
          newValues: { status: newStatus },
          metadata: {
            task_title: currentTask.title,
            changed_at: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Erro ao registrar mudança de status no histórico:', error);
      }
    }

    toast({
      title: "Status atualizado",
      description: `Tarefa movida para "${newStatus === 'todo' ? 'A Fazer' : newStatus === 'doing' ? 'Em Andamento' : 'Concluído'}".`,
    });
  };

  const handleTaskEdit = (task: DetailedTask) => {
    // Close details modal and open edit dialog
    setIsTaskDetailsOpen(false);
    setSelectedTask(task);
    setIsEditTaskDialogOpen(true);
  };

  const handleSaveEditedTask = async (updatedTask: DetailedTask) => {
    // Get original task to compare changes
    const originalTask = mockTaskList.find(task => task.id === updatedTask.id);

    if (!originalTask) {
      toast({
        title: "Erro",
        description: "Tarefa original não encontrada.",
        variant: "destructive"
      });
      return;
    }

    // Detect changes
    const changes: Record<string, { old: string | undefined; new: string | undefined }> = {};
    const oldValues: Record<string, string | undefined> = {};
    const newValues: Record<string, string | undefined> = {};

    if (originalTask.title !== updatedTask.title) {
      changes.title = { old: originalTask.title, new: updatedTask.title };
      oldValues.title = originalTask.title;
      newValues.title = updatedTask.title;
    }

    if (originalTask.description !== (updatedTask.description || '')) {
      changes.description = { old: originalTask.description, new: updatedTask.description };
      oldValues.description = originalTask.description;
      newValues.description = updatedTask.description;
    }

    if (originalTask.priority !== updatedTask.priority) {
      changes.priority = { old: originalTask.priority, new: updatedTask.priority };
      oldValues.priority = originalTask.priority;
      newValues.priority = updatedTask.priority;
    }

    if (originalTask.due_date !== updatedTask.due_date) {
      changes.due_date = { old: originalTask.due_date, new: updatedTask.due_date };
      oldValues.due_date = originalTask.due_date;
      newValues.due_date = updatedTask.due_date;
    }

    if (originalTask.responsible !== updatedTask.responsible) {
      changes.assigned_to = { old: originalTask.responsible, new: updatedTask.responsible };
      oldValues.assigned_to = originalTask.responsible;
      newValues.assigned_to = updatedTask.responsible;
    }

    // Update mock task list
    setMockTaskList(prev => prev.map(task =>
      task.id === updatedTask.id
        ? {
          ...task,
          title: updatedTask.title,
          description: updatedTask.description || '',
          type: updatedTask.type || task.type,
          priority: updatedTask.priority,
          due_date: updatedTask.due_date,
          responsible: updatedTask.responsible || task.responsible,
          assigned_to: updatedTask.assigned_to || task.assigned_to,
          opportunity_id: updatedTask.opportunity_id || task.opportunity_id,
          opportunity_name: updatedTask.opportunity_name || task.opportunity_name
        }
        : task
    ));

    // Update board columns
    const boardTask = convertMockTaskToBoardTask({
      ...updatedTask,
      description: updatedTask.description || '',
      type: updatedTask.type || 'call',
      status: updatedTask.completed ? 'completed' : 'pending',
      created_at: updatedTask.created_at || new Date().toISOString(),
      assigned_to: updatedTask.assigned_to || '',
      created_by: 'Usuário Atual',
      responsible: updatedTask.responsible || '',
      completed: updatedTask.completed || false
    } as MockTask);

    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === updatedTask.id
          ? { ...task, ...boardTask }
          : task
      )
    })));

    // Update selected task if details modal will reopen
    setSelectedTask(updatedTask);

    // Registrar mudanças no histórico apenas se houve alterações
    if (Object.keys(changes).length > 0) {
      try {
        const changedFields = Object.keys(changes);
        const description = changedFields.length === 1
          ? `Campo "${changedFields[0]}" atualizado`
          : `${changedFields.length} campos atualizados: ${changedFields.join(', ')}`;

        await addTaskHistory.mutateAsync({
          taskId: updatedTask.id,
          actionType: 'updated',
          description: `Tarefa editada: ${description}`,
          fieldChanges: changes,
          oldValues,
          newValues,
          metadata: {
            task_title: updatedTask.title,
            fields_changed: changedFields,
            updated_at: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Erro ao registrar edição no histórico:', error);
      }
    }

    toast({
      title: "Tarefa atualizada",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const handleTaskDelete = async (taskId: string) => {
    // Get task to register in history before deleting
    const taskToDelete = mockTaskList.find(task => task.id === taskId);

    // Remove from board columns
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => t.id !== taskId)
    })));

    // Remove from mock task list
    setMockTaskList(prev => prev.filter(task => task.id !== taskId));

    // Close modal
    setIsTaskDetailsOpen(false);
    setSelectedTask(null);

    // Registrar exclusão no histórico
    if (taskToDelete) {
      try {
        await addTaskHistory.mutateAsync({
          taskId: taskId,
          actionType: 'deleted',
          description: `Tarefa excluída: ${taskToDelete.title}`,
          oldValues: {
            title: taskToDelete.title,
            description: taskToDelete.description,
            priority: taskToDelete.priority,
            status: taskToDelete.status,
            completed: taskToDelete.completed
          },
          metadata: {
            deleted_at: new Date().toISOString(),
            was_completed: taskToDelete.completed,
            original_due_date: taskToDelete.due_date
          }
        });
      } catch (error) {
        console.error('Erro ao registrar exclusão no histórico:', error);
      }
    }

    toast({
      title: "Tarefa excluída",
      description: "A tarefa foi removida com sucesso.",
    });
  };

  const ViewModeToggle = () => (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      <Button
        variant={viewMode === 'board' ? 'default' : 'ghost'}
        size="sm"
        className={`h-8 px-3 transition-all ${viewMode === 'board'
          ? 'bg-white shadow-sm text-slate-900'
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        onClick={() => setViewMode('board')}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Board
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        className={`h-8 px-3 transition-all ${viewMode === 'list'
          ? 'bg-white shadow-sm text-slate-900'
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        onClick={() => setViewMode('list')}
      >
        <List className="h-4 w-4 mr-2" />
        Lista
      </Button>
    </div>
  );

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
              onClick={handleAddTask}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>

          {/* Toggle de visualização no mobile */}
          <div className="mt-6">
            <h3 className="font-medium mb-3">Visualização</h3>
            <div className="space-y-2">
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Board
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setViewMode('list')}
              >
                <List className="mr-2 h-4 w-4" />
                Lista
              </Button>
            </div>
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

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header responsivo */}
      <div className="bg-white border-b px-4 py-3 md:px-6 md:py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <MobileMenu />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 truncate">Tarefas</h1>
          </div>
          {/* Estatísticas desktop */}
          {!isMobile && (
            <div className="flex items-center gap-6 text-sm text-slate-600">
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
            <div className="flex items-center gap-3">
              <ViewModeToggle />
              <Button
                size="sm"
                onClick={handleAddTask}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          )}
        </div>
        {/* Estatísticas mobile */}
        {isMobile && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-slate-600">
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
        {/* Barra de filtros única */}
        <div className="mt-6">
          <TasksFilterBar
            showStatusFilter={viewMode === 'list'}
            statusFilter={statusFilter}
            onStatusFilterChange={value => setStatusFilter(value as 'pending' | 'completed' | 'all')}
            periodFilter={periodFilter}
            onPeriodFilterChange={setPeriodFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            pendingCount={mockTaskList.filter(t => !t.completed).length}
            completedCount={mockTaskList.filter(t => t.completed).length}
            totalCount={mockTaskList.length}
          />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {viewMode === 'board' ? (
          <TaskBoardView
            columns={filteredColumns}
            onColumnsChange={setColumns}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <TaskListView
                tasks={filteredTasks}
                onAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                onCompleteTask={(taskId) => handleStatusChange(taskId, 'done')}
              />
            </div>
          </div>
        )}
      </div>
      {/* Botão flutuante mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
            onClick={handleAddTask}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}
      {/* Modal de Nova Tarefa */}
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onClose={() => setIsNewTaskDialogOpen(false)}
        onSave={handleSaveTask}
      />
      {/* Modal de Editar Tarefa */}
      <EditTaskDialog
        task={selectedTask}
        open={isEditTaskDialogOpen}
        onClose={() => {
          setIsEditTaskDialogOpen(false);
          // Reopen details modal if task is still selected
          if (selectedTask) {
            setIsTaskDetailsOpen(true);
          }
        }}
        onSave={handleSaveEditedTask}
      />
      {/* Modal de Detalhes da Tarefa */}
      <TaskDetailsDialog
        task={selectedTask}
        open={isTaskDetailsOpen}
        onClose={() => {
          setIsTaskDetailsOpen(false);
          setSelectedTask(null);
        }}
        onEdit={handleTaskEdit}
        onDelete={handleTaskDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
