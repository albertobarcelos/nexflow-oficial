import { motion } from "framer-motion";
import { DragOverlay } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCardPreview } from "./KanbanCardPreview";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { CardsByStepPaginated, StepCounts } from "../types";

interface KanbanViewProps {
  steps: NexflowStepWithFields[];
  cardsByStepPaginated: CardsByStepPaginated;
  stepCounts: StepCounts;
  startStep: NexflowStepWithFields | null;
  flowId?: string;
  draggedCardId: string | null;
  activeDragCard: NexflowCard | null;
  shakeCardId: string | null;
  celebratedCardId: string | null;
  confettiCardId: string | null;
  onNewCard: () => void;
  onCardClick: (card: NexflowCard) => void;
  onLoadMore: (stepId: string) => void;
  isFetchingNextPage: boolean;
  getColorClasses: (hexColor: string) => { header: string; body: string; border: string };
}

export function KanbanView({
  steps,
  cardsByStepPaginated,
  stepCounts,
  startStep,
  flowId,
  draggedCardId,
  activeDragCard,
  shakeCardId,
  celebratedCardId,
  confettiCardId,
  onNewCard,
  onCardClick,
  onLoadMore,
  isFetchingNextPage,
  getColorClasses,
}: KanbanViewProps) {
  return (
    <>
      <div className="flex h-full gap-6">
        {steps.map((step) => {
          const columnData = cardsByStepPaginated[step.id];
          // totalCards = total em memória para esta etapa (o que realmente temos carregado)
          const totalCards = columnData?.total ?? stepCounts[step.id] ?? 0;
          // total no servidor (contagem por etapa) para exibir "X de Y" quando ainda não carregamos tudo
          const serverTotal = stepCounts[step.id] ?? null;
          const hasMore = columnData?.hasMore ?? false;
          const isStartColumn = step.id === startStep?.id;
          return (
            <KanbanColumn
              key={step.id}
              step={step}
              columnData={columnData}
              totalCards={totalCards}
              serverTotal={serverTotal}
              hasMore={hasMore}
              isStartColumn={isStartColumn}
              flowId={flowId}
              onNewCard={onNewCard}
              onCardClick={onCardClick}
              draggedCardId={draggedCardId}
              shakeCardId={shakeCardId}
              celebratedCardId={celebratedCardId}
              confettiCardId={confettiCardId}
              onLoadMore={onLoadMore}
              isFetchingNextPage={isFetchingNextPage}
              getColorClasses={getColorClasses}
            />
          );
        })}
        <div className="w-6 shrink-0"></div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeDragCard ? (
          <motion.div
            className="w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl"
            initial={{ scale: 1 }}
            animate={{ scale: 1.03 }}
          >
            <KanbanCardPreview card={activeDragCard} />
          </motion.div>
        ) : null}
      </DragOverlay>
    </>
  );
}

