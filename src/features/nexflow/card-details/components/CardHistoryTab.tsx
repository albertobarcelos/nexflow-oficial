import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NexflowCard, CardMovementEntry } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";

interface CardHistoryTabProps {
  card: NexflowCard;
  timelineSteps: Array<{
    entry: CardMovementEntry;
    step: NexflowStepWithFields | undefined;
  }>;
  renderTimelineFieldValue: (field: any) => React.ReactNode;
}

export function CardHistoryTab({
  card,
  timelineSteps,
  renderTimelineFieldValue,
}: CardHistoryTabProps) {
  if (timelineSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Sparkles className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Card recém-criado
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Criado em{" "}
          {format(new Date(card.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="relative space-y-4">
        <span className="absolute bottom-0 left-[5px] top-2 w-[2px] bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
        {timelineSteps.map(({ entry, step }) => {
          const isBackward = entry.movementDirection === "backward";
          const isForward = entry.movementDirection === "forward";
          const showMovement = entry.fromStepTitle && entry.toStepTitle && entry.fromStepTitle !== entry.toStepTitle;

          return (
            <li key={entry.id} className="relative pl-6">
              <div
                className={cn(
                  "absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm",
                  isBackward && "ring-2 ring-orange-500 dark:ring-orange-400"
                )}
                style={{ backgroundColor: step?.color ?? "#94a3b8" }}
              />
              <div
                className={cn(
                  "rounded-xl p-4 shadow-sm ring-1",
                  isBackward
                    ? "bg-orange-50 dark:bg-orange-950/20 ring-orange-200 dark:ring-orange-800"
                    : "bg-white dark:bg-gray-800 ring-gray-100 dark:ring-gray-700"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm font-medium"
                        style={{ color: step?.color ?? "#334155" }}
                      >
                        {entry.toStepTitle || step?.title || "Etapa"}
                      </p>
                      {isBackward && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 text-xs">
                          <ArrowLeft className="mr-1 h-3 w-3" />
                          Regresso
                        </Badge>
                      )}
                      {entry.actionType === 'complete' && (
                        <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 text-xs">
                          Concluído
                        </Badge>
                      )}
                      {entry.actionType === 'cancel' && (
                        <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400 text-xs">
                          Cancelado
                        </Badge>
                      )}
                    </div>
                    {showMovement && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {entry.fromStepTitle}
                        </span>
                        {isBackward ? (
                          <ArrowLeft className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <ArrowRight className="h-3 w-3" />
                        )}
                        <span
                          className={cn(
                            "text-xs",
                            isBackward
                              ? "text-orange-600 dark:text-orange-400 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {entry.toStepTitle}
                        </span>
                        {entry.fromStepPosition !== null && entry.toStepPosition !== null && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Posição {entry.fromStepPosition} → {entry.toStepPosition})
                          </span>
                        )}
                      </div>
                    )}
                    {entry.userName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Movido por {entry.userName}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {format(new Date(entry.movedAt), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {step?.fields?.length ? (
                  <div className={cn(
                    "mt-3 space-y-2 border-t pt-3",
                    isBackward
                      ? "border-orange-200 dark:border-orange-800"
                      : "border-gray-50 dark:border-gray-700"
                  )}>
                    {step.fields.map((field) => (
                      <div key={field.id}>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {field.label}
                        </p>
                        {renderTimelineFieldValue(field)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

