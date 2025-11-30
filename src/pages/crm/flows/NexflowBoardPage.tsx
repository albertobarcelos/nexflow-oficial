import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, ArrowLeft } from "lucide-react";
import { StartFormModal, type StartFormPayload } from "@/components/crm/flows/StartFormModal";
import {
  CardDetailsModal,
  type CardFormValues,
} from "@/components/crm/flows/CardDetailsModal";
import { useNexflowFlow, type NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { useNexflowCardsInfinite } from "@/hooks/useNexflowCardsInfinite";
import type {
  CardMovementEntry,
  ChecklistProgressMap,
  NexflowCard,
  NexflowStepField,
} from "@/types/nexflow";
import { cn, getReadableTextColor, hexToRgba } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type ViewMode = "kanban" | "list";

export function NexflowBoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [activeCard, setActiveCard] = useState<NexflowCard | null>(null);
  const [isStartFormOpen, setIsStartFormOpen] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [activeDragCard, setActiveDragCard] = useState<NexflowCard | null>(null);
  const [shakeCardId, setShakeCardId] = useState<string | null>(null);
  const [celebratedCardId, setCelebratedCardId] = useState<string | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  // Estado de paginação virtual por coluna
  const VISIBLE_INCREMENT = 10;
  const [visibleCountPerStep, setVisibleCountPerStep] = useState<Record<string, number>>({});

  // Handler para voltar com invalidação de cache
  const handleGoBack = useCallback(() => {
    // Invalida o cache dos flows para forçar refetch ao voltar
    void queryClient.invalidateQueries({ queryKey: ["nexflow", "flows"] });
    navigate("/crm/flows");
  }, [queryClient, navigate]);

  const { flow, steps, isLoading } = useNexflowFlow(id);
  const {
    cards,
    isLoading: isLoadingCards,
    createCard,
    updateCard,
    deleteCard,
    reorderCards,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNexflowCardsInfinite(id);
  const startStep = steps[0] ?? null;

  // Função auxiliar para obter contagem visível de uma etapa
  const getVisibleCount = useCallback(
    (stepId: string) => visibleCountPerStep[stepId] ?? VISIBLE_INCREMENT,
    [visibleCountPerStep]
  );

  useEffect(() => {
    successAudioRef.current = new Audio("/sounds/success.mp3");
    if (successAudioRef.current) {
      successAudioRef.current.volume = 0.35;
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Cards agrupados por step com informações de paginação
  const cardsByStepPaginated = useMemo(() => {
    const result: Record<
      string,
      { cards: NexflowCard[]; total: number; hasMore: boolean }
    > = {};

    // Agrupar cards por step
    cards.forEach((card) => {
      if (!result[card.stepId]) {
        result[card.stepId] = { cards: [], total: 0, hasMore: false };
      }
      result[card.stepId].cards.push(card);
      result[card.stepId].total++;
    });

    // Ordenar e aplicar limite visível
    Object.keys(result).forEach((stepId) => {
      const entry = result[stepId];
      entry.cards.sort((a, b) => a.position - b.position);
      const visibleCount = getVisibleCount(stepId);
      entry.hasMore = entry.total > visibleCount;
      entry.cards = entry.cards.slice(0, visibleCount);
    });

    return result;
  }, [cards, getVisibleCount]);

  // Mantém cardsByStep para compatibilidade com código existente (usa todos os cards)
  const cardsByStep = useMemo(() => {
    const map: Record<string, NexflowCard[]> = {};
    cards.forEach((card) => {
      if (!map[card.stepId]) {
        map[card.stepId] = [];
      }
      map[card.stepId].push(card);
    });

    Object.values(map).forEach((column) =>
      column.sort((a, b) => a.position - b.position)
    );
    return map;
  }, [cards]);

  const triggerCelebration = useCallback(
    (cardId: string) => {
      setCelebratedCardId(cardId);
      try {
        if (successAudioRef.current) {
          successAudioRef.current.currentTime = 0;
          void successAudioRef.current.play();
        }
      } catch {
        // ignore autoplay restrictions
      }
      setTimeout(() => {
        setCelebratedCardId((current) => (current === cardId ? null : current));
      }, 1200);
    },
    []
  );

  const buildMovementEntry = useCallback(
    (card: NexflowCard, toStepId: string): CardMovementEntry => ({
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      fromStepId: card.stepId,
      toStepId,
      movedAt: new Date().toISOString(),
      movedBy: null,
    }),
    []
  );

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

      const movementHistory =
        targetStepId !== sourceStepId
          ? [...(card.movementHistory ?? []), buildMovementEntry(card, targetStepId)]
          : undefined;

      if (targetStepId === sourceStepId) {
        const reordered = arrayMove([...destinationCards], sourceIndex, targetIndex);
        return {
          updates: reordered.map((item, index) => ({
            id: item.id,
            stepId: targetStepId,
            position: (index + 1) * 1000,
            ...(movementHistory && item.id === card.id ? { movementHistory } : {}),
          })),
          movementHistory,
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
            ...(movementHistory && item.id === card.id ? { movementHistory } : {}),
          })),
        ],
        movementHistory,
      };
    },
    [buildMovementEntry, cardsByStep]
  );

  const subtaskCount = useMemo(() => {
    if (!activeCard) {
      return 0;
    }
    return cards.filter((item) => item.parentCardId === activeCard.id).length;
  }, [activeCard, cards]);

  const parentCardTitle = useMemo(() => {
    if (!activeCard?.parentCardId) {
      return null;
    }
    return cards.find((card) => card.id === activeCard.parentCardId)?.title ?? null;
  }, [activeCard, cards]);

  const handleSubmitStartForm = async (payload: StartFormPayload) => {
    if (!id || !startStep) {
      return;
    }
    await createCard({
      flowId: id,
      stepId: startStep.id,
      title: payload.title,
      fieldValues: payload.fieldValues,
      checklistProgress: payload.checklistProgress,
      movementHistory: payload.movementHistory,
    });
  };

  const handleValidateRequiredFields = useCallback(
    (card: NexflowCard, fromStepId: string): boolean => {
      const step = steps.find((item) => item.id === fromStepId);
      if (!step) {
        return true;
      }

      const requiredFields = step.fields?.filter(
        (field: NexflowStepField) => field.isRequired
      );
      if (!requiredFields || requiredFields.length === 0) {
        return true;
      }

      const missingLabels: string[] = [];

      requiredFields.forEach((field: NexflowStepField) => {
        const value = card.fieldValues?.[field.id];
        if (field.fieldType === "checklist") {
          const configItems = field.configuration.items ?? [];
          const progress = (card.checklistProgress?.[field.id] ??
            {}) as Record<string, boolean>;
          const allChecked = configItems.every(
            (item) => progress?.[item] === true
          );
          if (!allChecked) {
            missingLabels.push(`${field.label} (checklist incompleto)`);
          }
          return;
        }

        const isFilled =
          typeof value === "number" ||
          (typeof value === "string" && value.trim() !== "") ||
          (Array.isArray(value) && value.length > 0);

        if (!isFilled) {
          missingLabels.push(field.label);
        }
      });

      if (missingLabels.length > 0) {
        toast.error(
          `Complete os campos obrigatórios antes de avançar: ${missingLabels.join(
            ", "
          )}`
        );
        return false;
      }

      return true;
    },
    [steps]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((item) => item.id === event.active.id);
    if (card) {
      setDraggedCardId(card.id);
      setActiveDragCard(card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
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
      // Verificar se está avançando (targetStepId tem position maior)
      const currentStepIndex = steps.findIndex((s) => s.id === card.stepId);
      const targetStepIndex = steps.findIndex((s) => s.id === targetStepId);
      const isMovingForward = targetStepIndex > currentStepIndex;

      // Só validar campos obrigatórios ao avançar
      if (isMovingForward) {
        const canMove = handleValidateRequiredFields(card, card.stepId);
        if (!canMove) {
          setShakeCardId(card.id);
          setTimeout(() => {
            setShakeCardId((current) => (current === card.id ? null : current));
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

    const { updates, movementHistory } = buildReorderUpdates(
      card,
      targetStepId,
      targetIndex
    );

    if (!updates.length) {
      return;
    }

    await reorderCards({
      items: updates,
    });

    if (movementHistory) {
      triggerCelebration(card.id);
    }
  };

  const handleDragCancel = () => {
    setDraggedCardId(null);
    setActiveDragCard(null);
  };

  const handleSaveCardFields = async (
    card: NexflowCard,
    values: CardFormValues
  ) => {
    // Auto-save silencioso (sem toast)
    await updateCard({
      id: card.id,
      title: values.title.trim(),
      fieldValues: values.fields,
      checklistProgress: values.checklist as ChecklistProgressMap,
      silent: true,
    });

    // Atualiza o estado local do card ativo
    setActiveCard((current) =>
      current && current.id === card.id
        ? {
            ...current,
            title: values.title.trim(),
            fieldValues: values.fields,
            checklistProgress: values.checklist as ChecklistProgressMap,
          }
        : current
    );
  };

  const handleMoveCardForward = async (card: NexflowCard, values: CardFormValues) => {
    const currentIndex = steps.findIndex((step) => step.id === card.stepId);
    if (currentIndex < 0 || currentIndex === steps.length - 1) {
      toast.error("Não há próxima etapa configurada.");
      return;
    }

    const nextStep = steps[currentIndex + 1];
    
    // Salva os campos antes de mover (silencioso)
    await handleSaveCardFields(card, values);

    // Fecha o modal imediatamente (Optimistic UI)
    setActiveCard(null);

    // Constrói e executa a movimentação
    const { updates, movementHistory } = buildReorderUpdates(card, nextStep.id);
    if (!updates.length) {
      return;
    }

    await reorderCards({ items: updates });
    
    // Celebração após mover
    if (movementHistory) {
      triggerCelebration(card.id);
    }
  };

  // Handler para carregar mais cards em uma coluna específica
  const handleLoadMoreForStep = useCallback(
    (stepId: string) => {
      const current = visibleCountPerStep[stepId] ?? VISIBLE_INCREMENT;
      const stepTotal = cardsByStep[stepId]?.length ?? 0;

      // Se mostrar mais revelaria cards ainda não carregados, buscar mais
      if (current + VISIBLE_INCREMENT > stepTotal && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }

      setVisibleCountPerStep((prev) => ({
        ...prev,
        [stepId]: current + VISIBLE_INCREMENT,
      }));
    },
    [visibleCountPerStep, cardsByStep, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const isLoadingPage = isLoading || isLoadingCards;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-slate-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Execução do Flow
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              {flow?.name ?? "Flow"}
            </h1>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="p-4">
        {isLoadingPage ? (
          <div className="text-center text-slate-500 py-12">Carregando...</div>
        ) : viewMode === "list" ? (
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Título</th>
                    <th className="px-4 py-2">Etapa</th>
                    <th className="px-4 py-2">Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => {
                    const step = steps.find((item) => item.id === card.stepId);
                    return (
                      <tr
                        key={card.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setActiveCard(card)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {card.title}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {step?.title ?? "Etapa"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(card.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-4 overflow-x-auto pb-8">
              {steps.map((step) => {
                const columnData = cardsByStepPaginated[step.id];
                const columnCards = columnData?.cards ?? [];
                const totalCards = columnData?.total ?? 0;
                const hasMore = columnData?.hasMore ?? false;
                const accentColor = step.color ?? "#2563eb";
                const headerTextColor = getReadableTextColor(accentColor);
                const isDarkHeader = headerTextColor.toLowerCase() === "#ffffff";
                const columnBodyColor = hexToRgba(accentColor, 0.05);
                const isStartColumn = step.id === startStep?.id;
                return (
                  <div
                    key={step.id}
                    className="flex w-72 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-sm p-0"
                    style={{
                      minHeight: "calc(100vh - 220px)",
                      borderTop: `6px solid ${accentColor}`,
                    }}
                  >
                    <div
                      className="shrink-0 px-4 py-3"
                      style={{
                        backgroundColor: accentColor,
                        color: headerTextColor,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-[11px] uppercase tracking-wide opacity-80 flex items-center gap-2">
                            <span
                              className="inline-flex h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: headerTextColor, opacity: 0.75 }}
                            />
                            Etapa
                          </p>
                          <h3
                            className={cn(
                              "text-base font-semibold",
                              isDarkHeader ? "text-white" : "text-slate-900"
                            )}
                          >
                            {step.title}
                          </h3>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs opacity-80">
                            {totalCards} {totalCards === 1 ? "card" : "cards"}
                          </span>
                          {isStartColumn ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setIsStartFormOpen(true)}
                              className={cn(
                                "h-8 text-xs font-medium",
                                isDarkHeader
                                  ? "bg-white/20 text-white hover:bg-white/30"
                                  : "bg-slate-900/10 text-slate-900 hover:bg-slate-900/20"
                              )}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Novo card
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-3"
                      style={{ backgroundColor: columnBodyColor }}
                    >
                      <ColumnDropZone stepId={step.id}>
                        <SortableContext
                          items={columnCards.map((card) => card.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {columnCards.map((card) => (
                            <SortableCard
                              key={card.id}
                              card={card}
                              onClick={() => setActiveCard(card)}
                              stepId={step.id}
                              isActiveDrag={draggedCardId === card.id}
                              shouldShake={shakeCardId === card.id}
                              isCelebrating={celebratedCardId === card.id}
                            />
                          ))}
                        </SortableContext>
                        {hasMore && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700"
                            onClick={() => handleLoadMoreForStep(step.id)}
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
              })}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
              {activeDragCard ? (
                <motion.div
                  className="w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.03 }}
                >
                  <KanbanCardPreview card={activeDragCard} />
                </motion.div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <StartFormModal
        open={isStartFormOpen}
        step={startStep ?? null}
        onOpenChange={(open) => setIsStartFormOpen(open)}
        onSubmit={handleSubmitStartForm}
      />

      <CardDetailsModal
        card={activeCard}
        steps={steps}
        onClose={() => setActiveCard(null)}
        onSave={handleSaveCardFields}
        onMoveNext={handleMoveCardForward}
        onDelete={async (cardId) => {
          await deleteCard(cardId);
          setActiveCard(null); // Fecha o modal após deletar
        }}
        onUpdateCard={async (input) => {
          await updateCard({
            id: input.id,
            stepId: input.stepId,
            movementHistory: input.movementHistory,
          });
        }}
        subtaskCount={subtaskCount}
        parentTitle={parentCardTitle}
      />
    </div>
  );
}

interface SortableCardProps {
  card: NexflowCard;
  onClick: () => void;
  stepId: string;
  isActiveDrag: boolean;
  shouldShake: boolean;
  isCelebrating: boolean;
}

function SortableCard({
  card,
  onClick,
  stepId,
  isActiveDrag,
  shouldShake,
  isCelebrating,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { stepId } });

  const appliedStyle = {
    transition,
  };

  const baseTransform = transform ? CSS.Transform.toString(transform) : "";
  const transformed = isDragging
    ? `${baseTransform} scale(1.03) rotate(-2deg)`
    : baseTransform;

  const animateProps = {
    boxShadow: isDragging
      ? "0px 22px 45px rgba(15,23,42,0.25)"
      : "0px 6px 18px rgba(15,23,42,0.08)",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={
        {
          ...(appliedStyle as React.CSSProperties),
          transform: transformed,
        } as React.CSSProperties
      }
      {...attributes}
      {...listeners}
      layoutId={card.id}
      animate={animateProps}
      transition={{
        duration: shouldShake ? 0.45 : 0.2,
        type: shouldShake ? "tween" : "spring",
        stiffness: 260,
        damping: 20,
      }}
      className={cn(
        "relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition",
        isActiveDrag ? "opacity-40" : "opacity-100",
        shouldShake ? "ring-2 ring-red-300 bg-red-50/60" : "hover:border-slate-300"
      )}
      onClick={onClick}
    >
      <KanbanCardPreview card={card} />

      <AnimatePresence>
        {isCelebrating ? <CardCelebrationSparkles /> : null}
      </AnimatePresence>
    </motion.div>
  );
}

function KanbanCardPreview({ card }: { card: NexflowCard }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{card.title}</p>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {new Date(card.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Atualizado em{" "}
        {new Date(card.createdAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </>
  );
}

function CardCelebrationSparkles() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-300/60"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: [0, 1, 0], scale: [0.85, 1.15, 1.35] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-200/30 via-transparent to-sky-200/30 blur-sm" />
      <motion.span
        className="absolute right-4 top-3 h-1.5 w-1.5 rounded-full bg-white"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.8 }}
      />
      <motion.span
        className="absolute left-4 bottom-4 h-2 w-2 rounded-full bg-white/80"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.9, delay: 0.1 }}
      />
    </motion.div>
  );
}

function ColumnDropZone({
  stepId,
  children,
}: {
  stepId: string;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `column-${stepId}`,
    data: { stepId },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-1 flex-col gap-2"
      style={{ minHeight: "calc(100vh - 360px)" }}
    >
      {children}
    </div>
  );
}

export default NexflowBoardPage;

