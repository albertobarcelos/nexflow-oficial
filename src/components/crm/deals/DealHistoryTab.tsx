import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Tag, 
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  UserMinus,
  Building2,
  DollarSign,
  History
} from "lucide-react";
import { usePeopleAndPartners } from "@/hooks/usePeopleAndPartners";

interface DealHistoryTabProps {
  dealId: string;
}

const EVENT_ICONS: Record<string, any> = {
  task_created: Calendar,
  task_completed: CheckCircle2,
  task_overdue: AlertCircle,
  person_added: UserPlus,
  person_removed: UserMinus,
  partner_updated: Building2,
  stage_changed: ArrowRight,
  value_updated: DollarSign,
  tag_added: Tag,
  tag_removed: Tag,
  call_made: Phone,
  email_sent: Mail,
  note_added: MessageSquare
};

const EVENT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  task_created: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  task_completed: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-500" },
  task_overdue: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
  person_added: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500" },
  person_removed: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-500" },
  partner_updated: { bg: "bg-indigo-50", text: "text-indigo-700", icon: "text-indigo-500" },
  stage_changed: { bg: "bg-cyan-50", text: "text-cyan-700", icon: "text-cyan-500" },
  value_updated: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500" },
  tag_added: { bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-500" },
  tag_removed: { bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-500" },
  call_made: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  email_sent: { bg: "bg-gray-50", text: "text-gray-700", icon: "text-gray-500" },
  note_added: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "text-yellow-500" }
};

export function DealHistoryTab({ dealId }: DealHistoryTabProps) {
  const { history, isLoadingHistory } = usePeopleAndPartners(dealId);

  const groupEventsByDate = (events: any[]) => {
    return events.reduce((groups: any, event: any) => {
      const date = format(new Date(event.created_at), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    }, {});
  };

  const groupedEvents = groupEventsByDate(history || []);
  const hasHistory = history && history.length > 0;

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-15rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-gray-500">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (!hasHistory) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-gray-500">
        <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">Nenhuma atividade registrada</p>
        <p className="text-sm text-gray-400">
          O histórico de atividades aparecerá aqui quando houver atualizações nesta oportunidade
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800">Histórico de Atividades</h3>
        <p className="text-sm text-gray-500">
          Todas as atividades e mudanças relacionadas a esta oportunidade
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-15rem)]">
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, events]: [string, any]) => (
            <div key={date} className="space-y-4">
              <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-2">
                <h4 className="text-sm font-medium text-gray-500">
                  {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h4>
              </div>

              <div className="space-y-4">
                {events.map((event: any) => {
                  const EventIcon = EVENT_ICONS[event.type] || MessageSquare;
                  const colors = EVENT_COLORS[event.type] || {
                    bg: "bg-gray-50",
                    text: "text-gray-700",
                    icon: "text-gray-500"
                  };

                  return (
                    <div key={event.id} className="flex gap-4 group hover:bg-gray-50/50 p-3 rounded-lg transition-colors">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={event.user?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {event.user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {event.user?.name || "Usuário"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(event.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        <p className="text-gray-700">{event.description}</p>

                        {event.details && (
                          <div className="mt-2 text-sm">
                            <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-md">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Clock className="h-3 w-3 inline-block mr-1" />
                        {format(new Date(event.created_at), "HH:mm:ss")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
