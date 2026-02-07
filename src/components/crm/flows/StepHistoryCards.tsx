import { Loader2, History } from "lucide-react";
import { useCardStepHistory } from "@/hooks/useCardStepHistory";
import { StepHistoryCard } from "./StepHistoryCard";
import type { StepHistory } from "@/hooks/useCardStepHistory";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";

interface StepHistoryCardsProps {
  cardId: string | null | undefined;
  currentStepId?: string | null;
  card?: NexflowCard | null;
  currentStep?: NexflowStepWithFields | null;
}

export function StepHistoryCards({
  cardId,
  currentStepId,
  card,
  currentStep,
}: StepHistoryCardsProps) {
  const { data: stepHistory, isLoading } = useCardStepHistory(
    cardId,
    currentStepId
  );

  if (!cardId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Criar etapa atual se disponível
  const currentStepHistory: StepHistory | null = currentStep && card ? {
    step_id: currentStep.id,
    step_name: currentStep.title,
    step_position: currentStep.position,
    field_values: card.fieldValues || {},
    created_at: card.createdAt,
    updated_at: card.createdAt,
    fields: currentStep.fields?.map(field => ({
      field_id: field.id,
      label: field.label || field.slug || field.id,
      value: card.fieldValues?.[field.id] ?? null,
      field_type: field.fieldType || 'text',
      slug: field.slug,
    })) || [],
  } : null;

  // Combinar etapa atual (se existir) com histórico, ordenando por posição decrescente
  const allSteps: StepHistory[] = [];
  if (currentStepHistory) {
    allSteps.push(currentStepHistory);
  }
  if (stepHistory && stepHistory.length > 0) {
    allSteps.push(...stepHistory);
  }
  
  // Ordenar por posição decrescente (etapa atual primeiro, depois históricas)
  allSteps.sort((a, b) => b.step_position - a.step_position);

  if (allSteps.length === 0) {
    return (
      <div className="p-4 text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-3">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-sm font-medium text-foreground">
          Nenhum histórico disponível
        </p>
        <p className="text-xs text-muted-foreground">
          Os valores preenchidos em etapas anteriores aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
      {allSteps.map((step, index) => (
        <StepHistoryCard 
          key={step.step_id} 
          step={step} 
          isCurrent={step.step_id === currentStepId}
          isLast={index === allSteps.length - 1}
        />
      ))}
      {/* Indicador de início do fluxo */}
      <div className="relative pl-8 pb-4">
        <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-slate-300  bg-transparent" />
        <span className="text-[10px] font-bold text-slate-300  uppercase">
          Início do Fluxo
        </span>
      </div>
    </div>
  );
}
