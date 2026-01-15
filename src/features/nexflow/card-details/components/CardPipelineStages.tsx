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
    <div className="w-full overflow-x-auto overflow-y-visible">
      <div className="flex items-center gap-1.5 min-w-max py-1">
        {sortedSteps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isPast = currentIndex !== -1 && index < currentIndex;
          const isFuture = currentIndex !== -1 && index > currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-1.5">
              {/* Etapa */}
              <div
                className={cn(
                  "relative flex flex-col items-center gap-1 min-w-[80px]",
                  "transition-all duration-200"
                )}
              >
                {/* Círculo da etapa */}
                <div
                  className={cn(
                    "relative h-8 w-8 rounded-full border-2 flex items-center justify-center",
                    "transition-all duration-200",
                    isCurrent
                      ? "border-2 scale-105 shadow-md ring-1 ring-offset-1"
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
                      "text-[10px] font-semibold",
                      isCurrent || isPast ? "text-white" : "text-gray-400"
                    )}
                  >
                    {step.position}
                  </span>
                  
                  {/* Badge de tipo de etapa */}
                  {step.stepType && (
                    <div
                      className={cn(
                        "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border border-white dark:border-gray-800",
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
                <div className="text-center max-w-[80px]">
                  <p
                    className={cn(
                      "text-[10px] font-medium truncate",
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
                    "h-0.5 w-6 transition-all duration-200",
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
    </div>
  );
}
