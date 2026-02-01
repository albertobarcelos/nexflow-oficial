import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CardDetailsModal, type CardFormValues } from "@/features/nexflow/card-details/components/CardDetailsModal";
import { NewCardWizard, type NewCardWizardResult } from "./NewCardWizard";
import { buildCreateCardInputFromWizard } from "../utils/buildCreateCardInputFromWizard";
import { useNexflowFlow } from "@/hooks/useNexflowFlows";
import { useNexflowCardsInfinite } from "@/hooks/useNexflowCardsInfinite";
import { nexflowClient } from "@/lib/supabase";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { BoardHeader } from "./BoardHeader";
import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { useCardDragAndDrop } from "../hooks/useCardDragAndDrop";
import { useBoardSearch } from "../hooks/useBoardSearch";
import { getColorClasses } from "../utils/colorUtils";
import { useWilliamMode } from "@/hooks/useWilliamMode";
import type { ViewMode, CardsByStep, CardsByStepPaginated, StepCounts } from "../types";
import type { NexflowCard, ChecklistProgressMap, StepFieldValueMap } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";

const VISIBLE_INCREMENT = 10;
const LIST_PAGE_SIZE = 20;

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
  const [confettiCardId, setConfettiCardId] = useState<string | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoLoadedAllCardsRef = useRef<string | null>(null);
  const { isEnabled: williamModeEnabled } = useWilliamMode();
  const [visibleCountPerStep, setVisibleCountPerStep] = useState<Record<string, number>>({});
  const [listPage, setListPage] = useState(1);
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [filterTeamId, setFilterTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [serverSearchResults, setServerSearchResults] = useState<NexflowCard[]>([]);
  const [isSearchingOnServer, setIsSearchingOnServer] = useState<boolean>(false);

  const handleGoBack = useCallback(() => {
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
    searchCardsOnServer,
  } = useNexflowCardsInfinite(id, {
    assignedTo: filterUserId,
    assignedTeamId: filterTeamId,
  });

  const { data: stepCounts = {} } = useQuery<StepCounts>({
    queryKey: ["nexflow", "cards", "count-by-step", id, filterUserId, filterTeamId],
    queryFn: async (): Promise<StepCounts> => {
      if (!id || steps.length === 0) return {};

      const client = nexflowClient();
      const counts: StepCounts = {};

      await Promise.all(
        steps.map(async (step) => {
          let query = client
            .from("cards")
            .select("*", { count: "exact", head: true })
            .eq("flow_id", id)
            .eq("step_id", step.id);

          if (filterUserId !== null && filterUserId !== undefined) {
            query = query.eq("assigned_to", filterUserId);
          }
          if (filterTeamId !== null && filterTeamId !== undefined) {
            query = query.eq("assigned_team_id", filterTeamId);
          }

          const { count, error } = await query;

          if (error) {
            console.error(`Erro ao contar cards da etapa ${step.id}:`, error);
            counts[step.id] = 0;
          } else {
            counts[step.id] = count ?? 0;
          }
        })
      );

      return counts;
    },
    enabled: Boolean(id) && !isLoading && steps.length > 0,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const startStep = steps[0] ?? null;
  const { searchCards } = useBoardSearch();

  useEffect(() => {
    successAudioRef.current = new Audio("/sounds/success.mp3");
    if (successAudioRef.current) {
      successAudioRef.current.volume = 0.35;
    }
    confettiAudioRef.current = new Audio("/sounds/confetti-pop-sound-effect.mp3");
    if (confettiAudioRef.current) {
      confettiAudioRef.current.volume = 0.5;
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const filteredCards = useMemo(() => {
    if (filterUserId === null && filterTeamId === null) {
      return cards;
    }
    
    return cards.filter((card) => {
      if (filterUserId !== null) {
        if (card.assignedTo !== filterUserId) {
          return false;
        }
      }

      if (filterTeamId !== null) {
        if (card.assignedTeamId !== filterTeamId) {
          return false;
        }
      }

      return true;
    });
  }, [cards, filterUserId, filterTeamId]);

  const cardsByStep: CardsByStep = useMemo(() => {
    const map: CardsByStep = {};
    filteredCards.forEach((card) => {
      if (!map[card.stepId]) {
        map[card.stepId] = [];
      }
      map[card.stepId].push(card);
    });

    Object.values(map).forEach((column) =>
      column.sort((a, b) => a.position - b.position)
    );
    return map;
  }, [filteredCards]);

  const getVisibleCount = useCallback(
    (stepId: string) => visibleCountPerStep[stepId] ?? VISIBLE_INCREMENT,
    [visibleCountPerStep]
  );

  const cardsByStepPaginated: CardsByStepPaginated = useMemo(() => {
    const result: CardsByStepPaginated = {};

    filteredCards.forEach((card) => {
      if (!result[card.stepId]) {
        result[card.stepId] = { cards: [], total: 0, hasMore: false };
      }
      result[card.stepId].cards.push(card);
    });

    Object.keys(result).forEach((stepId) => {
      const entry = result[stepId];
      entry.cards.sort((a, b) => a.position - b.position);
      
      if (searchQuery.trim()) {
        const localResults = searchCards(entry.cards, searchQuery, users, teams);
        const serverResultsForStep = serverSearchResults.filter(
          (card) => card.stepId === stepId
        );
        
        const combinedResults = [...localResults];
        const localIds = new Set(localResults.map(c => c.id));
        
        serverResultsForStep.forEach((serverCard) => {
          if (!localIds.has(serverCard.id)) {
            combinedResults.push(serverCard);
          }
        });
        
        entry.cards = combinedResults;
      }
      
      entry.total = entry.cards.length;
      const visibleCount = getVisibleCount(stepId);
      entry.hasMore = entry.total > visibleCount;
      entry.cards = entry.cards.slice(0, visibleCount);
    });

    // Garantir entrada para toda etapa do flow: etapas sem cards em memória
    // (por paginação global) têm total do stepCounts e hasMore true para exibir "Carregar mais"
    steps.forEach((step) => {
      if (result[step.id] === undefined) {
        const count = stepCounts[step.id] ?? 0;
        result[step.id] = {
          cards: [],
          total: count,
          hasMore: count > 0,
        };
      }
    });

    return result;
  }, [filteredCards, getVisibleCount, searchQuery, searchCards, serverSearchResults, users, teams, steps, stepCounts]);

  const listViewCards = useMemo(() => {
    let result: NexflowCard[] = [];

    if (searchQuery.trim()) {
      const localResults = searchCards(filteredCards, searchQuery, users, teams);
      const localIds = new Set(localResults.map(c => c.id));
      const serverResults = serverSearchResults.filter(
        (card) => !localIds.has(card.id)
      );
      result = [...localResults, ...serverResults];
    } else {
      result = [...filteredCards];
    }

    result.sort((a, b) => {
      const stepA = steps.find((s) => s.id === a.stepId);
      const stepB = steps.find((s) => s.id === b.stepId);
      const stepPositionA = stepA?.position ?? 0;
      const stepPositionB = stepB?.position ?? 0;
      
      if (stepPositionA !== stepPositionB) {
        return stepPositionA - stepPositionB;
      }
      
      return a.position - b.position;
    });

    return result;
  }, [filteredCards, searchQuery, searchCards, serverSearchResults, steps, users, teams]);

  useEffect(() => {
    setListPage(1);
  }, [searchQuery, filterUserId, filterTeamId]);

  useEffect(() => {
    if (viewMode === "list" && hasNextPage && !isFetchingNextPage) {
      const currentPageEnd = listPage * LIST_PAGE_SIZE;
      if (listViewCards.length < currentPageEnd && listViewCards.length < 1000) {
        void fetchNextPage();
      }
    }
  }, [viewMode, hasNextPage, isFetchingNextPage, listViewCards.length, listPage, fetchNextPage]);

  const paginatedListViewCards = useMemo(() => {
    const startIndex = (listPage - 1) * LIST_PAGE_SIZE;
    const endIndex = startIndex + LIST_PAGE_SIZE;
    return listViewCards.slice(startIndex, endIndex);
  }, [listViewCards, listPage]);

  const totalListPages = Math.ceil(listViewCards.length / LIST_PAGE_SIZE);

  const triggerCelebration = useCallback(
    (cardId: string, status?: "inprogress" | "completed" | "canceled") => {
      const isCompleted = status === "completed";
      const shouldUseWilliamMode = williamModeEnabled && isCompleted;

      if (shouldUseWilliamMode) {
        // Modo William: confetti e som especial
        setConfettiCardId(cardId);
        try {
          if (confettiAudioRef.current) {
            confettiAudioRef.current.currentTime = 0;
            void confettiAudioRef.current.play();
          }
        } catch {
          // ignore autoplay restrictions
        }
        setTimeout(() => {
          setConfettiCardId((current) => (current === cardId ? null : current));
        }, 2000);
      } else {
        // Celebração padrão: sparkles e som de success
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
      }
    },
    [williamModeEnabled]
  );

  const handleValidateRequiredFields = useCallback(
    (card: NexflowCard, fromStepId: string): boolean => {
      const step = steps.find((item) => item.id === fromStepId);
      if (!step) {
        return true;
      }

      const requiredFields = step.fields?.filter(
        (field) => field.isRequired
      );
      if (!requiredFields || requiredFields.length === 0) {
        return true;
      }

      const missingLabels: string[] = [];

      requiredFields.forEach((field) => {
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

  const { handleDragStart, handleDragEnd, handleDragCancel } = useCardDragAndDrop({
    cards,
    cardsByStep,
    steps,
    setDraggedCardId,
    setActiveDragCard,
    setShakeCardId,
    setVisibleCountPerStep,
    getVisibleCount,
    validateRequiredFields: handleValidateRequiredFields,
    reorderCards,
    triggerCelebration,
    onCardMoved: (card, updates) => {
      if (activeCard && activeCard.id === card.id) {
        setActiveCard((current) => {
          if (!current || current.id !== card.id) return current;
          return {
            ...current,
            stepId: updates.stepId,
            assignedTo: typeof updates.assignedTo !== "undefined" ? updates.assignedTo : current.assignedTo,
            assignedTeamId: typeof updates.assignedTeamId !== "undefined" ? updates.assignedTeamId : current.assignedTeamId,
            agents: typeof updates.agents !== "undefined" ? updates.agents : current.agents,
            status: typeof updates.status !== "undefined" ? updates.status : current.status,
          };
        });
      }
    },
    flowId: id,
    queryClient,
  });

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

  const handleWizardSuccess = async (data: NewCardWizardResult) => {
    if (!id || !startStep) return;
    const input = buildCreateCardInputFromWizard(data, id, startStep.id);
    await createCard(input);
    void queryClient.invalidateQueries({
      queryKey: ["nexflow", "cards", "count-by-step", id],
    });
  };

  const handleSaveCardFields = async (
    card: NexflowCard,
    values: CardFormValues
  ) => {
    // Preparar fieldValues incluindo produtos se existirem
    const fieldValues: StepFieldValueMap = { ...values.fields };
    if (values.products && values.products.length > 0) {
      fieldValues.products = values.products as any;
    }

    const updatePayload: {
      id: string;
      title: string;
      fieldValues: StepFieldValueMap;
      checklistProgress: ChecklistProgressMap;
      assignedTo?: string | null;
      assignedTeamId?: string | null;
      agents?: string[];
      product?: string | null;
      value?: number | null;
      silent: boolean;
    } = {
      id: card.id,
      title: values.title.trim(),
      fieldValues: fieldValues,
      checklistProgress: values.checklist as ChecklistProgressMap,
      silent: true,
    };
    
    updatePayload.assignedTo = values.assignedTo ?? null;
    updatePayload.assignedTeamId = values.assignedTeamId ?? null;
    updatePayload.agents = values.agents ?? [];
    
    // Manter compatibilidade: product será o primeiro produto, value será a soma total
    if (values.products && values.products.length > 0) {
      updatePayload.product = values.products[0].itemId;
      updatePayload.value = values.products.reduce((sum, p) => sum + (p.totalValue || 0), 0);
    } else {
      if (values.product !== undefined) updatePayload.product = values.product;
      if (values.value !== undefined) updatePayload.value = values.value;
    }
    
    const result = await updateCard(updatePayload);

    // Atualizar activeCard com o card retornado do servidor (que inclui produtos em fieldValues)
    if (result?.card) {
      setActiveCard((current) =>
        current && current.id === card.id ? result.card : current
      );
    } else {
      // Fallback: atualizar manualmente se não houver card retornado
      const assigneeType = values.assignedTo ? 'user' : values.assignedTeamId ? 'team' : 'unassigned';
      setActiveCard((current) =>
        current && current.id === card.id
          ? {
              ...current,
              title: values.title.trim(),
              fieldValues: fieldValues, // Incluir produtos aqui
              checklistProgress: values.checklist as ChecklistProgressMap,
              assignedTo: values.assignedTo ?? null,
              assignedTeamId: values.assignedTeamId ?? null,
              assigneeType: assigneeType,
              agents: values.agents ?? [],
              product: values.product ?? null,
              value: values.value ?? null,
            }
          : current
      );
    }
  };

  const handleMoveCardForward = async (card: NexflowCard, values: CardFormValues) => {
    const currentIndex = steps.findIndex((step) => step.id === card.stepId);
    if (currentIndex < 0 || currentIndex === steps.length - 1) {
      toast.error("Não há próxima etapa configurada.");
      return;
    }

    const nextStep = steps[currentIndex + 1];
    
    await handleSaveCardFields(card, values);
    setActiveCard(null);

    const destinationCards = cardsByStep[nextStep.id] ?? [];
    const targetIndex = destinationCards.length;

    // Determinar o status baseado no tipo de etapa
    let newStatus: "inprogress" | "completed" | "canceled" = "inprogress";
    if (nextStep.stepType === "finisher" || nextStep.isCompletionStep) {
      newStatus = "completed";
    } else if (nextStep.stepType === "fail") {
      newStatus = "canceled";
    }

    const reordered = [...destinationCards, { ...card, stepId: nextStep.id }];
    const updates = reordered.map((item, index) => ({
      id: item.id,
      stepId: nextStep.id,
      position: (index + 1) * 1000,
      status: item.id === card.id ? newStatus : undefined,
    }));

    await reorderCards({ items: updates });
    
    void queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", "count-by-step", id] });
    triggerCelebration(card.id, newStatus);
  };

  const handleLoadMoreForStep = useCallback(
    async (stepId: string) => {
      const current = visibleCountPerStep[stepId] ?? VISIBLE_INCREMENT;
      setVisibleCountPerStep((prev) => ({
        ...prev,
        [stepId]: current + VISIBLE_INCREMENT,
      }));

      if (hasNextPage && !isFetchingNextPage) {
        await fetchNextPage();
      }
    },
    [visibleCountPerStep, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleLoadAllCards = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
      const queryData = queryClient.getQueryData<{
        pages: Array<{ cards: NexflowCard[]; nextPage: number | null }>;
        pageParams: number[];
      }>(["nexflow", "cards", "infinite", id, filterUserId, filterTeamId]);

      const lastPage = queryData?.pages[queryData.pages.length - 1];
      const stillHasNext =
        lastPage?.nextPage !== null && lastPage?.nextPage !== undefined;

      if (!stillHasNext) {
        break;
      }

      await fetchNextPage();
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }, [queryClient, id, filterUserId, filterTeamId, fetchNextPage]);

  // Ao abrir o board, carregar todas as páginas de cards para que etapas com
  // contagem no servidor já exibam seus cards (evita colunas "57 cards" vazias)
  useEffect(() => {
    if (
      !id ||
      isLoading ||
      isLoadingCards ||
      steps.length === 0 ||
      hasAutoLoadedAllCardsRef.current === id
    ) {
      return;
    }

    const hasStepWithCountButNoCards = steps.some((step) => {
      const count = stepCounts[step.id] ?? 0;
      const inMemory = filteredCards.filter((c) => c.stepId === step.id).length;
      return count > 0 && inMemory === 0;
    });

    if (!hasStepWithCountButNoCards || !hasNextPage) {
      return;
    }

    hasAutoLoadedAllCardsRef.current = id;
    void handleLoadAllCards();
  }, [
    id,
    isLoading,
    isLoadingCards,
    steps,
    stepCounts,
    filteredCards,
    hasNextPage,
    handleLoadAllCards,
  ]);

  const isLoadingPage = isLoading || isLoadingCards;

  return (
    <div className={cn(
      "min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 font-sans flex flex-col transition-colors duration-200",
      viewMode === "list" ? "h-auto min-h-screen" : "h-screen overflow-hidden"
    )}>
      <BoardHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onGoBack={handleGoBack}
        flowName={flow?.name}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchingOnServer={isSearchingOnServer}
        setIsSearchingOnServer={setIsSearchingOnServer}
        serverSearchResults={serverSearchResults}
        setServerSearchResults={setServerSearchResults}
        searchCardsOnServer={searchCardsOnServer}
        steps={steps}
        filterUserId={filterUserId}
        filterTeamId={filterTeamId}
        setFilterUserId={setFilterUserId}
        setFilterTeamId={setFilterTeamId}
        users={users}
        teams={teams}
      />

      <main className={cn(
        "flex-1 min-h-0 flex flex-col custom-scrollbar bg-neutral-50 dark:bg-neutral-950",
        viewMode === "list" 
          ? "overflow-y-auto overflow-x-hidden p-6 pb-8" 
          : "overflow-hidden p-6"
      )}>
        {isLoadingPage ? (
          <div className="text-center text-neutral-500 py-12">Carregando...</div>
        ) : viewMode === "list" ? (
          <ListView
            cards={listViewCards}
            steps={steps}
            searchQuery={searchQuery}
            isSearchingOnServer={isSearchingOnServer}
            currentPage={listPage}
            totalPages={totalListPages}
            pageSize={LIST_PAGE_SIZE}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            filterUserId={filterUserId}
            filterTeamId={filterTeamId}
            onCardClick={setActiveCard}
            onPageChange={setListPage}
            onLoadAll={handleLoadAllCards}
          />
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <KanbanView
              steps={steps}
              cardsByStepPaginated={cardsByStepPaginated}
              stepCounts={stepCounts}
              startStep={startStep}
              flowId={id}
              draggedCardId={draggedCardId}
              activeDragCard={activeDragCard}
              shakeCardId={shakeCardId}
              celebratedCardId={celebratedCardId}
              confettiCardId={confettiCardId}
              onNewCard={() => setIsStartFormOpen(true)}
              onCardClick={setActiveCard}
              onLoadMore={handleLoadMoreForStep}
              isFetchingNextPage={isFetchingNextPage}
              getColorClasses={getColorClasses}
            />
          </DndContext>
        )}
      </main>

      <NewCardWizard
        open={isStartFormOpen}
        onOpenChange={setIsStartFormOpen}
        onSuccess={handleWizardSuccess}
        flowId={id ?? ""}
        stepId={startStep?.id ?? ""}
        clientId={flow?.clientId ?? ""}
      />

      <CardDetailsModal
        card={activeCard}
        steps={steps}
        onClose={() => setActiveCard(null)}
        onSave={handleSaveCardFields}
        onMoveNext={handleMoveCardForward}
        onDelete={async (cardId) => {
          await deleteCard(cardId);
          void queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", "count-by-step", id] });
          setActiveCard(null);
        }}
        onUpdateCard={async (input) => {
          await updateCard({
            id: input.id,
            stepId: input.stepId,
          });
        }}
        subtaskCount={subtaskCount}
        parentTitle={parentCardTitle}
        onOpenParentCard={(parentCard) => {
          setActiveCard(parentCard);
        }}
        currentFlowId={id}
      />
    </div>
  );
}

