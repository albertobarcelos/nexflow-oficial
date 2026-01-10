import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import type { NexflowCard, NexflowStepWithFields, CardMovementEntry } from "@/types/nexflow";

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
        {timelineSteps.map(({ entry, step }) => (
          <li key={entry.id} className="relative pl-6">
            <div
              className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
              style={{ backgroundColor: step?.color ?? "#94a3b8" }}
            />
            <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p
                    className="text-sm font-medium"
                    style={{ color: step?.color ?? "#334155" }}
                  >
                    {entry.toStepTitle || step?.title || "Etapa"}
                  </p>
                  {entry.fromStepTitle && entry.toStepTitle && entry.fromStepTitle !== entry.toStepTitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {entry.fromStepTitle} → {entry.toStepTitle}
                    </p>
                  )}
                  {entry.userName && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Movido por {entry.userName}
                    </p>
                  )}
                  {entry.actionType === 'complete' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                      ✓ Concluído
                    </p>
                  )}
                  {entry.actionType === 'cancel' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                      ✗ Cancelado
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-gray-400">
                  {format(new Date(entry.movedAt), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
              {step?.fields?.length ? (
                <div className="mt-3 space-y-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                  {step.fields.map((field) => (
                    <div key={field.id}>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {field.label}
                      </p>
                      {renderTimelineFieldValue(field)}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

