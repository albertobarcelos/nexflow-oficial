import { useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentClientId, nexflowClient, supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import {
  CardMovementEntry,
  ChecklistProgressMap,
  NexflowCard,
  StepFieldValueMap,
} from "@/types/nexflow";

type CardRow = Database["public"]["Tables"]["cards"]["Row"];

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
    movementHistory: [], // Histórico agora é buscado da tabela card_history via hook useCardHistory
    parentCardId: row.parent_card_id ?? null,
    assignedTo: assignedTo,
    assignedTeamId: assignedTeamId,
    assigneeType: assigneeType,
    agents: Array.isArray(row.agents) ? row.agents : undefined,
    contactId: row.contact_id ?? null,
    companyId: row.company_id ?? null,
    indicationId: row.indication_id ?? null,
    position: row.position ?? 0,
    status: row.status ?? null,
    createdAt: row.created_at,
    cardType: row.card_type ?? 'onboarding',
    product: row.product ?? null,
    value: row.value ? Number(row.value) : null,
  };
};

export interface CreateCardInput {
  stepId: string;
  flowId: string;
  title: string;
  position?: number;
  fieldValues?: StepFieldValueMap;
  checklistProgress?: ChecklistProgressMap;
  parentCardId?: string | null;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  agents?: string[];
  status?: string | null;
  /** Contato principal (cards.contact_id); usado também como primeiro em contactIds */
  contactId?: string | null;
  /** IDs de contatos para card_contacts (N:N); se não informado e contactId existir, usa [contactId] */
  contactIds?: string[];
  /** Empresa vinculada ao card (cards.company_id) */
  companyId?: string | null;
  /** ID do primeiro produto (web_items) para cards.product */
  product?: string | null;
  /** Valor total do card (cards.value) */
  value?: number | null;
}

export interface UpdateCardInput {
  id: string;
  title?: string;
  stepId?: string;
  position?: number;
  fieldValues?: StepFieldValueMap;
  checklistProgress?: ChecklistProgressMap;
  parentCardId?: string | null;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  agents?: string[];
  status?: string | null;
  product?: string | null;
  value?: number | null;
  /** Quando true, não exibe toast de sucesso (útil para auto-save) */
  silent?: boolean;
}

export interface ReorderCardsInput {
  items: {
    id: string;
    stepId: string;
    position: number;
    status?: string;
    assignedTo?: string | null;
    assignedTeamId?: string | null;
    agents?: string[];
  }[];
}

const CARDS_PER_PAGE = 30;

export interface UseNexflowCardsInfiniteOptions {
  assignedTo?: string | null;
  assignedTeamId?: string | null;
}

