import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskType } from '@/types/tasks';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Phone,
  Users,
  Mail,
  FileText,
  Handshake,
} from 'lucide-react';

interface DealTasksTabProps {
  deal: Deal;
}

const formSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  type_id: z.string().uuid('Selecione um tipo de tarefa'),
  due_date: z.date({
    required_error: 'Selecione uma data',
  }),
});

export function DealTasksTab({ deal }: DealTasksTabProps) {
  const { toast } = useToast();
  const { tasks, taskTypes, isLoading, createTask, updateTask } = useTasks(deal.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: new Date(),
    },
  });

  const getTaskIcon = (iconName: string) => {
    const icons = {
      phone: <Phone className="h-4 w-4" />,
      users: <Users className="h-4 w-4" />,
      mail: <Mail className="h-4 w-4" />,
      'file-text': <FileText className="h-4 w-4" />,
      handshake: <Handshake className="h-4 w-4" />,
    };
    return icons[iconName] || <Circle className="h-4 w-4" />;
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (selectedTask) {
        await updateTask.mutateAsync({
          taskId: selectedTask.id,
          input: {
            title: values.title,
            description: values.description,
            type_id: values.type_id,
            due_date: values.due_date,
          }
        });
      } else {
        await createTask.mutateAsync({
          dealId: deal.id,
          title: values.title,
          description: values.description,
          type_id: values.type_id,
          due_date: values.due_date,
        });
      }
      setIsDialogOpen(false);
      setSelectedTask(null);
      form.reset();
      toast({
        title: selectedTask ? "Tarefa atualizada" : "Tarefa criada",
        description: "A tarefa foi salva com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast({
        title: "Erro ao salvar tarefa",
        description: "Ocorreu um erro ao tentar salvar a tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask.mutateAsync({
        taskId: task.id,
        input: {
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <h3 className="text-lg font-semibold">Gestão de Tarefas</h3>
        <Button 
          onClick={() => {
            setIsDialogOpen(true);
          }}
        >
          Nova Tarefa
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma tarefa cadastrada
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "p-4 border rounded-lg flex items-center justify-between",
                task.completed ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleTaskToggle(task.id)}
                  className="flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-sm flex items-center gap-1",
                        `border-${task.type.color}-200 text-${task.type.color}-700`
                      )}
                    >
                      {getTaskIcon(task.type.icon)}
                      {task.type.name}
                    </Badge>
                    <span className={cn(
                      "font-medium",
                      task.completed && "line-through text-gray-500"
                    )}>
                      {task.title}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {format(new Date(task.due_date), "PPp", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Tarefa</Label>
              <select
                {...form.register('type_id')}
                className="w-full border rounded-md p-2"
              >
                <option value="">Selecione um tipo</option>
                {taskTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.type_id && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.type_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea {...form.register('description')} />
            </div>

            <div className="space-y-2">
              <Label>Data e Hora</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.getValues('due_date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.getValues('due_date') ? (
                      format(form.getValues('due_date'), "PPp", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.getValues('due_date')}
                    onSelect={(date) => form.setValue('due_date', date)}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const date = form.getValues('due_date');
                        date.setHours(parseInt(hours), parseInt(minutes));
                        form.setValue('due_date', date);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedTask ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
