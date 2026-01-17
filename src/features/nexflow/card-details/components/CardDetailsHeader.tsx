import { X } from "lucide-react";
import { ContactFloatingWidget } from "@/components/crm/flows/ContactFloatingWidget";
import { IndicationFloatingWidget } from "@/components/crm/flows/IndicationFloatingWidget";
import { ParentCardWidget } from "@/components/crm/flows/ParentCardWidget";
import { CardTagsSection } from "./CardTagsSection";
import { CardPipelineStages } from "./CardPipelineStages";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";

interface CardDetailsHeaderProps {
  card: NexflowCard;
  currentStep: NexflowStepWithFields | null;
  steps: NexflowStepWithFields[];
  onClose: () => void;
  onOpenParentCard?: (card: NexflowCard) => void;
}

export function CardDetailsHeader({
  card,
  currentStep,
  steps,
  onClose,
  onOpenParentCard,
}: CardDetailsHeaderProps) {
  return (
    <div className="relative px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
      <div className="flex items-start justify-between gap-4">
        {/* Lado esquerdo: Título e informações */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            Card
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white truncate">{card.title}</h1>
            <ContactFloatingWidget contactId={card.contactId} />
            <IndicationFloatingWidget indicationId={card.indicationId} />
            <ParentCardWidget 
              parentCardId={card.parentCardId} 
              onOpenParentCard={onOpenParentCard}
            />
          </div>
          {currentStep && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentStep.color || "#10b981" }}
              />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {currentStep.title}
              </span>
            </div>
          )}
          <CardTagsSection cardId={card.id} flowId={card.flowId} />
        </div>

        {/* Lado direito: Pipeline de Estágios */}
        <div className="flex items-center justify-start gap-4 pr-12 overflow-visible pt-[26px]">
          <CardPipelineStages 
            steps={steps} 
            currentStepId={card.stepId} 
            card={card} 
          />
        </div>
      </div>
      
      {/* Botão de fechar no canto direito */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500 flex-shrink-0"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}

