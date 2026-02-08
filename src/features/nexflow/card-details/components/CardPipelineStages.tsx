import { cn } from "@/lib/utils";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { NexflowCard } from "@/types/nexflow";

interface CardPipelineStagesProps {
  steps: NexflowStepWithFields[];
  currentStepId: string | null;
  card: NexflowCard | null;
}

const MAX_TITLE_LENGTH = 15;

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

  // Janela de 3 etapas: anterior, atual, próxima (com clamp); na última etapa só 2 itens
  const total = sortedSteps.length;
  const showAll = total <= 3;
  const startIdx = showAll
    ? 0
    : currentIndex >= total - 1
      ? total - 2
      : Math.max(0, Math.min(currentIndex - 1, total - 3));
  const endIdx = showAll ? total : Math.min(startIdx + 3, total);
  const visibleSteps = sortedSteps.slice(startIdx, endIdx);

  const positionLabel =
    total > 3 && currentIndex >= 0
      ? `Etapa ${currentIndex + 1} de ${total}`
      : null;

  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Indicador de posição (só quando há mais de 3 etapas) */}
      {positionLabel && (
        <span
          className="shrink-0 text-xs text-muted-foreground"
          aria-label={positionLabel}
        >
          {positionLabel}
        </span>
      )}

      <div className="flex items-center gap-4 pt-3 pb-3">
        {visibleSteps.map((step, index) => {
          const globalIndex = startIdx + index;
          const isCurrent = step.id === currentStepId;
          const isPast = currentIndex !== -1 && globalIndex < currentIndex;

          return (
            <div key={step.id} className="flex items-center shrink-0">
              {/* Etapa */}
              <div className="flex flex-col items-center relative">
                {/* Círculo da etapa (com title para acessibilidade) */}
                <div
                  title={step.title}
                  className={cn(
                    "relative flex items-center justify-center h-7 w-7 rounded-full font-bold text-xs overflow-visible",
                    "ring-4 ring-white ",
                    isCurrent
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 "
                      : isPast
                        ? "bg-indigo-100  text-indigo-600 "
                        : "bg-indigo-100  text-indigo-600 "
                  )}
                >
                  {step.position}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white  rounded-full border-2 border-emerald-500 z-10" />
                  )}
                </div>

                {/* Título da etapa (truncado) */}
                <span
                  className={cn(
                    "text-[10px] mt-1 max-w-[4.5rem] truncate",
                    isCurrent
                      ? "text-slate-800  font-bold"
                      : "text-slate-400  font-medium"
                  )}
                  title={step.title}
                >
                  {step.title.length > MAX_TITLE_LENGTH
                    ? `${step.title.substring(0, MAX_TITLE_LENGTH)}...`
                    : step.title}
                </span>
              </div>

              {/* Conector entre etapas */}
              {index < visibleSteps.length - 1 && (
                <div className="h-0.5 w-6 bg-slate-200  -mt-5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
