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
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <div className="flex items-start justify-between gap-4">
        {/* Lado esquerdo: Título e informações */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Card
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{card.title}</h1>
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
                style={{ backgroundColor: currentStep.color }}
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {currentStep.title}
              </span>
            </div>
          )}
          <CardTagsSection cardId={card.id} flowId={card.flowId} />
        </div>

        {/* Lado direito: Pipeline de Estágios */}
        <div className="flex-shrink-0 flex-1 min-w-[200px] max-w-none overflow-visible">
          <CardPipelineStages 
            steps={steps} 
            currentStepId={card.stepId} 
            card={card} 
          />
        </div>

        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

