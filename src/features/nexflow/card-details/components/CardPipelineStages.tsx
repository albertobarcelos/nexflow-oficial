import { cn } from "@/lib/utils";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { NexflowCard } from "@/types/nexflow";

interface CardPipelineStagesProps {
  steps: NexflowStepWithFields[];
  currentStepId: string | null;
  card: NexflowCard | null;
}

export function CardPipelineStages({
  steps,
  currentStepId,
  card,
}: CardPipelineStagesProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  // Ordenar steps por position
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);
  const currentIndex = sortedSteps.findIndex((s) => s.id === currentStepId);

  return (
    <div className="flex w-full overflow-x-auto overflow-y-visible">
      <div className="flex items-center gap-8 min-w-max pt-3 pb-3">
        {sortedSteps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isPast = currentIndex !== -1 && index < currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              {/* Etapa */}
              <div className="flex flex-col items-center relative">
                {/* Círculo da etapa */}
                <div
                  className={cn(
                    "relative flex items-center justify-center h-8 w-8 rounded-full font-bold text-xs overflow-visible",
                    "ring-4 ring-white dark:ring-slate-900",
                    isCurrent
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none"
                      : isPast
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  )}
                >
                  {step.position}
                  {/* Badge indicador para etapa atual */}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white dark:bg-slate-900 rounded-full border-2 border-emerald-500 z-10" />
                  )}
                </div>

                {/* Título da etapa */}
                <span
                  className={cn(
                    "text-[10px] mt-1",
                    isCurrent
                      ? "text-slate-800 dark:text-slate-200 font-bold"
                      : "text-slate-400 dark:text-slate-500 font-medium"
                  )}
                >
                  {step.title.length > 15 ? `${step.title.substring(0, 15)}...` : step.title}
                </span>
              </div>

              {/* Conector entre etapas */}
              {index < sortedSteps.length - 1 && (
                <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-700 -mt-5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
