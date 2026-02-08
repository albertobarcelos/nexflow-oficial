"use client";

import { ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCardStepActions } from "@/hooks/useCardStepActions";
import { useCompleteCardActivity } from "@/hooks/useCardActivities";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  CalendarEvent,
  CalendarEventResourceProcess,
  CalendarEventResourceActivity,
} from "@/hooks/useCalendarActivities";

interface CalendarEventModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onViewCard: (event: CalendarEvent) => void;
  onComplete: () => void;
}

const processStatusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em progresso",
  completed: "Concluído",
  skipped: "Ignorado",
};

const processStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  in_progress: "default",
  completed: "secondary",
  skipped: "destructive",
};

function ProcessEventContent({
  event,
  resource,
  onViewCard,
  onComplete,
}: {
  event: CalendarEvent;
  resource: CalendarEventResourceProcess;
  onViewCard: () => void;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const { completeCardStepAction, isCompleting } = useCardStepActions(
    resource.cardId
  );

  const handleComplete = async () => {
    try {
      await completeCardStepAction({ id: resource.cardStepActionId });
      queryClient.invalidateQueries({ queryKey: ["calendar", "activities"] });
      onComplete();
    } catch {
      // Erro já tratado pelo useCardStepActions (toast)
    }
  };

  const statusLabel = processStatusLabels[resource.status] ?? resource.status;
  const statusVariant = processStatusVariants[resource.status] ?? "outline";
  const isCompleted = resource.status === "completed";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          {resource.stepActionTitle}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Card</p>
          <p className="font-medium text-foreground">{resource.cardTitle}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Data e hora</p>
          <p className="text-foreground">
            {format(event.start, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="default" className="flex-1" onClick={onViewCard}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver card
          </Button>
          {!isCompleted && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Concluir
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function ActivityEventContent({
  event,
  resource,
  onViewCard,
  onComplete,
}: {
  event: CalendarEvent;
  resource: CalendarEventResourceActivity;
  onViewCard: () => void;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const completeActivity = useCompleteCardActivity();

  const handleComplete = async () => {
    try {
      await completeActivity.mutateAsync({
        id: resource.cardActivityId,
        cardId: resource.cardId,
        completed: true,
      });
      queryClient.invalidateQueries({ queryKey: ["calendar", "activities"] });
      onComplete();
    } catch {
      // Erro já tratado pelo useCompleteCardActivity (toast)
    }
  };

  const isCompleted = resource.completed;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          {resource.activityTitle}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Card</p>
          <p className="font-medium text-foreground">{resource.cardTitle}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Data e hora</p>
          <p className="text-foreground">
            {format(event.start, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <Badge variant={isCompleted ? "secondary" : "outline"}>
            {isCompleted ? "Concluído" : "Pendente"}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="default" className="flex-1" onClick={onViewCard}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver card
          </Button>
          {!isCompleted && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleComplete}
              disabled={completeActivity.isPending}
            >
              {completeActivity.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Concluir
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function CalendarEventModal({
  event,
  open,
  onClose,
  onViewCard,
  onComplete,
}: CalendarEventModalProps) {
  const handleViewCard = () => {
    if (event) {
      onViewCard(event);
    }
  };

  if (!event) return null;

  const { resource } = event;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {resource.eventType === "process" ? (
          <ProcessEventContent
            event={event}
            resource={resource}
            onViewCard={handleViewCard}
            onComplete={onComplete}
          />
        ) : (
          <ActivityEventContent
            event={event}
            resource={resource}
            onViewCard={handleViewCard}
            onComplete={onComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
