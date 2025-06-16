import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task, TaskType } from '@/types/tasks';

interface CreateTaskInput {
  title: string;
  description?: string;
  type_id: string;
  due_date: Date;
}

interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completed?: boolean;
  completed_at?: string | null;
}

export function useTasks(dealId: string) {
  const queryClient = useQueryClient();

  // Buscar tipos de tarefas
  const { data: taskTypes = [], isLoading: isLoadingTypes } = useQuery<TaskType[]>({
    queryKey: ['taskTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Buscar tarefas do negócio
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          type:task_types (*)
        `)
        .eq('deal_id', dealId)
        .order('due_date');

      if (error) throw error;
      return data;
    },
  });

  // Criar nova tarefa
  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            deal_id: dealId,
            title: input.title,
            description: input.description,
            type_id: input.type_id,
            due_date: input.due_date.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', dealId]);
    },
  });

  // Atualizar tarefa
  const updateTask = useMutation({
    mutationFn: async ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: input.title,
          description: input.description,
          type_id: input.type_id,
          due_date: input.due_date?.toISOString(),
          completed: input.completed,
          completed_at: input.completed_at,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', dealId]);
    },
  });

  // Excluir tarefa
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', dealId]);
    },
  });

  return {
    tasks,
    taskTypes,
    isLoading: isLoading || isLoadingTypes,
    createTask,
    updateTask,
    deleteTask,
  };
}
