import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCardTimeline } from "@/hooks/useCardTimeline";
import { useCardStepHistory } from "@/hooks/useCardStepHistory";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCnpjCpf } from "@/lib/utils/cnpjCpf";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Edit,
  Clock,
  Snowflake,
  FileCheck,
  User,
  Workflow,
  Tag,
  DollarSign,
  GitBranch,
  Users,
  Paperclip,
  MessageSquare,
  Eye,
} from "lucide-react";
import type { NexflowCard } from "@/types/nexflow";
import type { CardTimelineEvent } from "@/hooks/useCardTimeline";
import type { StepHistory } from "@/hooks/useCardStepHistory";

interface CardTimelineUnifiedProps {
  card: NexflowCard;
}

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  type: "event" | "step";
  content: React.ReactNode;
  event?: CardTimelineEvent; // Para eventos, manter referência ao evento original
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

const formatFieldValue = (value: unknown, fieldType?: string): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "Nenhum item";
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "string" && fieldType === "date") {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }
    } catch {
      // Fall through
    }
  }

  // CNPJ/CPF
  if (fieldType === "text" && typeof value === "string") {
    try {
      const formatted = formatCnpjCpf(value);
      if (formatted !== value) {
        return formatted;
      }
    } catch {
      // Fall through
    }
  }

  return String(value);
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

