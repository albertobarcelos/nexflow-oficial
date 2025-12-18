import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentClientId, nexflowClient, supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import {
  CardMovementEntry,
  ChecklistProgressMap,
  NexflowCard,
  StepFieldValueMap,
} from "@/types/nexflow";

type CardRow = Database["nexflow"]["Tables"]["cards"]["Row"];

const mapCardRow = (row: CardRow): NexflowCard => {
  const assignedTo = row.assigned_to ?? null;
  const assignedTeamId = row.assigned_team_id ?? null;
  const assigneeType = assignedTo ? 'user' : assignedTeamId ? 'team' : 'unassigned';
  
  return {
    id: row.id,
    flowId: row.flow_id,
    stepId: row.step_id,
    clientId: row.client_id,
    title: row.title,
    fieldValues: (row.field_values as StepFieldValueMap) ?? {},
    checklistProgress: (row.checklist_progress as ChecklistProgressMap) ?? {},
    movementHistory: Array.isArray(row.movement_history)
      ? (row.movement_history as CardMovementEntry[])
      : [],
    parentCardId: row.parent_card_id ?? null,
    assignedTo: assignedTo,
    assignedTeamId: assignedTeamId,
    assigneeType: assigneeType,
    agents: Array.isArray(row.agents) ? row.agents : undefined,
    position: row.position ?? 0,
    status: row.status ?? null,
    createdAt: row.created_at,
  };
};

export interface CreateCardInput {
  stepId: string;
  flowId: string;
  title: string;
  position?: number;
  fieldValues?: StepFieldValueMap;
  checklistProgress?: ChecklistProgressMap;
  movementHistory?: CardMovementEntry[];
  parentCardId?: string | null;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  agents?: string[];
  status?: string | null;
}

export interface UpdateCardInput {
  id: string;
  title?: string;
  stepId?: string;
  position?: number;
  fieldValues?: StepFieldValueMap;
  checklistProgress?: ChecklistProgressMap;
  movementHistory?: CardMovementEntry[];
  parentCardId?: string | null;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  agents?: string[];
  status?: string | null;
  /** Quando true, não exibe toast de sucesso (útil para auto-save) */
  silent?: boolean;
}

export interface ReorderCardsInput {
  items: {
    id: string;
    stepId: string;
    position: number;
    movementHistory?: CardMovementEntry[];
    status?: string;
    assignedTo?: string | null;
    assignedTeamId?: string | null;
    agents?: string[];
  }[];
}

const CARDS_PER_PAGE = 30;

