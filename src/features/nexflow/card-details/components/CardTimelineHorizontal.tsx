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
  Tag,
  ListChecks,
  DollarSign,
  GitBranch,
  Users,
  Paperclip,
  MessageSquare,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import type { CardTimelineEvent } from "@/hooks/useCardTimeline";

interface CardTimelineHorizontalProps {
  events: CardTimelineEvent[];
  cardId?: string | null;
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
    case "unfreeze":
      return Snowflake;
    case "checklist_completed":
    case "checklist_change":
      return FileCheck;
    case "process_status_change":
    case "process_completed":
      return Workflow;
    case "title_change":
      return Tag;
    case "assignee_change":
      return User;
    case "product_value_change":
      return DollarSign;
    case "parent_change":
      return GitBranch;
    case "agents_change":
      return Users;
    case "attachment_uploaded":
      return Paperclip;
    case "message_created":
      return MessageSquare;
    case "points_change":
      return Flame;
    default:
      return Clock;
  }
};

const getEventColor = (
  eventType: CardTimelineEvent["event_type"],
  movementDirection?: string | null
) => {
  if (eventType === "stage_change" && movementDirection === "backward") {
    return "text-orange-600  bg-orange-50 ";
  }
  if (eventType === "status_change") {
    return "text-green-600  bg-green-50 ";
  }
  if (eventType === "freeze") {
    return "text-blue-600  bg-blue-50 ";
  }
  if (eventType === "activity") {
    return "text-purple-600  bg-purple-50 ";
  }
  if (eventType === "process_status_change" || eventType === "process_completed") {
    return "text-indigo-600  bg-indigo-50 ";
  }
  if (eventType === "title_change") {
    return "text-amber-600  bg-amber-50 ";
  }
  if (eventType === "assignee_change") {
    return "text-cyan-600  bg-cyan-50 ";
  }
  if (eventType === "checklist_change") {
    return "text-emerald-600  bg-emerald-50 ";
  }
  if (eventType === "product_value_change") {
    return "text-lime-600  bg-lime-50 ";
  }
  if (eventType === "parent_change") {
    return "text-violet-600  bg-violet-50 ";
  }
  if (eventType === "agents_change") {
    return "text-pink-600  bg-pink-50 ";
  }
  if (eventType === "attachment_uploaded") {
    return "text-teal-600  bg-teal-50 ";
  }
  if (eventType === "message_created") {
    return "text-sky-600  bg-sky-50 ";
  }
  if (eventType === "points_change") {
    return "text-orange-600  bg-orange-50 ";
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

export function CardTimelineHorizontal({ events, cardId }: CardTimelineHorizontalProps) {
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
        {/* Centralizada verticalmente: bolinhas h-8 (32px), centro em 16px do topo */}
        {/* Linha h-0.5, posicionada em 16px - 0.25px = 15.75px para centralizar */}
        <div className="absolute left-0 right-0 h-0.5 bg-border z-0" 
          style={{ 
            width: 'calc(100% - 2rem)', 
            left: '1rem',
            top: '15.75px' // Centro da linha alinhado com centro das bolinhas (16px)
          }} 
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
              {/* Nó do evento (bolinha menor) - centralizado com a linha */}
              {/* h-8 = 32px, centro em 16px do topo, alinhado com linha em top-4 (16px) */}
              <div
                className={cn(
                  "relative h-8 w-8 rounded-full border-2 flex items-center justify-center",
                  "transition-all duration-200 shadow-sm",
                  colorClass,
                  isBackward && "ring-2 ring-orange-500 "
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
                  "border-border bg-background",
                  "transition-all duration-200"
                )}
              >
                {/* Tipo de evento */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs whitespace-nowrap",
                      isBackward && "border-orange-500 text-orange-600 "
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
                    {event.event_type === "title_change" && <Tag className="mr-1 h-3 w-3" />}
                    {event.event_type === "assignee_change" && <User className="mr-1 h-3 w-3" />}
                    {event.event_type === "checklist_change" && <FileCheck className="mr-1 h-3 w-3" />}
                    {event.event_type === "product_value_change" && <DollarSign className="mr-1 h-3 w-3" />}
                    {event.event_type === "parent_change" && <GitBranch className="mr-1 h-3 w-3" />}
                    {event.event_type === "agents_change" && <Users className="mr-1 h-3 w-3" />}
                    {event.event_type === "attachment_uploaded" && <Paperclip className="mr-1 h-3 w-3" />}
                    {event.event_type === "message_created" && <MessageSquare className="mr-1 h-3 w-3" />}
                    {event.event_type === "points_change" && <Flame className="mr-1 h-3 w-3" />}
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
                      : event.event_type === "checklist_change"
                      ? "Checklist"
                      : event.event_type === "process_status_change" || event.event_type === "process_completed"
                      ? "Processo"
                      : event.event_type === "title_change"
                      ? "Título"
                      : event.event_type === "assignee_change"
                      ? "Responsável"
                      : event.event_type === "product_value_change"
                      ? "Produto/Valor"
                      : event.event_type === "parent_change"
                      ? "Card Pai"
                      : event.event_type === "agents_change"
                      ? "Agents"
                      : event.event_type === "attachment_uploaded"
                      ? "Anexo"
                      : event.event_type === "message_created"
                      ? "Comentário"
                      : event.event_type === "points_change"
                      ? "Chamas/Strikes"
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
                            <ArrowLeft className="h-3 w-3 text-orange-600  shrink-0" />
                          ) : (
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          )}
                          <span
                            className={cn(
                              "font-medium truncate",
                              isBackward && "text-orange-600 "
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
                      {/* Mostrar quantidade de campos preenchidos na etapa anterior */}
                      {event.details && 
                       typeof event.details.fields_filled === 'object' && 
                       event.details.fields_filled !== null &&
                       Array.isArray(event.details.fields_filled) &&
                       event.details.fields_filled.length > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          {event.details.fields_filled.length} campo(s) preenchido(s) na etapa anterior
                        </div>
                      )}
                    </>
                  )}

                  {event.event_type === "field_update" && event.field && (
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-muted-foreground">Campo: </span>
                        <span className="font-medium">{event.field.label}</span>
                      </div>
                      {event.step && (
                        <div className="text-[10px] text-muted-foreground">
                          Etapa: {event.step.title}
                        </div>
                      )}
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

                  {event.event_type === "attachment_uploaded" && event.details && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Arquivo: </span>
                      <span className="font-medium">
                        {event.details.file_name ? String(event.details.file_name) : "—"}
                      </span>
                    </div>
                  )}

                  {event.event_type === "message_created" && event.details && (
                    <div className="text-xs space-y-1">
                      {event.details.content_preview && (
                        <div className="font-medium truncate">
                          {String(event.details.content_preview)}
                        </div>
                      )}
                      {event.details.has_file && event.details.file_name && (
                        <div className="text-[10px] text-muted-foreground">
                          Arquivo: {String(event.details.file_name)}
                        </div>
                      )}
                    </div>
                  )}

                  {event.event_type === "points_change" && (
                    <div className="text-xs space-y-0.5">
                      {event.previous_value?.value != null && (
                        <div className="text-[10px] line-through opacity-60">
                          {String(event.previous_value.value)} →
                        </div>
                      )}
                      <div className="font-medium text-green-600 ">
                        {event.new_value?.value != null
                          ? `${String(event.new_value.value)} pontos`
                          : "—"}
                      </div>
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
