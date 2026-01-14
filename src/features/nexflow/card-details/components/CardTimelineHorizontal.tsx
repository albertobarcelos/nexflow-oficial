import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit,
  Clock,
  Snowflake,
  FileCheck,
  User,
  Workflow,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import type { CardTimelineEvent } from "@/hooks/useCardTimeline";

interface CardTimelineHorizontalProps {
  events: CardTimelineEvent[];
}

const getEventIcon = (eventType: CardTimelineEvent["event_type"]) => {
  switch (eventType) {
    case "stage_change":
      return ArrowRight;
    case "field_update":
      return Edit;
    case "activity":
      return Clock;
    case "status_change":
      return CheckCircle2;
    case "freeze":
      return Snowflake;
    case "unfreeze":
      return Snowflake;
    case "checklist_completed":
      return FileCheck;
    case "process_status_change":
    case "process_completed":
      return Workflow;
    default:
      return Clock;
  }
};

const getEventColor = (
  eventType: CardTimelineEvent["event_type"],
  movementDirection?: string | null
) => {
  if (eventType === "stage_change" && movementDirection === "backward") {
    return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20";
  }
  if (eventType === "status_change") {
    return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20";
  }
  if (eventType === "freeze") {
    return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20";
  }
  if (eventType === "activity") {
    return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20";
  }
  if (eventType === "process_status_change" || eventType === "process_completed") {
    return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20";
  }
  return "text-primary bg-primary/10";
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "";
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
};

export function CardTimelineHorizontal({ events }: CardTimelineHorizontalProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div className="text-sm text-muted-foreground">
          Nenhum evento registrado ainda
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="relative flex items-start gap-8 min-w-max py-6 px-4">
        {/* Linha horizontal contínua conectando todas as bolinhas */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-border z-0" 
          style={{ width: 'calc(100% - 2rem)', left: '1rem' }} 
        />

        {events.map((event, index) => {
          const Icon = getEventIcon(event.event_type);
          const colorClass = getEventColor(event.event_type, event.movement_direction);
          const isBackward = event.movement_direction === "backward";
          const isLast = index === events.length - 1;

          return (
            <div
              key={event.id}
              className={cn(
                "relative flex flex-col items-center gap-2 z-10",
                "min-w-[180px] max-w-[220px] flex-shrink-0",
                "transition-all duration-200"
              )}
            >
              {/* Nó do evento (bolinha menor) */}
              <div
                className={cn(
                  "relative h-8 w-8 rounded-full border-2 flex items-center justify-center",
                  "transition-all duration-200 shadow-sm",
                  colorClass,
                  isBackward && "ring-2 ring-orange-500 dark:ring-orange-400"
                )}
                style={{
                  backgroundColor: event.to_step?.color
                    ? `${event.to_step.color}20`
                    : undefined,
                  borderColor: event.to_step?.color || undefined,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Card do evento */}
              <div
                className={cn(
                  "rounded-lg p-3 shadow-sm border w-full mt-2",
                  colorClass,
                  "border-border bg-background"
                )}
              >
                {/* Tipo de evento */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs whitespace-nowrap",
                      isBackward && "border-orange-500 text-orange-600 dark:text-orange-400"
                    )}
                  >
                    {event.event_type === "stage_change" && isBackward && (
                      <ArrowLeft className="mr-1 h-3 w-3" />
                    )}
                    {event.event_type === "stage_change" && !isBackward && (
                      <ArrowRight className="mr-1 h-3 w-3" />
                    )}
                    {event.event_type === "field_update" && <Edit className="mr-1 h-3 w-3" />}
                    {event.event_type === "activity" && <Clock className="mr-1 h-3 w-3" />}
                    {event.event_type === "status_change" && (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    {event.event_type === "freeze" && <Snowflake className="mr-1 h-3 w-3" />}
                    {event.event_type === "unfreeze" && <Snowflake className="mr-1 h-3 w-3" />}
                    {event.event_type === "checklist_completed" && (
                      <FileCheck className="mr-1 h-3 w-3" />
                    )}
                    {(event.event_type === "process_status_change" || event.event_type === "process_completed") && (
                      <Workflow className="mr-1 h-3 w-3" />
                    )}
                    {event.event_type === "stage_change"
                      ? isBackward
                        ? "Regresso"
                        : "Mudança"
                      : event.event_type === "field_update"
                      ? "Edição"
                      : event.event_type === "activity"
                      ? "Atividade"
                      : event.event_type === "status_change"
                      ? "Status"
                      : event.event_type === "freeze"
                      ? "Congelado"
                      : event.event_type === "unfreeze"
                      ? "Descongelado"
                      : event.event_type === "checklist_completed"
                      ? "Checklist"
                      : event.event_type === "process_status_change" || event.event_type === "process_completed"
                      ? "Processo"
                      : "Evento"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>

                {/* Detalhes do evento */}
                <div className="space-y-1">
                  {event.event_type === "stage_change" && (
                    <>
                      {event.from_step && event.to_step && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground truncate">
                            {event.from_step.title}
                          </span>
                          {isBackward ? (
                            <ArrowLeft className="h-3 w-3 text-orange-600 dark:text-orange-400 shrink-0" />
                          ) : (
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          )}
                          <span
                            className={cn(
                              "font-medium truncate",
                              isBackward && "text-orange-600 dark:text-orange-400"
                            )}
                          >
                            {event.to_step.title}
                          </span>
                        </div>
                      )}
                      {event.duration_seconds && (
                        <div className="text-[10px] text-muted-foreground">
                          Tempo na etapa anterior: {formatDuration(event.duration_seconds)}
                        </div>
                      )}
                    </>
                  )}

                  {event.event_type === "field_update" && event.field && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Campo: </span>
                      <span className="font-medium">{event.field.label}</span>
                    </div>
                  )}

                  {event.event_type === "activity" && event.activity && (
                    <div className="text-xs space-y-1">
                      <div className="font-medium">{event.activity.title}</div>
                      {event.activity.activity_action && (
                        <div className="text-[10px] text-muted-foreground">
                          {event.activity.activity_action === 'created' && 'Criada'}
                          {event.activity.activity_action === 'completed' && 'Concluída'}
                          {event.activity.activity_action === 'updated' && 'Atualizada'}
                        </div>
                      )}
                      {event.activity.completed && event.activity.completed_at && (
                        <div className="text-[10px] text-muted-foreground">
                          Concluída em {format(new Date(event.activity.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  )}

                  {(event.event_type === "process_status_change" || event.event_type === "process_completed") && event.process && (
                    <div className="text-xs space-y-1">
                      <div className="font-medium">{event.process.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Status: {event.process.status === 'pending' && 'Pendente'}
                        {event.process.status === 'in_progress' && 'Em andamento'}
                        {event.process.status === 'completed' && 'Concluído'}
                        {event.process.status === 'skipped' && 'Pulado'}
                      </div>
                      {event.process.completed_at && (
                        <div className="text-[10px] text-muted-foreground">
                          Concluído em {format(new Date(event.process.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Usuário */}
                  {event.user && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                      <UserAvatar
                        user={{
                          name: event.user.name || event.user.email,
                          surname: event.user.surname || undefined,
                          avatar_url: event.user.avatar_url,
                        }}
                        size="sm"
                      />
                      <span className="text-[10px] text-muted-foreground truncate">
                        {event.user.name || event.user.email}
                      </span>
                    </div>
                  )}

                  {/* Data/hora completa */}
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