export function useNexflowCardsInfinite(
  flowId?: string,
  options?: UseNexflowCardsInfiniteOptions
) {
  const queryClient = useQueryClient();
  const { assignedTo, assignedTeamId } = options ?? {};
  const queryKey = ["nexflow", "cards", "infinite", flowId, assignedTo, assignedTeamId];

  const cardsInfiniteQuery = useInfiniteQuery({
    queryKey,
    enabled: Boolean(flowId),
    maxPages: undefined, // Permitir carregar todas as páginas necessárias
    queryFn: async ({ pageParam = 0 }): Promise<{ cards: NexflowCard[]; nextPage: number | null }> => {
      if (!flowId) {
        return { cards: [], nextPage: null };
      }

      const from = pageParam * CARDS_PER_PAGE;
      const to = from + CARDS_PER_PAGE - 1;

      let query = nexflowClient()
        .from("cards")
        .select("*", { count: "exact" })
        .eq("flow_id", flowId);

      // Aplicar filtros se fornecidos
      if (assignedTo !== undefined && assignedTo !== null) {
        query = query.eq("assigned_to", assignedTo);
      }
      if (assignedTeamId !== undefined && assignedTeamId !== null) {
        query = query.eq("assigned_team_id", assignedTeamId);
      }

      const { data, error, count } = await query
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
    refetchOnWindowFocus: false, // #region agent log - Fix: Disable auto refetch, rely on soft reload
    // #endregion
  });

  // Flatten all pages into a single array
  const allCards = cardsInfiniteQuery.data?.pages.flatMap((page) => page.cards) ?? [];

  const createCardMutation = useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      // Buscar o flow para obter a category
      const { data: flow, error: flowError } = await nexflowClient()
        .from("flows")
        .select("category")
        .eq("id", input.flowId)
        .single();

      if (flowError || !flow) {
        throw new Error("Não foi possível encontrar o flow.");
      }

      // Determinar card_type baseado na category do flow
      const cardType = flow.category === 'finance' ? 'finance' : 'onboarding';

      // Produto: input.product ou primeiro item de field_values.products
      const fieldProducts = input.fieldValues?.products;
      const firstProductItemId =
        typeof fieldProducts === "object" &&
        Array.isArray(fieldProducts) &&
        fieldProducts.length > 0 &&
        fieldProducts[0] &&
        typeof fieldProducts[0] === "object" &&
        "itemId" in (fieldProducts[0] as Record<string, unknown>)
          ? (fieldProducts[0] as { itemId: string }).itemId
          : null;
      const productValue = input.product ?? firstProductItemId ?? null;
      const numericValue =
        input.value != null && typeof input.value === "number" ? input.value : null;

      const payload: Database["public"]["Tables"]["cards"]["Insert"] = {
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
        parent_card_id: input.parentCardId ?? null,
        assigned_to: input.assignedTo ?? null,
        assigned_team_id: input.assignedTeamId ?? null,
        agents: input.agents,
        status: (input.status as "canceled" | "completed" | "inprogress" | null) ?? null,
        card_type: cardType,
        contact_id: input.contactId ?? null,
        company_id: input.companyId ?? null,
        product: productValue,
        value: numericValue,
      };

      const { data, error } = await nexflowClient()
        .from("cards")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar card.");
      }

      const cardId = (data as CardRow).id;
      const contactIdsToLink =
        (input.contactIds?.length ?? 0) > 0
          ? input.contactIds
          : input.contactId
            ? [input.contactId]
            : [];

      if (contactIdsToLink.length > 0) {
        const cardContactsPayload = contactIdsToLink.map((contact_id) => ({
          card_id: cardId,
          client_id: clientId,
          contact_id,
        }));
        const { error: cardContactsError } = await nexflowClient()
          .from("card_contacts")
          .insert(cardContactsPayload);

        if (cardContactsError) {
          console.error("Erro ao vincular contatos ao card (card_contacts):", cardContactsError);
          // Card já foi criado; não falhar a mutation, apenas logar
        }
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
        parentCardId?: string | null;
        status?: 'inprogress' | 'completed' | 'canceled';
        product?: string | null;
        value?: number | null;
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
      if (typeof input.parentCardId !== "undefined") edgeFunctionPayload.parentCardId = input.parentCardId;
      if (typeof input.status !== "undefined") {
        edgeFunctionPayload.status = input.status as 'inprogress' | 'completed' | 'canceled';
      }
      if (typeof input.product !== "undefined") edgeFunctionPayload.product = input.product;
      if (typeof input.value !== "undefined") edgeFunctionPayload.value = input.value;

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
        movementHistory: [], // Histórico agora é buscado da tabela card_history via hook useCardHistory
        parentCardId: data.card.parentCardId ?? null,
        assignedTo: data.card.assignedTo ?? null,
        assignedTeamId: data.card.assignedTeamId ?? null,
        agents: Array.isArray(data.card.agents) ? data.card.agents : undefined,
        position: data.card.position ?? 0,
        status: data.card.status ?? null,
        createdAt: data.card.createdAt,
        cardType: data.card.cardType ?? 'onboarding',
        product: data.card.product ?? null,
        value: data.card.value ? Number(data.card.value) : null,
      };

      return { card: updatedCard, silent: input.silent };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      // Invalidar histórico do card para atualização automática
      queryClient.invalidateQueries({ queryKey: ["card-timeline", result.card.id] });
      queryClient.invalidateQueries({ queryKey: ["card-step-history", result.card.id] });
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
      await Promise.all(
        items.map(async ({ id, stepId, position, status, assignedTo, assignedTeamId, agents }) => {
          // Se houver atribuições, usar Edge Function para garantir lógica de exclusão mútua
          if (typeof assignedTo !== "undefined" || typeof assignedTeamId !== "undefined" || typeof agents !== "undefined" || typeof status !== "undefined") {
            const edgeFunctionPayload: {
              cardId: string;
              stepId?: string;
              position?: number;
              status?: 'inprogress' | 'completed' | 'canceled';
              assignedTo?: string | null;
              assignedTeamId?: string | null;
              agents?: string[];
            } = {
              cardId: id,
            };

            if (typeof stepId !== "undefined") edgeFunctionPayload.stepId = stepId;
            if (typeof position !== "undefined") edgeFunctionPayload.position = position;
            if (typeof status !== "undefined") {
              edgeFunctionPayload.status = status as 'inprogress' | 'completed' | 'canceled';
            }
            if (typeof assignedTo !== "undefined") edgeFunctionPayload.assignedTo = assignedTo;
            if (typeof assignedTeamId !== "undefined") edgeFunctionPayload.assignedTeamId = assignedTeamId;
            if (typeof agents !== "undefined") edgeFunctionPayload.agents = agents;

            const { data, error } = await supabase.functions.invoke('update-nexflow-card', {
              body: edgeFunctionPayload,
            });

            if (error) {
              throw new Error(error.message || "Falha ao atualizar card.");
            }
          } else {
            // Para atualizações simples de posição, usar update direto
            const payload: Partial<CardRow> = {
              step_id: stepId,
              position,
            };
            const { error } = await nexflowClient().from("cards").update(payload).eq("id", id);
            if (error) {
              throw error;
            }
          }
        })
      );
    },
    onMutate: async ({ items }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPages = queryClient.getQueryData<typeof cardsInfiniteQuery.data>(queryKey);

      if (previousPages) {
        const updatedPages = previousPages.pages.map((page) => ({
          ...page,
          cards: page.cards
            .map((card) => {
              const update = items.find((item) => item.id === card.id);
              if (!update) return card;

              // Aplicar atualizações, garantindo exclusão mútua entre assignedTo e assignedTeamId
              let finalAssignedTo = typeof update.assignedTo !== "undefined"
                ? update.assignedTo
                : card.assignedTo;
              let finalAssignedTeamId = typeof update.assignedTeamId !== "undefined"
                ? update.assignedTeamId
                : card.assignedTeamId;

              // Garantir exclusão mútua: se assignedTo é definido, assignedTeamId deve ser null
              if (finalAssignedTo !== null && finalAssignedTo !== undefined) {
                finalAssignedTeamId = null;
              }
              // Se assignedTeamId é definido, assignedTo deve ser null
              if (finalAssignedTeamId !== null && finalAssignedTeamId !== undefined) {
                finalAssignedTo = null;
              }

              const updatedCard = {
                ...card,
                stepId: update.stepId,
                position: update.position,
                status:
                  typeof update.status !== "undefined"
                    ? update.status
                    : card.status,
                assignedTo: finalAssignedTo,
                assignedTeamId: finalAssignedTeamId,
                agents:
                  typeof update.agents !== "undefined"
                    ? update.agents
                    : card.agents,
              };

              return updatedCard;
            })
            // Filtrar cards que não correspondem mais aos filtros ativos
            .filter((card) => {
              // Se não há filtros ativos (ambos são null ou undefined), manter todos os cards
              const hasUserFilter = assignedTo !== undefined && assignedTo !== null;
              const hasTeamFilter = assignedTeamId !== undefined && assignedTeamId !== null;
              
              if (!hasUserFilter && !hasTeamFilter) {
                return true;
              }

              // Verificar filtro por usuário
              if (hasUserFilter) {
                // Card deve ter assignedTo igual ao filtro
                if (card.assignedTo !== assignedTo) {
                  return false;
                }
              }

              // Verificar filtro por time
              if (hasTeamFilter) {
                // Card deve ter assignedTeamId igual ao filtro
                if (card.assignedTeamId !== assignedTeamId) {
                  return false;
                }
              }

              return true;
            }),
        }));

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

  // Função para buscar cards no servidor por termo de pesquisa
  const searchCardsOnServer = useCallback(
    async (searchQuery: string, stepId?: string): Promise<NexflowCard[]> => {
      if (!flowId || !searchQuery.trim() || searchQuery.length < 2) {
        return [];
      }

      // Buscar por título primeiro (mais eficiente)
      let query = nexflowClient()
        .from("cards")
        .select("*")
        .eq("flow_id", flowId)
        .ilike("title", `%${searchQuery}%`);

      // Aplicar filtros se fornecidos
      if (assignedTo !== undefined && assignedTo !== null) {
        query = query.eq("assigned_to", assignedTo);
      }
      if (assignedTeamId !== undefined && assignedTeamId !== null) {
        query = query.eq("assigned_team_id", assignedTeamId);
      }

      // Filtrar por etapa se especificado
      if (stepId) {
        query = query.eq("step_id", stepId);
      }

      const { data, error } = await query
        .order("step_id", { ascending: true })
        .order("position", { ascending: true })
        .limit(100); // Limitar resultados da busca

      if (error || !data) {
        console.error("Erro ao buscar cards no servidor:", error);
        return [];
      }

      // Filtrar também por field_values no cliente (já que JSONB não suporta ilike diretamente)
      const mappedCards = data.map(mapCardRow);
      const normalizedQuery = searchQuery.toLowerCase().trim();
      
      return mappedCards.filter((card) => {
        // Já foi filtrado por título no servidor, mas vamos verificar field_values também
        const fieldValuesStr = Object.values(card.fieldValues)
          .map((value) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return value.toLowerCase();
            if (typeof value === 'number') return value.toString();
            if (Array.isArray(value)) return value.join(' ').toLowerCase();
            if (typeof value === 'object') return JSON.stringify(value).toLowerCase();
            return String(value).toLowerCase();
          })
          .join(' ');

        return card.title.toLowerCase().includes(normalizedQuery) || 
               fieldValuesStr.includes(normalizedQuery);
      });
    },
    [flowId, assignedTo, assignedTeamId]
  );

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
    searchCardsOnServer,
  };
}