// Componente Dialog para detalhes de field_update
function FieldUpdateDetailsDialog({ event }: { event: CardTimelineEvent }) {
  const fieldLabel = event.field?.label 
    || (event.details?.field_label as string) 
    || (event.details?.field_key as string) 
    || 'Campo';

  const previousValue = event.previous_value?.value;
  const newValue = event.new_value?.value;
  const fieldType = event.field?.field_type || 'text';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          <Eye className="h-3 w-3 mr-1" />
          Visualizar mais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Detalhes da Alteração</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Informações do campo */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Campo</div>
            <div className="text-sm font-semibold">{fieldLabel}</div>
            {event.step && (
              <div className="text-xs text-muted-foreground">
                Etapa: {event.step.title}
              </div>
            )}
          </div>

          {/* ANTES */}
          {previousValue !== undefined && previousValue !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">ANTES</span>
              </div>
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5">
                <div className="text-xs text-foreground whitespace-pre-wrap break-words">
                  {formatFieldValue(previousValue, fieldType)}
                </div>
              </div>
            </div>
          )}

          {/* Seta */}
          {(previousValue !== undefined || newValue !== undefined) && (
            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* DEPOIS */}
          {newValue !== undefined && newValue !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">DEPOIS</span>
              </div>
              <div className="rounded-md border border-green-500/20 bg-green-500/5 p-2.5">
                <div className="text-xs text-foreground whitespace-pre-wrap break-words">
                  {formatFieldValue(newValue, fieldType)}
                </div>
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          {event.user && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <UserAvatar
                user={{
                  name: event.user.name || event.user.email,
                  surname: event.user.surname || undefined,
                  avatar_url: event.user.avatar_url,
                }}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {event.user.name || event.user.email}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CardTimelineUnified({ card }: CardTimelineUnifiedProps) {
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useCardTimeline(card?.id);
  const { data: stepHistory = [], isLoading: isLoadingHistory } = useCardStepHistory(
    card?.id,
    card?.stepId
  );

  const timelineItems = useMemo(() => {
    if (isLoadingTimeline || isLoadingHistory) {
      return [];
    }

    // Combinar snapshots de etapas
    const allStepHistory: StepHistory[] = stepHistory || [];

    // Converter eventos de timeline
    const eventItems: TimelineItem[] = timelineEvents.map((event) => {
      const Icon = getEventIcon(event.event_type);
      const colorClass = getEventColor(event.event_type, event.movement_direction);
      const isBackward = event.movement_direction === "backward";

      let cardTitle = "";
      let cardSubtitle = "";

      if (event.event_type === "stage_change") {
        cardTitle = isBackward ? "Regresso" : "Mudança";
        if (event.from_step && event.to_step) {
          cardSubtitle = `${event.from_step.title} → ${event.to_step.title}`;
        }
      } else if (event.event_type === "field_update") {
        cardTitle = "Edição";
        // Garantir nome do campo com fallbacks
        const fieldLabel = event.field?.label 
          || (event.details?.field_label as string) 
          || (event.details?.field_key as string) 
          || 'Campo';
        cardSubtitle = fieldLabel;
      } else if (event.event_type === "activity") {
        cardTitle = "Atividade";
        if (event.activity) {
          cardSubtitle = event.activity.title;
        }
      } else {
        cardTitle = "Evento";
        cardSubtitle = event.event_type;
      }

      return {
        id: `event-${event.id}`,
        date: event.created_at,
        title: format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        type: "event" as const,
        event, // Manter referência ao evento original
        content: (
          <div className={cn("rounded-lg p-2.5 shadow-sm border w-full", colorClass, "border-border bg-background")}>
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", isBackward && "border-orange-500 text-orange-600 dark:text-orange-400")}>
                <Icon className="mr-1 h-3 w-3" />
                {cardTitle}
              </Badge>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(event.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            <div className="space-y-1">
              {event.event_type === "stage_change" && (
                <>
                  {event.from_step && event.to_step && (
                    <div className="text-xs font-medium">
                      {event.from_step.title} → {event.to_step.title}
                    </div>
                  )}
                  {event.duration_seconds && (
                    <div className="text-[10px] text-muted-foreground">
                      Tempo na etapa anterior: {formatDuration(event.duration_seconds)}
                    </div>
                  )}
                </>
              )}

              {event.event_type === "field_update" && (
                <div className="text-xs space-y-1">
                  <div className="font-medium">
                    {event.field?.label 
                      || (event.details?.field_label as string) 
                      || (event.details?.field_key as string) 
                      || 'Campo'}
                  </div>
                  {/* Preview de valores */}
                  {event.previous_value?.value !== undefined && event.new_value?.value !== undefined && (
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div className="line-through opacity-60">
                        {formatFieldValue(event.previous_value.value, event.field?.field_type || 'text')}
                      </div>
                      <div className="font-medium text-green-600 dark:text-green-400">
                        → {formatFieldValue(event.new_value.value, event.field?.field_type || 'text')}
                      </div>
                    </div>
                  )}
                  {event.step && (
                    <div className="text-[10px] text-muted-foreground">
                      Etapa: {event.step.title}
                    </div>
                  )}
                  {/* Botão para visualizar mais */}
                  <div className="pt-1">
                    <FieldUpdateDetailsDialog event={event} />
                  </div>
                </div>
              )}

              {event.user && (
                <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border">
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
            </div>
          </div>
        ),
      };
    });

    // Converter snapshots de etapas
    const stepItems: TimelineItem[] = allStepHistory.map((step) => {
      const isCurrent = step.step_id === card?.stepId;

      return {
        id: `step-${step.step_id}`,
        date: step.created_at,
        title: format(new Date(step.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        type: "step" as const,
        content: (
          <div className={cn(
            "rounded-lg p-2.5 shadow-sm border w-full",
            isCurrent
              ? "bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/50"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          )}>
            <div className="flex justify-between items-center mb-1.5">
              <span className={cn(
                "text-xs font-semibold",
                isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"
              )}>
                {isCurrent ? "ETAPA ATUAL" : step.step_name}
              </span>
              <span className="text-[10px] text-slate-400">
                {format(new Date(step.created_at), "dd/MM/yyyy", { locale: ptBR }) === format(new Date(), "dd/MM/yyyy", { locale: ptBR })
                  ? "Hoje"
                  : format(new Date(step.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>

            {step.fields.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Nenhum campo preenchido nesta etapa</p>
            ) : (
              <div className="space-y-1.5">
                {step.fields.map((field) => (
                  <div key={field.field_id}>
                    <label className="text-[10px] font-medium text-slate-400 block mb-0.5">
                      {field.label}
                    </label>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {formatFieldValue(field.value, field.field_type)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
      };
    });

    // Combinar e ordenar por data
    const allItems = [...eventItems, ...stepItems].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return allItems;
  }, [timelineEvents, stepHistory, card, isLoadingTimeline, isLoadingHistory]);

  if (isLoadingTimeline || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Carregando histórico...</div>
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Nenhum histórico disponível
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Os eventos e campos preenchidos aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full py-4 md:py-6">
      {/* Linha vertical central - oculta em mobile */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 transform -translate-x-1/2 z-0" />
      
      {/* Items da timeline */}
      <div className="space-y-0">
        {timelineItems.map((item, index) => {
          const isLeft = index % 2 === 0;
          
          return (
            <div
              key={item.id}
              className={cn(
                "relative mb-4 md:mb-6 flex items-center",
                // Desktop: alternado (esquerda/direita)
                isLeft 
                  ? "md:justify-start md:pr-[calc(50%+20px)]" 
                  : "md:justify-end md:pl-[calc(50%+20px)]",
                // Mobile: single column centralizado
                "max-md:justify-center max-md:px-4"
              )}
            >
              {/* Círculo indicador - oculto em mobile */}
              <div className={cn(
                "hidden md:block absolute top-5 w-2.5 h-2.5 rounded-full border-2 z-10 transform -translate-x-1/2",
                item.type === "event"
                  ? "bg-indigo-500 border-white dark:border-slate-900"
                  : "bg-emerald-500 border-white dark:border-slate-900",
                "left-1/2"
              )} />
              
              {/* Container do card */}
              <div className={cn(
                // Desktop: largura fit-content
                "md:w-fit",
                // Mobile: largura quase total
                "max-md:w-full max-md:max-w-[95%]",
                isLeft ? "md:text-right" : "md:text-left",
                "max-md:text-left"
              )}>
                {/* Data/Título */}
                <div className="mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.title}
                  </span>
                </div>

                {/* Card */}
                <div className="w-full">
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
