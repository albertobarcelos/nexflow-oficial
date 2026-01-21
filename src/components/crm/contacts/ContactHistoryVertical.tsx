import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, ArrowRight, FileText, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useContactHistory } from "@/hooks/useContactHistory";
import { cn } from "@/lib/utils";

interface ContactHistoryVerticalProps {
  contactId: string | null;
}

const formatDuration = (seconds: number): string => {
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

export function ContactHistoryVertical({ contactId }: ContactHistoryVerticalProps) {
  const { data: cardSummaries = [], isLoading } = useContactHistory(contactId);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Carregando histórico...</div>
      </div>
    );
  }

  if (cardSummaries.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Nenhum card vinculado a este contato
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cardSummaries.map((summary) => (
        <Card key={summary.card_id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold truncate">
                  {summary.card_title}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.flow_name}
                </p>
              </div>
              {summary.status && (
                <Badge
                  variant={
                    summary.status === "completed"
                      ? "default"
                      : summary.status === "canceled"
                      ? "destructive"
                      : "secondary"
                  }
                  className="shrink-0"
                >
                  {summary.status === "completed" ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : summary.status === "canceled" ? (
                    <XCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <Clock className="mr-1 h-3 w-3" />
                  )}
                  {summary.status === "completed"
                    ? "Concluído"
                    : summary.status === "canceled"
                    ? "Cancelado"
                    : "Em andamento"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Etapa Atual */}
            {summary.current_step && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: summary.current_step.color }}
                  />
                  <span className="text-sm font-medium">
                    {summary.current_step.title}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pl-5">
                  <span>
                    Tempo na etapa: {formatDuration(summary.time_in_current_stage)}
                  </span>
                  <span>
                    Atualizado{" "}
                    {formatDistanceToNow(new Date(summary.last_updated), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            {/* Resumo de Eventos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Últimos Eventos
                </span>
                <span className="text-xs text-muted-foreground">
                  {summary.total_events} evento{summary.total_events !== 1 ? "s" : ""} no total
                </span>
              </div>

              {summary.events.length > 0 ? (
                <div className="space-y-2">
                  <div className="space-y-2 pl-2 border-l-2 border-border">
                    {(expandedCards.has(summary.card_id)
                      ? summary.events
                      : summary.events.slice(0, 3)
                    ).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs space-y-1 py-1"
                      >
                        <div className="flex items-center gap-2">
                          {event.event_type === "stage_change" && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          {event.event_type === "field_update" && (
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          {event.event_type === "activity" && (
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-muted-foreground">
                            {event.event_type === "stage_change"
                              ? "Mudança de etapa"
                              : event.event_type === "field_update"
                              ? "Campo atualizado"
                              : event.event_type === "activity"
                              ? "Atividade"
                              : "Evento"}
                          </span>
                          <span className="text-muted-foreground/60">
                            {formatDistanceToNow(new Date(event.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        {event.event_type === "stage_change" &&
                          event.from_step &&
                          event.to_step && (
                            <div className="pl-5 text-muted-foreground/80">
                              {event.from_step.title} → {event.to_step.title}
                              {event.duration_seconds && (
                                <span className="ml-2 text-muted-foreground/60">
                                  ({formatDuration(event.duration_seconds)})
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                  {summary.events.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCardExpansion(summary.card_id)}
                      className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
                    >
                      {expandedCards.has(summary.card_id) ? (
                        <>
                          <ChevronUp className="mr-1 h-3 w-3" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-3 w-3" />
                          Ver mais ({summary.events.length - 3} evento{summary.events.length - 3 !== 1 ? "s" : ""} anterior{summary.events.length - 3 !== 1 ? "es" : ""})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground pl-2">
                  Nenhum evento registrado ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
