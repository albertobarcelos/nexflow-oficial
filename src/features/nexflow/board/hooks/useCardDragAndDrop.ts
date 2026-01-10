import { useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { CardsByStep } from "../types";

type CardUpdate = {
  id: string;
  stepId: string;
  position: number;
  status?: string;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  agents?: string[];
};

interface UseCardDragAndDropProps {
  cards: NexflowCard[];
  cardsByStep: CardsByStep;
  steps: NexflowStepWithFields[];
  setDraggedCardId: (id: string | null) => void;
  setActiveDragCard: (card: NexflowCard | null) => void;
  setShakeCardId: (id: string | null) => void;
  setVisibleCountPerStep: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  getVisibleCount: (stepId: string) => number;
  validateRequiredFields: (card: NexflowCard, fromStepId: string) => boolean;
  reorderCards: (updates: { items: CardUpdate[] }) => Promise<void>;
  triggerCelebration: (cardId: string) => void;
  onCardMoved?: (card: NexflowCard, updates: CardUpdate) => void;
  flowId?: string;
  queryClient: any;
}

export function useCardDragAndDrop({
  cards,
  cardsByStep,
  steps,
  setDraggedCardId,
  setActiveDragCard,
  setShakeCardId,
  setVisibleCountPerStep,
  getVisibleCount,
  validateRequiredFields,
  reorderCards,
  triggerCelebration,
  onCardMoved,
  flowId,
  queryClient,
}: UseCardDragAndDropProps) {
  const buildReorderUpdates = useCallback(
    (
      card: NexflowCard,
      targetStepId: string,
      targetIndexOverride?: number
    ) => {
      const sourceStepId = card.stepId;
      const sourceCards = cardsByStep[sourceStepId] ?? [];
      const destinationCards =
        targetStepId === sourceStepId
          ? sourceCards
          : cardsByStep[targetStepId] ?? [];

      const sourceIndex = sourceCards.findIndex((item) => item.id === card.id);
      let targetIndex =
        typeof targetIndexOverride === "number"
          ? targetIndexOverride
          : destinationCards.length;

      if (targetIndex < 0) {
        targetIndex = destinationCards.length;
      }

      if (targetStepId === sourceStepId) {
        const reordered = arrayMove([...destinationCards], sourceIndex, targetIndex);
        return {
          updates: reordered.map((item, index) => ({
            id: item.id,
            stepId: targetStepId,
            position: (index + 1) * 1000,
          })),
        };
      }

      const updatedSource = sourceCards.filter((item) => item.id !== card.id);
      const updatedDestination = [...destinationCards];
      const movedCard = { ...card, stepId: targetStepId };
      updatedDestination.splice(targetIndex, 0, movedCard);

      return {
        updates: [
          ...updatedSource.map((item, index) => ({
            id: item.id,
            stepId: sourceStepId,
            position: (index + 1) * 1000,
          })),
          ...updatedDestination.map((item, index) => ({
            id: item.id,
            stepId: targetStepId,
            position: (index + 1) * 1000,
          })),
        ],
      };
    },
    [cardsByStep]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = cards.find((item) => item.id === event.active.id);
    if (card) {
      setDraggedCardId(card.id);
      setActiveDragCard(card);
    }
  }, [cards, setDraggedCardId, setActiveDragCard]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDraggedCardId(null);
    setActiveDragCard(null);
    const { active, over } = event;
    if (!over) return;

    const card = cards.find((item) => item.id === active.id);
    if (!card) {
      return;
    }

    const overData = over.data?.current as { stepId?: string } | undefined;
    const overCard = cards.find((item) => item.id === over.id);
    const targetStepId =
      overData?.stepId ?? overCard?.stepId ?? card.stepId;

    if (!targetStepId) {
      return;
    }

    const movingAcrossSteps = targetStepId !== card.stepId;
    if (movingAcrossSteps) {
      const currentStepIndex = steps.findIndex((s) => s.id === card.stepId);
      const targetStepIndex = steps.findIndex((s) => s.id === targetStepId);
      const isMovingForward = targetStepIndex > currentStepIndex;

      if (isMovingForward) {
        const canMove = validateRequiredFields(card, card.stepId);
        if (!canMove) {
          const cardIdToShake = card.id;
          setShakeCardId(cardIdToShake);
          setTimeout(() => {
            setShakeCardId(null);
          }, 650);
          return;
        }
      }
    }

    const destinationCards = cardsByStep[targetStepId] ?? [];
    const targetIndex =
      overCard && overCard.id !== card.id
        ? destinationCards.findIndex((item) => item.id === overCard.id)
        : destinationCards.length;

    const { updates } = buildReorderUpdates(
      card,
      targetStepId,
      targetIndex
    );

    if (!updates.length) {
      return;
    }

    const movedAcrossSteps = card.stepId !== targetStepId;
    const targetStep = steps.find((s) => s.id === targetStepId);
    let newStatus: "inprogress" | "completed" | "canceled" = "inprogress";
    let shouldFreeze = false;
    
    if (targetStep) {
      if (targetStep.stepType === "finisher") {
        newStatus = "completed";
      } else if (targetStep.stepType === "fail") {
        newStatus = "canceled";
      } else if (targetStep.stepType === "freezing") {
        shouldFreeze = true;
        newStatus = "inprogress";
      } else if (targetStep.isCompletionStep) {
        newStatus = "completed";
      }
    }

    let assignedTo: string | null | undefined = undefined;
    let assignedTeamId: string | null | undefined = undefined;
    let agents: string[] | undefined = undefined;

    if (movingAcrossSteps && targetStep) {
      if (targetStep.responsibleUserId) {
        assignedTo = targetStep.responsibleUserId;
        assignedTeamId = null;
        const currentAgents = card.agents ?? [];
        if (!currentAgents.includes(targetStep.responsibleUserId)) {
          agents = [...currentAgents, targetStep.responsibleUserId];
        }
      } else if (targetStep.responsibleTeamId) {
        assignedTeamId = targetStep.responsibleTeamId;
        assignedTo = null;
      }
    }

    const updatesWithStatus = updates.map((update) => {
      if (update.id === card.id) {
        const cardUpdate: typeof update & {
          status?: string;
          assignedTo?: string | null;
          assignedTeamId?: string | null;
          agents?: string[];
        } = {
          ...update,
          status: newStatus,
        };

        if (movingAcrossSteps) {
          if (typeof assignedTo !== "undefined") {
            cardUpdate.assignedTo = assignedTo;
          }
          if (typeof assignedTeamId !== "undefined") {
            cardUpdate.assignedTeamId = assignedTeamId;
          }
          if (typeof agents !== "undefined") {
            cardUpdate.agents = agents;
          }
        }

        return cardUpdate;
      }
      return update;
    });

    if (movingAcrossSteps && targetStepId && !shouldFreeze) {
      const currentVisibleCount = getVisibleCount(targetStepId);
      const destinationCardsCount = (cardsByStep[targetStepId] ?? []).length;
      if (destinationCardsCount >= currentVisibleCount) {
        setVisibleCountPerStep((prev) => ({
          ...prev,
          [targetStepId]: Math.max(currentVisibleCount, destinationCardsCount + 1),
        }));
      }
    }

    await reorderCards({
      items: updatesWithStatus,
    });

    if (movingAcrossSteps && flowId) {
      void queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", "count-by-step", flowId] });
    }

    if (onCardMoved) {
      const movedCardUpdate = updatesWithStatus.find(u => u.id === card.id);
      if (movedCardUpdate && movingAcrossSteps) {
        onCardMoved(card, movedCardUpdate);
      }
    }

    if (movedAcrossSteps) {
      triggerCelebration(card.id);
    }
  }, [
    cards,
    cardsByStep,
    steps,
    setDraggedCardId,
    setActiveDragCard,
    setShakeCardId,
    setVisibleCountPerStep,
    getVisibleCount,
    validateRequiredFields,
    buildReorderUpdates,
    reorderCards,
    triggerCelebration,
    onCardMoved,
    flowId,
    queryClient,
  ]);

  const handleDragCancel = useCallback(() => {
    setDraggedCardId(null);
    setActiveDragCard(null);
  }, [setDraggedCardId, setActiveDragCard]);

  return {
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}

