import { memo } from "react";
import { Feed } from "@/components/ui/feed";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, AlertCircle, Clock, History } from "lucide-react";

interface HistoryEvent {
  id: string;
  description: string;
  created_at: string;
  type: string;
  details?: any;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

interface DealHistoryTabProps {
  dealId: string;
  history: HistoryEvent[];
  isLoading: boolean;
}

export const DealHistoryTab = memo(function DealHistoryTab({ 
  dealId, 
  history, 
  isLoading 
}: DealHistoryTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Feed
        items={history.map((event) => ({
          id: event.id,
          title: event.description,
          timestamp: format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
          icon: event.type === "task_completed" ? CheckCircle2 : 
                event.type === "task_overdue" ? AlertCircle :
                event.type === "task_created" ? Clock :
                History,
          iconColor: event.type === "task_completed" ? "text-green-500" :
                    event.type === "task_overdue" ? "text-red-500" :
                    event.type === "task_created" ? "text-blue-500" :
                    "text-gray-500",
          description: event.details ? JSON.stringify(event.details, null, 2) : undefined,
          user: event.user ? {
            name: event.user.name || "Sistema",
            avatar: event.user.avatar_url
          } : undefined
        }))}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Otimizar re-renders
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.dealId !== nextProps.dealId) return false;
  if (prevProps.history.length !== nextProps.history.length) return false;
  
  // Se chegou aqui, não precisa re-renderizar
  return true;
});