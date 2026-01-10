import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { NexflowCard, NexflowStepWithFields } from "@/types/nexflow";

interface CardOverviewTabProps {
  card: NexflowCard;
  currentStep: NexflowStepWithFields | null;
  subtaskCount: number;
  parentTitle?: string | null;
}

export function CardOverviewTab({
  card,
  currentStep,
  subtaskCount,
  parentTitle,
}: CardOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Informações do Card
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Título
            </p>
            <p className="text-sm text-gray-900 dark:text-white">{card.title}</p>
          </div>
          {currentStep && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Etapa Atual
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: currentStep.color }}
                />
                <p className="text-sm text-gray-900 dark:text-white">{currentStep.title}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Criado em
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {format(new Date(card.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
      {(subtaskCount > 0 || card.parentCardId) && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4">
          {subtaskCount > 0 && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{subtaskCount}</span> sub-card
              {subtaskCount > 1 ? "s" : ""} vinculado{subtaskCount > 1 ? "s" : ""}
            </p>
          )}
          {card.parentCardId && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Pertence a: <span className="font-medium">{parentTitle ?? "outro card"}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

