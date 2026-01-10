import { useContactTimeline } from "@/hooks/useContactTimeline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, UserPlus, FileText, ArrowRight, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ContactTimelineProps {
  contactId: string | null;
}

export function ContactTimeline({ contactId }: ContactTimelineProps) {
  const { data: events = [], isLoading } = useContactTimeline(contactId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Nenhum evento registrado para este contato
        </p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "contact_created":
        return <UserPlus className="h-4 w-4" />;
      case "card_created":
        return <FileText className="h-4 w-4" />;
      case "card_moved":
        return <ArrowRight className="h-4 w-4" />;
      case "card_completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "card_cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, movementDirection?: string) => {
    if (type === "card_moved" && movementDirection === "backward") {
      return "text-orange-600 dark:text-orange-400";
    }
    if (type === "card_completed") {
      return "text-green-600 dark:text-green-400";
    }
    if (type === "card_cancelled") {
      return "text-red-600 dark:text-red-400";
    }
    return "text-blue-600 dark:text-blue-400";
  };

  const getEventBgColor = (type: string, movementDirection?: string) => {
    if (type === "card_moved" && movementDirection === "backward") {
      return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800";
    }
    if (type === "card_completed") {
      return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
    }
    if (type === "card_cancelled") {
      return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
    }
    return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Linha vertical da timeline */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {events.map((event, index) => {
            const isBackward = event.metadata?.movementDirection === "backward";
            const iconColor = getEventColor(event.type, event.metadata?.movementDirection);
            const bgColor = getEventBgColor(event.type, event.metadata?.movementDirection);

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Ícone do evento */}
                <div
                  className={cn(
                    "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background shadow-sm",
                    bgColor,
                    iconColor
                  )}
                >
                  {getEventIcon(event.type)}
                </div>

                {/* Conteúdo do evento */}
                <div className="flex-1 pb-6">
                  <Card className={cn("border", bgColor)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{event.title}</h4>
                            {isBackward && (
                              <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
                                <ArrowLeft className="mr-1 h-3 w-3" />
                                Regresso
                              </Badge>
                            )}
                            {event.type === "card_completed" && (
                              <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                                Concluído
                              </Badge>
                            )}
                            {event.type === "card_cancelled" && (
                              <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">
                                Cancelado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                          {event.metadata?.cardTitle && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium">Card:</span> {event.metadata.cardTitle}
                            </div>
                          )}
                          {event.metadata?.flowName && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Flow:</span> {event.metadata.flowName}
                            </div>
                          )}
                          {event.metadata?.fromStepTitle && event.metadata?.toStepTitle && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                {event.metadata.fromStepTitle}
                              </span>
                              {isBackward ? (
                                <ArrowLeft className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                              ) : (
                                <ArrowRight className="h-3 w-3" />
                              )}
                              <span className={cn(
                                isBackward && "text-orange-600 dark:text-orange-400 font-medium"
                              )}>
                                {event.metadata.toStepTitle}
                              </span>
                            </div>
                          )}
                          {event.metadata?.userName && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Por: {event.metadata.userName}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

