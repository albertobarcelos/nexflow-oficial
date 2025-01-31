import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Feed } from "@/components/ui/feed";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePeopleAndPartners } from "@/hooks/usePeopleAndPartners";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CalendarClock,
  Calendar,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DealTasksTabProps {
  dealId: string;
  mode: "view" | "edit";
}

export function DealTasksTab({ dealId, mode }: DealTasksTabProps) {
  const { tasks, isLoadingTasks, createTask, completeTask } = usePeopleAndPartners(dealId);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState(
    format(new Date().setHours(23, 59, 59), "yyyy-MM-dd'T'HH:mm", { locale: ptBR })
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      await createTask.mutateAsync({
        dealId,
        title: newTask,
        dueDate: new Date(dueDate).toISOString(),
      });
      setNewTask("");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId);
    } catch (error) {
      console.error("Erro ao completar tarefa:", error);
    }
  };

  const getTaskStatus = (task: any) => {
    if (task.completed) return "completed";
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return dueDate < now ? "overdue" : "pending";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Formulário de Criação Rápida */}
      <form onSubmit={handleCreateTask} className="flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Digite uma nova tarefa e pressione Enter..."
          className="flex-1"
        />
        <Input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-44"
        />
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Feed de Tarefas */}
      {isLoadingTasks ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Feed
          items={(tasks || []).map((task: any) => {
            const status = getTaskStatus(task);
            return {
              id: task.id,
              title: task.title,
              timestamp: format(new Date(task.dueDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
              icon: status === "completed" ? CheckCircle2 : 
                    status === "overdue" ? AlertCircle : 
                    CalendarClock,
              iconColor: cn(
                status === "completed" ? "text-green-500" :
                status === "overdue" ? "text-red-500" :
                "text-blue-500",
                "cursor-pointer"
              ),
              description: task.description,
              onClick: () => !task.completed && handleCompleteTask(task.id),
              extra: (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-2",
                    status === "completed" ? "bg-green-50 text-green-700" :
                    status === "overdue" ? "bg-red-50 text-red-700" :
                    "bg-blue-50 text-blue-700"
                  )}
                >
                  {status === "completed" ? "Concluída" :
                   status === "overdue" ? "Atrasada" :
                   "Pendente"}
                </Badge>
              )
            };
          })}
        />
      )}
    </div>
  );
}
