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
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center gap-2 min-w-max px-2">
        {sortedSteps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isPast = currentIndex !== -1 && index < currentIndex;
          const isFuture = currentIndex !== -1 && index > currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-2">
              {/* Etapa */}
              <div
                className={cn(
                  "relative flex flex-col items-center gap-2 min-w-[120px]",
                  "transition-all duration-200"
                )}
              >
                {/* Círculo da etapa */}
                <div
                  className={cn(
                    "relative h-12 w-12 rounded-full border-2 flex items-center justify-center",
                    "transition-all duration-200",
                    isCurrent
                      ? "border-2 scale-110 shadow-lg ring-2 ring-offset-2"
                      : isPast
                      ? "border-2 opacity-60"
                      : "border-2 opacity-40",
                    isCurrent && "ring-primary"
                  )}
                  style={{
                    backgroundColor: isCurrent || isPast ? step.color || "#94a3b8" : "#e5e7eb",
                    borderColor: step.color || "#94a3b8",
                  }}
                >
                  {/* Indicador de posição */}
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isCurrent || isPast ? "text-white" : "text-gray-400"
                    )}
                  >
                    {step.position}
                  </span>
                  
                  {/* Badge de tipo de etapa */}
                  {step.stepType && (
                    <div
                      className={cn(
                        "absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-gray-800",
                        step.stepType === "finisher" && "bg-green-500",
                        step.stepType === "fail" && "bg-red-500",
                        step.stepType === "freezing" && "bg-blue-500"
                      )}
                      title={
                        step.stepType === "finisher"
                          ? "Etapa final"
                          : step.stepType === "fail"
                          ? "Etapa de falha"
                          : "Etapa de congelamento"
                      }
                    />
                  )}
                </div>

                {/* Título da etapa */}
                <div className="text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-xs font-medium truncate",
                      isCurrent
                        ? "text-foreground font-semibold"
                        : isPast
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                    )}
                    title={step.title}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Conector entre etapas */}
              {index < sortedSteps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 transition-all duration-200",
                    isPast || (isCurrent && index === currentIndex)
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground px-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span>Etapa atual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400 opacity-60" />
          <span>Etapas anteriores</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700 opacity-40" />
          <span>Próximas etapas</span>
        </div>
      </div>
    </div>
  );
}
