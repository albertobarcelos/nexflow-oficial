import { Plus, CheckCircle2, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn, hexToRgba } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { StepResponsibleSelector } from "@/components/crm/flows/StepResponsibleSelector";
import { SortableCard } from "./SortableCard";
import { ColumnDropZone } from "./ColumnDropZone";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { CardsByStepPaginated, StepCounts } from "../types";
import type { CardProduct } from "@/features/nexflow/card-details/types";

interface KanbanColumnProps {
  step: NexflowStepWithFields;
  columnData: CardsByStepPaginated[string] | undefined;
  /** Total em memória (cards carregados para esta etapa) */
  totalCards: number;
  /** Total no servidor (contagem por etapa); usado para exibir "X de Y" quando serverTotal > totalCards */
  serverTotal: number | null;
  hasMore: boolean;
  isStartColumn: boolean;
  flowId?: string;
  onNewCard: () => void;
  onCardClick: (card: NexflowCard) => void;
  draggedCardId: string | null;
  shakeCardId: string | null;
  celebratedCardId: string | null;
  confettiCardId: string | null;
  onLoadMore: (stepId: string) => void;
  isFetchingNextPage: boolean;
  getColorClasses: (hexColor: string) => { header: string; body: string; border: string };
}

export function KanbanColumn({
  step,
  columnData,
  totalCards,
  serverTotal,
  hasMore,
  isStartColumn,
  flowId,
  onNewCard,
  onCardClick,
  draggedCardId,
  shakeCardId,
  celebratedCardId,
  confettiCardId,
  onLoadMore,
  isFetchingNextPage,
  getColorClasses,
}: KanbanColumnProps) {
  const columnCards = columnData?.cards ?? [];
  const accentColor = step.color ?? "#2563eb";
  const colorClasses = getColorClasses(accentColor);
  const isCustomHeader = !colorClasses.header;

  // Calcular o valor total dos produtos da etapa
  const totalProductsValue = useMemo(() => {
    let total = 0;
    
    for (const card of columnCards) {
      const fieldValues = card.fieldValues as Record<string, unknown> | undefined;
      
      // Verificar se há produtos no formato novo (array de CardProduct)
      if (fieldValues?.products && Array.isArray(fieldValues.products)) {
        const products = fieldValues.products as CardProduct[];
        const cardTotal = products.reduce((sum, product) => {
          return sum + (product.totalValue || 0);
        }, 0);
        total += cardTotal;
      } 
      // Fallback: usar card.value se existir (formato antigo)
      else if (card.value && typeof card.value === 'number') {
        total += card.value;
      }
    }
    
    return total;
  }, [columnCards]);

  return (
    <div className="w-80 shrink-0 flex flex-col h-full min-h-0">
      <div
        className={cn(
          "rounded-t-2xl p-4 shadow-lg z-10 relative",
          colorClasses.header
        )}
        style={{
          ...(isCustomHeader ? { backgroundColor: accentColor } : {}),
          boxShadow: `0 10px 15px -3px ${hexToRgba(accentColor, 0.1)}, 0 4px 6px -2px ${hexToRgba(accentColor, 0.05)}`,
        }}
      >
        <div className="flex flex-col justify-between text-white mb-3">
        <h2 className="text-lg font-bold text-white mb-2 flex justify-between">
          <span className="truncate max-w-[250px]">
            {step.title}
            </span>
          {step.isCompletionStep && (
            <CheckCircle2 className="h-4 w-4 opacity-90" />
          )}
          <span> {flowId && (
            <StepResponsibleSelector step={step} flowId={flowId} />
          )}</span>
         
        </h2>
        
          <div className="flex items-center gap-2 justify-between">
          {totalProductsValue > 0 && (
          <div className="text-sm font-semibold text-white/90">
            {formatCurrency(totalProductsValue)}
          </div>
        )}
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium ">
            {serverTotal != null && serverTotal > totalCards
              ? `${totalCards} de ${serverTotal} cards`
              : `${totalCards} ${totalCards === 1 ? "card" : "cards"}`}
          </span>
          </div>
          
        </div>
        
        
      </div>
      <div
        className={cn(
          "flex-1 min-h-0 border-x border-b rounded-b-2xl p-3 overflow-y-auto custom-scrollbar",
          colorClasses.body,
          colorClasses.border
        )}
      >
        <ColumnDropZone stepId={step.id}>
          <SortableContext
            items={columnCards.map((card) => card.id)}
            strategy={verticalListSortingStrategy}
          >
            {columnCards.length === 0 ? (
              <div className="flex flex-col gap-3">
                <div className="h-full flex items-center justify-center text-neutral-400 text-sm italic min-h-[200px]">
                  Nenhum card aqui
                </div>
                {isStartColumn && (
                  <button
                    onClick={onNewCard}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 border-2 border-dashed border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 text-sm py-3 rounded-lg transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                    Novo card
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {columnCards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    onClick={() => onCardClick(card)}
                    stepId={step.id}
                    isActiveDrag={draggedCardId === card.id}
                    shouldShake={shakeCardId === card.id}
                    isCelebrating={celebratedCardId === card.id}
                    showConfetti={confettiCardId === card.id}
                    currentStep={step}
                  />
                ))}
                {isStartColumn && (
                  <button
                    onClick={onNewCard}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 border-2 border-dashed border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 text-sm py-3 rounded-lg transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                    Novo card
                  </button>
                )}
              </div>
            )}
          </SortableContext>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              onClick={() => onLoadMore(step.id)}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Carregando...
                </>
              ) : (
                `Carregar mais (${totalCards - columnCards.length} restantes)`
              )}
            </Button>
          )}
        </ColumnDropZone>
      </div>
    </div>
  );
}