export function useNexflowCardsInfinite(flowId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "cards", "infinite", flowId];

  const cardsInfiniteQuery = useInfiniteQuery({
    queryKey,
    enabled: Boolean(flowId),
    queryFn: async ({ pageParam = 0 }): Promise<{ cards: NexflowCard[]; nextPage: number | null }> => {
      if (!flowId) {
        return { cards: [], nextPage: null };
      }

      const from = pageParam * CARDS_PER_PAGE;
      const to = from + CARDS_PER_PAGE - 1;

      const { data, error, count } = await nexflowClient()
        .from("cards")
        .select("*", { count: "exact" })
        .eq("flow_id", flowId)
        .order("step_id", { ascending: true })
        .order("position", { ascending: true })
        .range(from, to);

      if (error || !data) {
        console.error("Erro ao carregar cards do Nexflow:", error);
        return { cards: [], nextPage: null };
      }

      const mappedCards = data.map(mapCardRow);
      const totalCount = count ?? 0;
      const hasMore = to < totalCount - 1;
      const nextPage = hasMore ? pageParam + 1 : null;

      return { cards: mappedCards, nextPage };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 1000 * 10,
  });

  // Flatten all pages into a single array
  const allCards = cardsInfiniteQuery.data?.pages.flatMap((page) => page.cards) ?? [];

  const createCardMutation = useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const payload: Database["nexflow"]["Tables"]["cards"]["Insert"] = {
        flow_id: input.flowId,
        step_id: input.stepId,
        client_id: clientId,
        title: input.title,
        position:
          typeof input.position === "number"
            ? input.position
            : (allCards
                .filter((card) => card.stepId === input.stepId)
                .reduce((max, card) => Math.max(max, card.position), 0) ?? 0) + 1000,
        field_values: input.fieldValues ?? {},
        checklist_progress: input.checklistProgress ?? {},
        movement_history: input.movementHistory ?? [],
        parent_card_id: input.parentCardId ?? null,
        assigned_to: input.assignedTo ?? null,
        assigned_team_id: input.assignedTeamId ?? null,
        agents: input.agents,
        status: input.status ?? null,
      };

      const { data, error } = await nexflowClient()
        .from("cards")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar card.");
      }

      return mapCardRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Card criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar card. Tente novamente.");
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async (input: UpdateCardInput) => {
      // Construir payload para Edge Function
      const edgeFunctionPayload: {
        cardId: string;
        title?: string;
        fieldValues?: StepFieldValueMap;
        checklistProgress?: ChecklistProgressMap;
        assignedTo?: string | null;
        assignedTeamId?: string | null;
        agents?: string[];
        stepId?: string;
        position?: number;
        movementHistory?: CardMovementEntry[];
        parentCardId?: string | null;
        status?: 'inprogress' | 'completed' | 'canceled';
      } = {
        cardId: input.id,
      };

      if (typeof input.title !== "undefined") edgeFunctionPayload.title = input.title;
      if (typeof input.fieldValues !== "undefined") edgeFunctionPayload.fieldValues = input.fieldValues;
      if (typeof input.checklistProgress !== "undefined") edgeFunctionPayload.checklistProgress = input.checklistProgress;
      if (typeof input.assignedTo !== "undefined") edgeFunctionPayload.assignedTo = input.assignedTo;
      if (typeof input.assignedTeamId !== "undefined") edgeFunctionPayload.assignedTeamId = input.assignedTeamId;
      if (typeof input.agents !== "undefined") edgeFunctionPayload.agents = input.agents;
      if (typeof input.stepId !== "undefined") edgeFunctionPayload.stepId = input.stepId;
      if (typeof input.position !== "undefined") edgeFunctionPayload.position = input.position;
      if (typeof input.movementHistory !== "undefined") edgeFunctionPayload.movementHistory = input.movementHistory;
      if (typeof input.parentCardId !== "undefined") edgeFunctionPayload.parentCardId = input.parentCardId;
      if (typeof input.status !== "undefined") {
        edgeFunctionPayload.status = input.status as 'inprogress' | 'completed' | 'canceled';
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('update-nexflow-card', {
        body: edgeFunctionPayload,
      });

      if (error) {
        throw new Error(error.message || "Falha ao atualizar card.");
      }

      if (!data || !data.success || !data.card) {
        throw new Error(data?.error || "Falha ao atualizar card.");
      }

      // Mapear resposta da Edge Function para NexflowCard
      const updatedCard: NexflowCard = {
        id: data.card.id,
        flowId: data.card.flowId,
        stepId: data.card.stepId,
        clientId: data.card.clientId,
        title: data.card.title,
        fieldValues: data.card.fieldValues ?? {},
        checklistProgress: data.card.checklistProgress ?? {},
        movementHistory: Array.isArray(data.card.movementHistory) 
          ? data.card.movementHistory 
          : [],
        parentCardId: data.card.parentCardId ?? null,
        assignedTo: data.card.assignedTo ?? null,
        assignedTeamId: data.card.assignedTeamId ?? null,
        agents: Array.isArray(data.card.agents) ? data.card.agents : undefined,
        position: data.card.position ?? 0,
        status: data.card.status ?? null,
        createdAt: data.card.createdAt,
      };

      return { card: updatedCard, silent: input.silent };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      if (!result.silent) {
        toast.success("Card atualizado.");
      }
    },
    onError: (error: Error) => {
      // Verificar se é erro de autorização
      if (error.message.includes("Acesso negado") || error.message.includes("403")) {
        toast.error("Você não tem permissão para alterar o título deste card.");
      } else {
        toast.error(error.message || "Erro ao atualizar card.");
      }
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await nexflowClient()
        .from("cards")
        .delete()
        .eq("id", cardId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Card removido.");
    },
    onError: () => {
      toast.error("Erro ao remover card.");
    },
  });

  const reorderCardsMutation = useMutation({
    mutationFn: async ({ items }: ReorderCardsInput) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowCardsInfinite.ts:276',message:'reorderCardsMutation called',data:{itemsCount:items.length,items:items.map(i=>({id:i.id,hasAssignedTeamId:typeof i.assignedTeamId !== 'undefined',assignedTeamId:i.assignedTeamId}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      await Promise.all(
        items.map(async ({ id, stepId, position, movementHistory, status, assignedTo, assignedTeamId, agents }) => {
          // Se houver atribuições, usar Edge Function para garantir lógica de exclusão mútua
          if (typeof assignedTo !== "undefined" || typeof assignedTeamId !== "undefined" || typeof agents !== "undefined" || typeof status !== "undefined") {
            const edgeFunctionPayload: {
              cardId: string;
              stepId?: string;
              position?: number;
              movementHistory?: CardMovementEntry[];
              status?: 'inprogress' | 'completed' | 'canceled';
              assignedTo?: string | null;
              assignedTeamId?: string | null;
              agents?: string[];
            } = {
              cardId: id,
            };

            if (typeof stepId !== "undefined") edgeFunctionPayload.stepId = stepId;
            if (typeof position !== "undefined") edgeFunctionPayload.position = position;
            if (typeof movementHistory !== "undefined") edgeFunctionPayload.movementHistory = movementHistory;
            if (typeof status !== "undefined") {
              edgeFunctionPayload.status = status as 'inprogress' | 'completed' | 'canceled';
            }
            if (typeof assignedTo !== "undefined") edgeFunctionPayload.assignedTo = assignedTo;
            if (typeof assignedTeamId !== "undefined") edgeFunctionPayload.assignedTeamId = assignedTeamId;
            if (typeof agents !== "undefined") edgeFunctionPayload.agents = agents;

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowCardsInfinite.ts:300',message:'Calling Edge Function with payload',data:{cardId:id,edgeFunctionPayload,hasAssignedTeamId:typeof assignedTeamId !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion

            const { data, error } = await supabase.functions.invoke('update-nexflow-card', {
              body: edgeFunctionPayload,
            });

            // #region agent log
            if (error) {
              fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowCardsInfinite.ts:306',message:'Edge Function error',data:{error:error.message,cardId:id,assignedTeamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            } else {
              fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowCardsInfinite.ts:309',message:'Edge Function success',data:{cardId:id,response:data,assignedTeamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            }
            // #endregion

            if (error) {
              throw new Error(error.message || "Falha ao atualizar card.");
            }
          } else {
            // Para atualizações simples de posição, usar update direto
            const payload: Partial<CardRow> = {
              step_id: stepId,
              position,
            };
            if (typeof movementHistory !== "undefined") {
              payload.movement_history = movementHistory;
            }
            const { error } = await nexflowClient().from("cards").update(payload).eq("id", id);
            if (error) {
              throw error;
            }
          }
        })
      );
    },
    onMutate: async ({ items }) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowCardsInfinite.ts:291',message:'reorderCardsMutation onMutate called',data:{itemsCount:items.length,items:items.map(i=>({id:i.id,stepId:i.stepId,hasAssignedTeamId:typeof i.assignedTeamId !== 'undefined',assignedTeamId:i.assignedTeamId}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      await queryClient.cancelQueries({ queryKey });
      const previousPages = queryClient.getQueryData<typeof cardsInfiniteQuery.data>(queryKey);

      if (previousPages) {
        const updatedPages = previousPages.pages.map((page) => ({
          ...page,
          cards: page.cards.map((card) => {
            const update = items.find((item) => item.id === card.id);
            if (!update) return card;

            const updatedCard = {
              ...card,
              stepId: update.stepId,
              position: update.position,
              movementHistory:
                typeof update.movementHistory !== "undefined"
                  ? update.movementHistory
                  : card.movementHistory,
              status:
                typeof update.status !== "undefined"
                  ? update.status
                  : card.status,
              assignedTo:
                typeof update.assignedTo !== "undefined"
                  ? update.assignedTo
                  : card.assignedTo,
              assignedTeamId:
                typeof update.assignedTeamId !== "undefined"
                  ? update.assignedTeamId
                  : card.assignedTeamId,
              agents:
                typeof update.agents !== "undefined"
                  ? update.agents
                  : card.agents,
            };

            // #region agent log
            if (update.stepId !== card.stepId) {
              fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowCardsInfinite.ts:325',message:'Card stepId changed in cache',data:{cardId:card.id,oldStepId:card.stepId,newStepId:update.stepId,assignedTeamId:updatedCard.assignedTeamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            }
            // #endregion

            return updatedCard;
          }),
        }));

        // #region agent log
        const movedCards = items.filter(i => {
          const oldCard = previousPages.pages.flatMap(p => p.cards).find(c => c.id === i.id);
          return oldCard && oldCard.stepId !== i.stepId;
        });
        if (movedCards.length > 0) {
          fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowCardsInfinite.ts:340',message:'Cards moved between steps in cache',data:{movedCards:movedCards.map(c=>({id:c.id,newStepId:c.stepId,assignedTeamId:c.assignedTeamId})),totalCardsAfterUpdate:updatedPages.flatMap(p => p.cards).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        }
        // #endregion

        queryClient.setQueryData(queryKey, { ...previousPages, pages: updatedPages });
      }

      return { previousPages };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(queryKey, context.previousPages);
      }
      toast.error("Erro ao reorganizar cards.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    cards: allCards,
    isLoading: cardsInfiniteQuery.isLoading,
    isError: cardsInfiniteQuery.isError,
    refetch: cardsInfiniteQuery.refetch,
    fetchNextPage: cardsInfiniteQuery.fetchNextPage,
    hasNextPage: cardsInfiniteQuery.hasNextPage,
    isFetchingNextPage: cardsInfiniteQuery.isFetchingNextPage,
    createCard: createCardMutation.mutateAsync,
    updateCard: updateCardMutation.mutateAsync,
    deleteCard: deleteCardMutation.mutateAsync,
    reorderCards: reorderCardsMutation.mutateAsync,
    isReordering: reorderCardsMutation.isPending,
  };
}

