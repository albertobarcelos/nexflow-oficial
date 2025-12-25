import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ArrowLeft, CheckCircle2, Search, X } from "lucide-react";
import { StartFormModal, type StartFormPayload } from "@/components/crm/flows/StartFormModal";
import {
  CardDetailsModal,
  type CardFormValues,
} from "@/components/crm/flows/CardDetailsModal";
import { StepResponsibleSelector } from "@/components/crm/flows/StepResponsibleSelector";
import { useNexflowFlow, type NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { useNexflowCardsInfinite } from "@/hooks/useNexflowCardsInfinite";
import { nexflowClient } from "@/lib/supabase";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { useCardTags } from "@/hooks/useCardTags";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

// Componente para exibir tags de um card no modo lista
function ListCardTags({ cardId }: { cardId: string }) {
  const { data: cardTags = [], isLoading } = useCardTags(cardId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
      </div>
    );
  }

  if (cardTags.length === 0) {
    return <span className="text-slate-400 text-xs italic">--</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-full">
      {cardTags.slice(0, 2).map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-[10px] font-medium px-1.5 py-0.5 border shrink-0 max-w-[90px] truncate"
          style={{
            backgroundColor: `${tag.color}15`,
            borderColor: tag.color,
            color: tag.color,
          }}
          title={tag.name}
        >
          <Tag className="h-2.5 w-2.5 mr-0.5 shrink-0" />
          <span className="truncate">{tag.name}</span>
        </Badge>
      ))}
      {cardTags.length > 2 && (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0.5 shrink-0"
          title={`${cardTags.length - 2} tags adicionais`}
        >
          +{cardTags.length - 2}
        </Badge>
      )}
    </div>
  );
}

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

  // Estado de paginação para modo lista
  const LIST_PAGE_SIZE = 20;
  const [listPage, setListPage] = useState(1);

  // Estado de filtros
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [filterTeamId, setFilterTeamId] = useState<string | null>(null);

  // Estado de pesquisa global
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Estado para armazenar resultados da busca no servidor
  const [serverSearchResults, setServerSearchResults] = useState<NexflowCard[]>([]);
  // Estado para controlar se está buscando no servidor
  const [isSearchingOnServer, setIsSearchingOnServer] = useState<boolean>(false);
  // Ref para debounce timer
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    searchCardsOnServer,
  } = useNexflowCardsInfinite(id, {
    assignedTo: filterUserId,
    assignedTeamId: filterTeamId,
  });

  // Buscar contagem real de cards por etapa no banco de dados
  const { data: stepCounts = {} } = useQuery({
    queryKey: ["nexflow", "cards", "count-by-step", id, filterUserId, filterTeamId],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!id || steps.length === 0) return {};

      const client = nexflowClient();
      const counts: Record<string, number> = {};

      // Buscar contagem para cada etapa
      await Promise.all(
        steps.map(async (step) => {
          let query = client
            .from("cards")
            .select("*", { count: "exact", head: true })
            .eq("flow_id", id)
            .eq("step_id", step.id);

          // Aplicar filtros se fornecidos
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
    staleTime: 1000 * 30, // Cache por 30 segundos
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
  });

  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const startStep = steps[0] ?? null;

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, []);

  // Função para normalizar termo de busca (remove acentos, lowercase)
  const normalizeSearchTerm = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }, []);

  // Função para buscar em todos os campos do card
  const searchCards = useCallback(
    (cards: NexflowCard[], searchQuery: string): NexflowCard[] => {
      if (!searchQuery.trim()) {
        return cards;
      }

      const normalizedQuery = normalizeSearchTerm(searchQuery);
      const statusMap: Record<string, string> = {
        inprogress: 'em progresso',
        completed: 'concluído',
        canceled: 'cancelado',
      };

      return cards.filter((card) => {
        // Buscar no título
        if (normalizeSearchTerm(card.title).includes(normalizedQuery)) {
          return true;
        }

        // Buscar no status (traduzido)
        if (card.status && statusMap[card.status]) {
          if (normalizeSearchTerm(statusMap[card.status]).includes(normalizedQuery)) {
            return true;
          }
        }

        // Buscar na data formatada
        try {
          const createdDate = new Date(card.createdAt);
          const formattedDate = createdDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          if (normalizeSearchTerm(formattedDate).includes(normalizedQuery)) {
            return true;
          }
        } catch {
          // Ignorar erros de data
        }

        // Buscar no nome do usuário atribuído
        if (card.assignedTo) {
          const assignedUser = users.find((u) => u.id === card.assignedTo);
          if (assignedUser) {
            const fullName = `${assignedUser.name} ${assignedUser.surname}`;
            if (normalizeSearchTerm(fullName).includes(normalizedQuery)) {
              return true;
            }
          }
        }

        // Buscar no nome do time atribuído
        if (card.assignedTeamId) {
          const assignedTeam = teams.find((t) => t.id === card.assignedTeamId);
          if (assignedTeam) {
            if (normalizeSearchTerm(assignedTeam.name).includes(normalizedQuery)) {
              return true;
            }
          }
        }

        // Buscar em fieldValues
        const fieldValuesStr = Object.values(card.fieldValues)
          .map((value) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return value;
            if (typeof value === 'number') return value.toString();
            if (Array.isArray(value)) return value.join(' ');
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          })
          .join(' ');

        if (normalizeSearchTerm(fieldValuesStr).includes(normalizedQuery)) {
          return true;
        }

        // Buscar em checklistProgress (itens marcados)
        const checklistItems = Object.entries(card.checklistProgress || {})
          .flatMap(([fieldId, progress]) => {
            if (typeof progress === 'object' && progress !== null) {
              return Object.entries(progress as Record<string, boolean>)
                .filter(([, checked]) => checked)
                .map(([item]) => item);
            }
            return [];
          })
          .join(' ');

        if (normalizeSearchTerm(checklistItems).includes(normalizedQuery)) {
          return true;
        }

        return false;
      });
    },
    [normalizeSearchTerm, users, teams]
  );

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

  // Cards já vêm filtrados do servidor quando os filtros estão ativos
  // Mantemos filteredCards para compatibilidade, mas os cards já estão filtrados
  const filteredCards = useMemo(() => {
    // Se não há filtros ativos, retornar todos os cards
    if (filterUserId === null && filterTeamId === null) {
      return cards;
    }
    
    // Aplicar filtros adicionais no cliente como fallback (caso o servidor não tenha aplicado)
    return cards.filter((card) => {
      // Filtro por usuário
      if (filterUserId !== null) {
        if (card.assignedTo !== filterUserId) {
          return false;
        }
      }

      // Filtro por time
      if (filterTeamId !== null) {
        if (card.assignedTeamId !== filterTeamId) {
          return false;
        }
      }

      return true;
    });
  }, [cards, filterUserId, filterTeamId]);

  // Cards agrupados por step com informações de paginação
  const cardsByStepPaginated = useMemo(() => {
    const result: Record<
      string,
      { cards: NexflowCard[]; total: number; hasMore: boolean }
    > = {};

    // Agrupar cards por step (usando cards filtrados)
    filteredCards.forEach((card) => {
      if (!result[card.stepId]) {
        result[card.stepId] = { cards: [], total: 0, hasMore: false };
      }
      result[card.stepId].cards.push(card);
    });

    // Ordenar, aplicar pesquisa e calcular totais
    Object.keys(result).forEach((stepId) => {
      const entry = result[stepId];
      entry.cards.sort((a, b) => a.position - b.position);
      
      // Aplicar filtro de pesquisa global se houver termo de busca
      if (searchQuery.trim()) {
        // Buscar primeiro nos cards já carregados desta etapa
        const localResults = searchCards(entry.cards, searchQuery);
        
        // Filtrar resultados do servidor para esta etapa específica
        const serverResultsForStep = serverSearchResults.filter(
          (card) => card.stepId === stepId
        );
        
        // Combinar resultados, removendo duplicatas
        const combinedResults = [...localResults];
        const localIds = new Set(localResults.map(c => c.id));
        
        serverResultsForStep.forEach((serverCard) => {
          if (!localIds.has(serverCard.id)) {
            combinedResults.push(serverCard);
          }
        });
        
        entry.cards = combinedResults;
      }
      
      // Calcular total após pesquisa (se houver)
      entry.total = entry.cards.length;
      
      // Aplicar limite visível
      const visibleCount = getVisibleCount(stepId);
      entry.hasMore = entry.total > visibleCount;
      entry.cards = entry.cards.slice(0, visibleCount);
    });

    return result;
  }, [filteredCards, getVisibleCount, searchQuery, searchCards, serverSearchResults]);

  // Mantém cardsByStep para compatibilidade com código existente (usa cards filtrados)
  const cardsByStep = useMemo(() => {
    const map: Record<string, NexflowCard[]> = {};
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

  // Cards filtrados e pesquisados para o modo lista
  const listViewCards = useMemo(() => {
    let result: NexflowCard[] = [];

    // Se há pesquisa, aplicar busca
    if (searchQuery.trim()) {
      // Buscar primeiro nos cards já carregados
      const localResults = searchCards(filteredCards, searchQuery);
      
      // Combinar com resultados do servidor, removendo duplicatas
      const localIds = new Set(localResults.map(c => c.id));
      const serverResults = serverSearchResults.filter(
        (card) => !localIds.has(card.id)
      );
      
      result = [...localResults, ...serverResults];
    } else {
      // Sem pesquisa, usar apenas cards filtrados
      result = [...filteredCards];
    }

    // Ordenar: primeiro por step (usando position do step), depois por position do card
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
  }, [filteredCards, searchQuery, searchCards, serverSearchResults, steps]);

  // Resetar página quando pesquisa ou filtros mudarem
  useEffect(() => {
    setListPage(1);
  }, [searchQuery, filterUserId, filterTeamId]);

  // Carregar mais páginas automaticamente no modo lista quando necessário
  useEffect(() => {
    if (viewMode === "list" && hasNextPage && !isFetchingNextPage) {
      // Se temos menos cards do que o necessário para a página atual, carregar mais
      const currentPageEnd = listPage * LIST_PAGE_SIZE;
      if (listViewCards.length < currentPageEnd && listViewCards.length < 1000) {
        // Limitar a 1000 cards para não sobrecarregar o navegador
        void fetchNextPage();
      }
    }
  }, [viewMode, hasNextPage, isFetchingNextPage, listViewCards.length, listPage, fetchNextPage]);

  // Cards paginados para o modo lista
  const paginatedListViewCards = useMemo(() => {
    const startIndex = (listPage - 1) * LIST_PAGE_SIZE;
    const endIndex = startIndex + LIST_PAGE_SIZE;
    return listViewCards.slice(startIndex, endIndex);
  }, [listViewCards, listPage]);

  const totalListPages = Math.ceil(listViewCards.length / LIST_PAGE_SIZE);

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

      // O histórico será inserido automaticamente pela edge function na tabela card_history
      // quando o stepId mudar, então não precisamos mais construir movementHistory aqui

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
      assignedTo: payload.assignedTo,
      assignedTeamId: payload.assignedTeamId,
      agents: payload.agents,
    });
    // Invalidar contagem de cards por etapa
    void queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", "count-by-step", id] });
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

    const { updates } = buildReorderUpdates(
      card,
      targetStepId,
      targetIndex
    );

    if (!updates.length) {
      return;
    }

    // Verificar se houve mudança de etapa para trigger de celebração
    const movedAcrossSteps = card.stepId !== targetStepId;

    // Verificar se a etapa de destino é uma etapa de conclusão
    const targetStep = steps.find((s) => s.id === targetStepId);
    const newStatus = targetStep?.isCompletionStep ? "completed" : "inprogress";

    // Aplicar auto-assignment se o card está mudando de etapa
    let assignedTo: string | null | undefined = undefined;
    let assignedTeamId: string | null | undefined = undefined;
    let agents: string[] | undefined = undefined;

    if (movingAcrossSteps && targetStep) {
      // Prioridade: usuário sobre time
      if (targetStep.responsibleUserId) {
        assignedTo = targetStep.responsibleUserId;
        assignedTeamId = null; // Limpar time ao atribuir usuário
        // Adicionar ao array agents se não estiver presente
        const currentAgents = card.agents ?? [];
        if (!currentAgents.includes(targetStep.responsibleUserId)) {
          agents = [...currentAgents, targetStep.responsibleUserId];
        }
      } else if (targetStep.responsibleTeamId) {
        assignedTeamId = targetStep.responsibleTeamId;
        assignedTo = null; // Limpar usuário ao atribuir time
      }
    }

    // Adicionar status e atribuições aos updates do card que está sendo movido
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

        // Aplicar auto-assignment apenas se mudou de etapa
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

    // Garantir que a etapa de destino tenha contagem visível suficiente para mostrar o card
    if (movingAcrossSteps && targetStepId) {
      const currentVisibleCount = getVisibleCount(targetStepId);
      const destinationCardsCount = (cardsByStep[targetStepId] ?? []).length;
      // Se o card seria o primeiro na nova etapa e a contagem visível é menor que o necessário
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

    // Invalidar contagem de cards por etapa quando há movimentação entre etapas
    if (movingAcrossSteps) {
      void queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", "count-by-step", id] });
    }

    // Atualizar activeCard se for o card que está sendo movido
    const movedCardUpdate = updatesWithStatus.find(u => u.id === card.id) as typeof updatesWithStatus[0] & {
      assignedTo?: string | null;
      assignedTeamId?: string | null;
      agents?: string[];
      status?: string;
    } | undefined;
    if (movedCardUpdate && movingAcrossSteps && activeCard && activeCard.id === card.id) {
        setActiveCard((current) => {
          if (!current || current.id !== card.id) return current;
          return {
            ...current,
            stepId: movedCardUpdate.stepId,
            assignedTo: typeof movedCardUpdate.assignedTo !== "undefined" ? movedCardUpdate.assignedTo : current.assignedTo,
            assignedTeamId: typeof movedCardUpdate.assignedTeamId !== "undefined" ? movedCardUpdate.assignedTeamId : current.assignedTeamId,
            agents: typeof movedCardUpdate.agents !== "undefined" ? movedCardUpdate.agents : current.agents,
            status: typeof movedCardUpdate.status !== "undefined" ? movedCardUpdate.status : current.status,
          };
        });
    }

    // Trigger celebração se houve mudança de etapa
    if (movedAcrossSteps) {
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
    const { updates } = buildReorderUpdates(card, nextStep.id);
    if (!updates.length) {
      return;
    }

    await reorderCards({ items: updates });
    
    // Invalidar contagem de cards por etapa quando há movimentação
    void queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", "count-by-step", id] });
    
    // Celebração após mover (sempre há mudança de etapa neste caso)
    triggerCelebration(card.id);
  };

  // Handler para carregar mais cards em uma coluna específica
  const handleLoadMoreForStep = useCallback(
    async (stepId: string) => {
      const current = visibleCountPerStep[stepId] ?? VISIBLE_INCREMENT;
      const stepTotal = cardsByStep[stepId]?.length ?? 0;

      // Sempre incrementar o contador visível primeiro (otimistic update)
      setVisibleCountPerStep((prev) => ({
        ...prev,
        [stepId]: current + VISIBLE_INCREMENT,
      }));

      // Se há mais páginas no servidor e não está carregando, buscar mais
      // Isso garante que continuaremos buscando enquanto houver mais páginas
      if (hasNextPage && !isFetchingNextPage) {
        await fetchNextPage();
      }
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
    <div className={cn(
      "min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-sans flex flex-col transition-colors duration-200",
      viewMode === "list" ? "h-auto min-h-screen" : "h-screen overflow-hidden"
    )}>
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
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex items-center gap-2">
            {/* Campo de pesquisa global */}
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Pesquisar em todas as etapas..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);

                  // Limpar timer anterior se existir
                  if (searchDebounceTimerRef.current) {
                    clearTimeout(searchDebounceTimerRef.current);
                  }

                  // Se o termo for muito curto, limpar resultados do servidor imediatamente
                  if (value.trim().length < 3) {
                    setServerSearchResults([]);
                    return;
                  }

                  // Debounce: aguardar 500ms antes de buscar no servidor
                  searchDebounceTimerRef.current = setTimeout(async () => {
                    if (searchCardsOnServer) {
                      setIsSearchingOnServer(true);

                      try {
                        // Buscar em todas as etapas
                        const allStepIds = steps.map((step) => step.id);
                        const allResults: NexflowCard[] = [];
                        
                        for (const stepId of allStepIds) {
                          const stepResults = await searchCardsOnServer(value.trim(), stepId);
                          allResults.push(...stepResults);
                        }
                        
                        setServerSearchResults(allResults);
                      } catch (error) {
                        console.error("Erro ao buscar no servidor:", error);
                        setServerSearchResults([]);
                      } finally {
                        setIsSearchingOnServer(false);
                      }
                    }
                  }, 500);
                }}
                className="h-9 pl-8 pr-8 text-sm"
              />
              {isSearchingOnServer && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}
              {searchQuery && !isSearchingOnServer && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setServerSearchResults([]);
                    if (searchDebounceTimerRef.current) {
                      clearTimeout(searchDebounceTimerRef.current);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select
              value={filterUserId ?? "all"}
              onValueChange={(value) => setFilterUserId(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users
                  .filter((user) => user.is_active)
                  .map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.surname}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={filterTeamId ?? "all"}
              onValueChange={(value) => setFilterTeamId(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Filtrar por time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os times</SelectItem>
                {teams
                  .filter((team) => team.is_active)
                  .map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
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

      <main className={cn(
        "flex-1 custom-scrollbar bg-slate-50 dark:bg-slate-950",
        viewMode === "list" 
          ? "overflow-y-auto overflow-x-hidden p-6 pb-8" 
          : "overflow-x-auto overflow-y-hidden p-6"
      )}>
        {isLoadingPage ? (
          <div className="text-center text-slate-500 py-12">Carregando...</div>
        ) : viewMode === "list" ? (
          <Card className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Cards</CardTitle>
                {isSearchingOnServer && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Buscando...</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {listViewCards.length === 0 ? (
                <div className="text-center py-12 text-slate-500 px-6">
                  {searchQuery.trim() ? "Nenhum resultado encontrado" : "Nenhum card encontrado"}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2 min-w-[200px] max-w-[300px]">Título</th>
                          <th className="px-3 py-2 min-w-[120px] max-w-[180px]">Etapa</th>
                          <th className="px-3 py-2 min-w-[150px] max-w-[200px]">Tags</th>
                          <th className="px-3 py-2 min-w-[150px] max-w-[200px]">Responsável</th>
                          <th className="px-3 py-2 min-w-[100px] max-w-[120px] whitespace-nowrap">Atualizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedListViewCards.map((card) => {
                          const step = steps.find((item) => item.id === card.stepId);
                          const assignedUser = card.assignedTo
                            ? users.find((user) => user.id === card.assignedTo)
                            : null;
                          const assignedTeam = card.assignedTeamId
                            ? teams.find((team) => team.id === card.assignedTeamId)
                            : null;
                          const createdAt = new Date(card.createdAt);
                          
                          return (
                            <tr
                              key={card.id}
                              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                              onClick={() => setActiveCard(card)}
                            >
                              <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-100">
                                <div className="max-w-[300px] truncate" title={card.title}>
                                  {card.title}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                                <div className="max-w-[180px] truncate" title={step?.title ?? "Etapa"}>
                                  {step?.title ?? "Etapa"}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="max-w-[200px]">
                                  <ListCardTags cardId={card.id} />
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="max-w-[200px]">
                                  {assignedUser ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="shrink-0">
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
                                        />
                                      </div>
                                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={`${assignedUser.name} ${assignedUser.surname}`}>
                                        {assignedUser.name.split(" ")[0]} {assignedUser.surname.split(" ")[0]}
                                      </span>
                                    </div>
                                  ) : assignedTeam ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="shrink-0">
                                        <TeamAvatar
                                          team={{
                                            id: assignedTeam.id,
                                            name: assignedTeam.name,
                                          }}
                                          size="sm"
                                        />
                                      </div>
                                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={assignedTeam.name}>
                                        {assignedTeam.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">--</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                                <div>
                                  {createdAt.toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-[10px] mt-0.5">
                                  {createdAt.toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 px-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Mostrando {((listPage - 1) * LIST_PAGE_SIZE) + 1} a {Math.min(listPage * LIST_PAGE_SIZE, listViewCards.length)} de {listViewCards.length} {listViewCards.length === 1 ? "resultado" : "resultados"}
                      {hasNextPage && (
                        <span className="ml-2 text-xs text-slate-400">
                          (carregando mais...)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasNextPage && !isFetchingNextPage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Carregar todas as páginas disponíveis
                            let attempts = 0;
                            const maxAttempts = 1000; // Limite de segurança (1000 páginas * 30 = 30k cards)
                            
                            while (attempts < maxAttempts) {
                              // Verificar se ainda há próxima página antes de buscar
                              const queryData = queryClient.getQueryData<{
                                pages: Array<{ cards: NexflowCard[]; nextPage: number | null }>;
                                pageParams: number[];
                              }>(["nexflow", "cards", "infinite", id, filterUserId, filterTeamId]);
                              
                              const lastPage = queryData?.pages[queryData.pages.length - 1];
                              const stillHasNext = lastPage?.nextPage !== null && lastPage?.nextPage !== undefined;
                              
                              if (!stillHasNext) {
                                break;
                              }
                              
                              await fetchNextPage();
                              attempts++;
                              
                              // Pequeno delay para evitar sobrecarga e permitir atualização do estado
                              await new Promise(resolve => setTimeout(resolve, 300));
                            }
                          }}
                          className="text-xs"
                        >
                          Carregar todos os cards
                        </Button>
                      )}
                      {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Carregando...
                        </div>
                      )}
                      {totalListPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setListPage((prev) => Math.max(1, prev - 1));
                              }}
                              className={listPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {(() => {
                            const pages: (number | "ellipsis")[] = [];
                            const showEllipsis = totalListPages > 7;

                            if (!showEllipsis) {
                              // Se há poucas páginas, mostrar todas
                              for (let i = 1; i <= totalListPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Sempre mostrar primeira página
                              pages.push(1);

                              if (listPage <= 4) {
                                // Perto do início: 1, 2, 3, 4, 5, ..., última
                                for (let i = 2; i <= 5; i++) {
                                  pages.push(i);
                                }
                                pages.push("ellipsis");
                                pages.push(totalListPages);
                              } else if (listPage >= totalListPages - 3) {
                                // Perto do fim: 1, ..., n-4, n-3, n-2, n-1, n
                                pages.push("ellipsis");
                                for (let i = totalListPages - 4; i <= totalListPages; i++) {
                                  pages.push(i);
                                }
                              } else {
                                // No meio: 1, ..., atual-1, atual, atual+1, ..., última
                                pages.push("ellipsis");
                                pages.push(listPage - 1);
                                pages.push(listPage);
                                pages.push(listPage + 1);
                                pages.push("ellipsis");
                                pages.push(totalListPages);
                              }
                            }

                            return pages.map((item, index) => {
                              if (item === "ellipsis") {
                                return (
                                  <PaginationItem key={`ellipsis-${index}`}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              return (
                                <PaginationItem key={item}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setListPage(item);
                                    }}
                                    isActive={item === listPage}
                                    className="cursor-pointer"
                                  >
                                    {item}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            });
                          })()}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setListPage((prev) => Math.min(totalListPages, prev + 1));
                              }}
                              className={listPage === totalListPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      )}
                    </div>
                  </div>
                </>
              )}
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
                // Usar contagem real do banco de dados se disponível, senão usar contagem local
                const totalCards = stepCounts[step.id] ?? columnData?.total ?? 0;
                const hasMore = columnData?.hasMore ?? false;
                const accentColor = step.color ?? "#2563eb";
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
                        {id && (
                          <StepResponsibleSelector step={step} flowId={id} />
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
          // Invalidar contagem de cards por etapa
          void queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", "count-by-step", id] });
          setActiveCard(null); // Fecha o modal após deletar
        }}
        onUpdateCard={async (input) => {
          await updateCard({
            id: input.id,
            stepId: input.stepId,
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
  const { data: cardTags = [] } = useCardTags(card.id);
  
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
      {/* Tags do card */}
      {cardTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {cardTags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-[10px] font-medium px-1.5 py-0 border"
              style={{
                backgroundColor: `${tag.color}15`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {tag.name}
            </Badge>
          ))}
          {cardTags.length > 3 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              +{cardTags.length - 3}
            </Badge>
          )}
        </div>
      )}
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
          <div className="flex items-center gap-2" title={`${assignedUser.name} ${assignedUser.surname}${assignedTeam ? ` - ${assignedTeam.name}` : ''}`}>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {assignedUser.name.split(" ")[0]}
            </span>
            {/* Stack de avatares: usuário na frente, time atrás */}
            <div className="relative flex items-center">
              {/* Avatar do time (atrás) - apenas se existir */}
              {assignedTeam && (
                <div className="absolute -left-2 w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-700 bg-blue-100 dark:bg-blue-900 flex items-center justify-center z-0">
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                    {(() => {
                      const words = assignedTeam.name.trim().split(/\s+/);
                      if (words.length >= 2) {
                        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
                      } else if (words.length === 1) {
                        return words[0].substring(0, 2).toUpperCase();
                      }
                      return "T";
                    })()}
                  </span>
                </div>
              )}
              {/* Avatar do usuário (na frente) */}
              <div className={`w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-700 bg-slate-100 overflow-hidden ${assignedTeam ? 'relative z-10' : ''}`}>
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

