import { X } from "lucide-react";
import { ContactFloatingWidget } from "@/components/crm/flows/ContactFloatingWidget";
import { IndicationFloatingWidget } from "@/components/crm/flows/IndicationFloatingWidget";
import { ParentCardWidget } from "@/components/crm/flows/ParentCardWidget";
import { CardAssigneeButton } from "./CardAssigneeButton";
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
  assignedTo: string | null;
  onAssignChange: (userId: string | null) => void;
  isDisabled?: boolean;
}

export function CardDetailsHeader({
  card,
  currentStep,
  steps,
  onClose,
  onOpenParentCard,
  assignedTo,
  onAssignChange,
  isDisabled = false,
}: CardDetailsHeaderProps) {
  return (
    <div className="relative px-6 py-6 border-b border-slate-100  shrink-0">
      <div className="flex items-start justify-between gap-2">
        {/* Lado esquerdo: Título e informações */}
        <div className="flex-1 min-w-0">
          <div className="flex-col items-start justify-center">
            <div className="flex-col items-center justify-center">
              {currentStep && (
                <div className="flex items-center gap-2">
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: currentStep.color || "#10b981" }}
                  />
                  <span className="text-xs font-medium text-slate-500 ">
                    {currentStep.title}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-500  truncate">
                  {card.title}
                </h1>
                <CardAssigneeButton
                  assignedTo={assignedTo}
                  onAssignChange={onAssignChange}
                  isDisabled={isDisabled}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <ContactFloatingWidget contactId={card.contactId} />
                <IndicationFloatingWidget indicationId={card.indicationId} />
                <ParentCardWidget
                  parentCardId={card.parentCardId}
                  onOpenParentCard={onOpenParentCard}
                />
              </div>
            </div>
          </div>

          <CardTagsSection cardId={card.id} flowId={card.flowId} />
        </div>

        {/* Lado direito: Pipeline de Estágios (janela de 3 etapas, compacto) */}
        <div className="flex items-center justify-start gap-4 pr-12 min-w-0 overflow-hidden pt-[22px]">
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
        className="absolute top-6 right-6 p-2 hover:bg-slate-100 :bg-slate-800 rounded-full transition-colors text-slate-400  flex-shrink-0"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}
