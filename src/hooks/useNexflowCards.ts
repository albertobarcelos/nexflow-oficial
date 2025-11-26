import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import {
  CardMovementEntry,
  ChecklistProgressMap,
  NexflowCard,
  StepFieldValueMap,
} from "@/types/nexflow";

type CardRow = Database["nexflow"]["Tables"]["cards"]["Row"];

const mapCardRow = (row: CardRow): NexflowCard => ({
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
  position: row.position ?? 0,
  createdAt: row.created_at,
});

export interface CreateCardInput {
  stepId: string;
  flowId: string;
  title: string;
  position?: number;
  fieldValues?: StepFieldValueMap;
  checklistProgress?: ChecklistProgressMap;
  movementHistory?: CardMovementEntry[];
  parentCardId?: string | null;
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
  /** Quando true, não exibe toast de sucesso (útil para auto-save) */
  silent?: boolean;
}

export interface ReorderCardsInput {
  items: {
    id: string;
    stepId: string;
    position: number;
    movementHistory?: CardMovementEntry[];
  }[];
}

export function useNexflowCards(flowId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "cards", flowId];

  const cardsQuery = useQuery({
    queryKey,
    enabled: Boolean(flowId),
    queryFn: async (): Promise<NexflowCard[]> => {
      if (!flowId) {
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("cards")
        .select("*")
        .eq("flow_id", flowId)
        .order("step_id", { ascending: true })
        .order("position", { ascending: true });

      if (error || !data) {
        console.error("Erro ao carregar cards do Nexflow:", error);
        return [];
      }

      return data.map(mapCardRow);
    },
    staleTime: 1000 * 10,
  });

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
            : (cardsQuery.data
                ?.filter((card) => card.stepId === input.stepId)
                .reduce((max, card) => Math.max(max, card.position), 0) ?? 0) + 1000,
        field_values: input.fieldValues ?? {},
        checklist_progress: input.checklistProgress ?? {},
        movement_history: input.movementHistory ?? [],
        parent_card_id: input.parentCardId ?? null,
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
      const payload: Partial<CardRow> = {};
      if (typeof input.title !== "undefined") payload.title = input.title;
      if (typeof input.stepId !== "undefined") payload.step_id = input.stepId;
      if (typeof input.position !== "undefined") payload.position = input.position;
      if (typeof input.fieldValues !== "undefined")
        payload.field_values = input.fieldValues;
      if (typeof input.checklistProgress !== "undefined")
        payload.checklist_progress = input.checklistProgress;
      if (typeof input.movementHistory !== "undefined")
        payload.movement_history = input.movementHistory;
      if (typeof input.parentCardId !== "undefined")
        payload.parent_card_id = input.parentCardId;

      const { data, error } = await nexflowClient()
        .from("cards")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao atualizar card.");
      }

      return { card: mapCardRow(data), silent: input.silent };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      if (!result.silent) {
        toast.success("Card atualizado.");
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar card.");
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
        items.map(({ id, stepId, position, movementHistory }) => {
          const payload: Partial<CardRow> = {
            step_id: stepId,
            position,
          };
          if (typeof movementHistory !== "undefined") {
            payload.movement_history = movementHistory;
          }
          return nexflowClient().from("cards").update(payload).eq("id", id);
        })
      );
    },
    onMutate: async ({ items }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousCards =
        queryClient.getQueryData<NexflowCard[]>(queryKey) ?? [];

      const updatedCards = previousCards.map((card) => {
        const update = items.find((item) => item.id === card.id);
        return update
          ? {
              ...card,
              stepId: update.stepId,
              position: update.position,
              movementHistory:
                typeof update.movementHistory !== "undefined"
                  ? update.movementHistory
                  : card.movementHistory,
            }
          : card;
      });

      queryClient.setQueryData(queryKey, updatedCards);
      return { previousCards };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(queryKey, context.previousCards);
      }
      toast.error("Erro ao reorganizar cards.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    cards: cardsQuery.data ?? [],
    isLoading: cardsQuery.isLoading,
    isError: cardsQuery.isError,
    refetch: cardsQuery.refetch,
    createCard: createCardMutation.mutateAsync,
    updateCard: updateCardMutation.mutateAsync,
    deleteCard: deleteCardMutation.mutateAsync,
    reorderCards: reorderCardsMutation.mutateAsync,
    isReordering: reorderCardsMutation.isPending,
  };
}

