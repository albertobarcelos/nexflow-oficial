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
import { Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { StartFormModal, type StartFormPayload } from "@/components/crm/flows/StartFormModal";
import {
  CardDetailsModal,
  type CardFormValues,
} from "@/components/crm/flows/CardDetailsModal";
import { useNexflowFlow, type NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { useNexflowCardsInfinite } from "@/hooks/useNexflowCardsInfinite";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import type {
  CardMovementEntry,
  ChecklistProgressMap,
  NexflowCard,
  NexflowStepField,
  StepFieldValueMap,
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
      assignedTo: payload.assignedTo,
      agents: payload.agents,
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

    // Verificar se a etapa de destino é uma etapa de conclusão
    const targetStep = steps.find((s) => s.id === targetStepId);
    const newStatus = targetStep?.isCompletionStep ? "completed" : "inprogress";

    // Adicionar status aos updates do card que está sendo movido
    const updatesWithStatus = updates.map((update) => {
      if (update.id === card.id) {
        return {
          ...update,
          status: newStatus,
        };
      }
      return update;
    });

    await reorderCards({
      items: updatesWithStatus,
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
    // Usar a mesma abordagem do checklistProgress - sempre incluir assignedTo, assignedTeamId e agents
    const updatePayload: {
      id: string;
      title: string;
      fieldValues: StepFieldValueMap;
      checklistProgress: ChecklistProgressMap;
      assignedTo?: string | null;
      assignedTeamId?: string | null;
      agents?: string[];
      silent: boolean;
    } = {
      id: card.id,
      title: values.title.trim(),
      fieldValues: values.fields,
      checklistProgress: values.checklist as ChecklistProgressMap,
      silent: true,
    };
    
    // Sempre incluir assignedTo (mesmo que seja null ou undefined)
    // Converter undefined para null para garantir que seja enviado
    updatePayload.assignedTo = values.assignedTo ?? null;
    
    // Sempre incluir assignedTeamId (mesmo que seja null ou undefined)
    updatePayload.assignedTeamId = values.assignedTeamId ?? null;
    
    // Sempre incluir agents (mesmo que seja array vazio)
    updatePayload.agents = values.agents ?? [];
    
    await updateCard(updatePayload);

    // Atualiza o estado local do card ativo
    const assigneeType = values.assignedTo ? 'user' : values.assignedTeamId ? 'team' : 'unassigned';
    setActiveCard((current) =>
      current && current.id === card.id
        ? {
            ...current,
            title: values.title.trim(),
            fieldValues: values.fields,
            checklistProgress: values.checklist as ChecklistProgressMap,
            assignedTo: values.assignedTo ?? null,
            assignedTeamId: values.assignedTeamId ?? null,
            assigneeType: assigneeType,
            agents: values.agents ?? [],
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

  // Função auxiliar para obter classes de cor Tailwind baseadas na cor hex
  const getColorClasses = (hexColor: string) => {
    // Mapeia cores comuns para classes Tailwind
    const colorMap: Record<string, { header: string; body: string; border: string }> = {
      "#2563eb": { header: "bg-blue-600 dark:bg-blue-700", body: "bg-blue-50/50 dark:bg-slate-900/50", border: "border-blue-100 dark:border-slate-800" },
      "#0ea5e9": { header: "bg-sky-600 dark:bg-sky-700", body: "bg-sky-50/50 dark:bg-slate-900/50", border: "border-sky-100 dark:border-slate-800" },
      "#14b8a6": { header: "bg-teal-500 dark:bg-teal-600", body: "bg-teal-50/50 dark:bg-slate-900/50", border: "border-teal-100 dark:border-slate-800" },
      "#f97316": { header: "bg-orange-500 dark:bg-orange-600", body: "bg-orange-50/50 dark:bg-slate-900/50", border: "border-orange-100 dark:border-slate-800" },
      "#ec4899": { header: "bg-pink-500 dark:bg-pink-600", body: "bg-pink-50/50 dark:bg-slate-900/50", border: "border-pink-100 dark:border-slate-800" },
      "#8b5cf6": { header: "bg-purple-600 dark:bg-purple-700", body: "bg-purple-50/50 dark:bg-slate-900/50", border: "border-purple-100 dark:border-slate-800" },
      "#22c55e": { header: "bg-green-500 dark:bg-green-600", body: "bg-green-50/50 dark:bg-slate-900/50", border: "border-green-100 dark:border-slate-800" },
      "#f59e0b": { header: "bg-amber-500 dark:bg-amber-600", body: "bg-amber-50/50 dark:bg-slate-900/50", border: "border-amber-100 dark:border-slate-800" },
      "#ef4444": { header: "bg-red-500 dark:bg-red-600", body: "bg-red-50/50 dark:bg-slate-900/50", border: "border-red-100 dark:border-slate-800" },
      "#6366f1": { header: "bg-indigo-600 dark:bg-indigo-700", body: "bg-indigo-50/50 dark:bg-slate-900/50", border: "border-indigo-100 dark:border-slate-800" },
    };
    
    const normalized = hexColor.toLowerCase();
    return colorMap[normalized] || colorMap["#2563eb"];
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-sans h-screen flex flex-col overflow-hidden transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight italic">NEXFLOW</span>
            <span className="text-xl font-light text-slate-500 dark:text-slate-400">CRM</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <TabsTrigger 
                value="kanban"
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                  viewMode === "kanban"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                Kanban
              </TabsTrigger>
              <TabsTrigger 
                value="list"
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900/50 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Execução do Flow</div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {flow?.name ?? "Flow"}
            </h1>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar bg-slate-50 dark:bg-slate-950">
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
            <div className="flex h-full gap-6">
              {steps.map((step) => {
                const columnData = cardsByStepPaginated[step.id];
                const columnCards = columnData?.cards ?? [];
                const totalCards = columnData?.total ?? 0;
                const hasMore = columnData?.hasMore ?? false;
                const accentColor = step.color ?? "#2563eb";
                const headerTextColor = getReadableTextColor(accentColor);
                const isDarkHeader = headerTextColor.toLowerCase() === "#ffffff";
                const colorClasses = getColorClasses(accentColor);
                const isStartColumn = step.id === startStep?.id;
                
                return (
                  <div
                    key={step.id}
                    className="w-80 shrink-0 flex flex-col h-full"
                  >
                    <div
                      className={cn(
                        "rounded-t-2xl p-4 shadow-lg z-10 relative",
                        colorClasses.header
                      )}
                      style={{
                        boxShadow: `0 10px 15px -3px ${hexToRgba(accentColor, 0.1)}, 0 4px 6px -2px ${hexToRgba(accentColor, 0.05)}`,
                      }}
                    >
                      <div className="flex items-center justify-between text-white mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                          <span className="text-xs font-semibold uppercase tracking-wide opacity-90">Etapa</span>
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                          {totalCards} {totalCards === 1 ? "card" : "cards"}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        {step.title}
                        {step.isCompletionStep && (
                          <CheckCircle2 className="h-4 w-4 opacity-90" />
                        )}
                      </h2>
                      {isStartColumn && (
                        <button
                          onClick={() => setIsStartFormOpen(true)}
                          className="w-full mt-2 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
                        >
                          <Plus className="h-4 w-4" />
                          Novo card
                        </button>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex-1 border-x border-b rounded-b-2xl p-3 overflow-y-auto custom-scrollbar",
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
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                              Nenhum card aqui
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
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
                            </div>
                          )}
                        </SortableContext>
                        {hasMore && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
              <div className="w-6 shrink-0"></div>
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
        "relative cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition-all group",
        isActiveDrag ? "opacity-40" : "opacity-100",
        shouldShake 
          ? "ring-2 ring-red-300 bg-red-50/60" 
          : "hover:shadow-md hover:-translate-y-0.5"
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
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  
  const assignedUser = card.assignedTo
    ? users.find((user) => user.id === card.assignedTo)
    : null;
  
  const assignedTeam = card.assignedTeamId
    ? teams.find((team) => team.id === card.assignedTeamId)
    : null;

  // Extrair descrição dos fieldValues se houver um campo de descrição
  const description = useMemo(() => {
    // Procura por campos de texto longo que possam ser descrição
    // Isso é uma heurística - pode ser ajustado conforme necessário
    return null;
  }, [card.fieldValues]);

  const createdAt = new Date(card.createdAt);
  const updatedAt = createdAt; // Usar createdAt como fallback já que updatedAt não existe no tipo

  return (
    <>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
          {card.title}
        </h3>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {createdAt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}
        </span>
      </div>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
          {description}
        </p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400">Atualizado</span>
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {updatedAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {assignedUser ? (
          <div className="flex items-center gap-2" title={`${assignedUser.name} ${assignedUser.surname}`}>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {assignedUser.name.split(" ")[0]}
            </span>
            <div className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-700 bg-slate-100 overflow-hidden">
              <UserAvatar
                user={{
                  name: assignedUser.name,
                  surname: assignedUser.surname,
                  avatar_type: assignedUser.avatar_type,
                  avatar_seed: assignedUser.avatar_seed,
                  custom_avatar_url: assignedUser.custom_avatar_url,
                  avatar_url: assignedUser.avatar_url,
                }}
                size="sm"
                className="w-full h-full"
              />
            </div>
          </div>
        ) : assignedTeam ? (
          <div className="flex items-center gap-2" title={assignedTeam.name}>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {assignedTeam.name}
            </span>
            <div className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-700 bg-slate-100 overflow-hidden">
              <TeamAvatar
                team={{
                  id: assignedTeam.id,
                  name: assignedTeam.name,
                }}
                size="sm"
                className="w-full h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2" title="Sem responsável">
            <span className="text-xs text-slate-400 italic">--</span>
          </div>
        )}
      </div>
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

