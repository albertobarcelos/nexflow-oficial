import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentClientId, nexflowClient, supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import {
  CardMovementEntry,
  ChecklistProgressMap,
  NexflowCard,
  StepFieldValueMap,
} from "@/types/nexflow";
import { separateSystemFields, SYSTEM_FIELDS, isSystemField } from "@/lib/flowBuilder/systemFields";

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
    status?: string | null;
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

      // Separar campos de sistema dos campos genéricos
      const fieldValues = input.fieldValues ?? {};
      const { systemFields, genericFields } = separateSystemFields(fieldValues);
      
      // Obter assigned_to do input direto ou dos systemFields
      const assignedTo = input.assignedTo ?? (systemFields[SYSTEM_FIELDS.ASSIGNED_TO] as string | null) ?? null;
      
      // Obter assigned_team_id do input direto ou dos systemFields
      const assignedTeamId = input.assignedTeamId ?? (systemFields[SYSTEM_FIELDS.ASSIGNED_TEAM_ID] as string | null) ?? null;
      
      // Obter agents do input direto ou dos systemFields
      const agents = input.agents ?? (Array.isArray(systemFields[SYSTEM_FIELDS.AGENTS]) ? systemFields[SYSTEM_FIELDS.AGENTS] as string[] : undefined);

      // Garantir exclusão mútua: se ambos estiverem preenchidos, priorizar assignedTo
      const finalAssignedTo = assignedTo;
      const finalAssignedTeamId = assignedTo ? null : assignedTeamId;

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
        field_values: genericFields, // Apenas campos genéricos, sem campos de sistema
        checklist_progress: input.checklistProgress ?? {},
        movement_history: input.movementHistory ?? [],
        parent_card_id: input.parentCardId ?? null,
        assigned_to: finalAssignedTo,
        assigned_team_id: finalAssignedTeamId,
        agents: agents,
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
      // Separar campos de sistema dos campos genéricos se fieldValues for fornecido
      let genericFieldValues = input.fieldValues;
      let finalAssignedTo = input.assignedTo;
      let finalAssignedTeamId = input.assignedTeamId;
      let finalAgents = input.agents;
      
      if (typeof input.fieldValues !== "undefined") {
        const { systemFields, genericFields } = separateSystemFields(input.fieldValues);
        genericFieldValues = genericFields;
        
        // Se assigned_to estiver em systemFields mas não foi passado explicitamente, usar do systemFields
        if (typeof input.assignedTo === "undefined" && systemFields[SYSTEM_FIELDS.ASSIGNED_TO]) {
          finalAssignedTo = systemFields[SYSTEM_FIELDS.ASSIGNED_TO] as string | null;
        }
        
        // Se assigned_team_id estiver em systemFields mas não foi passado explicitamente, usar do systemFields
        if (typeof input.assignedTeamId === "undefined" && systemFields[SYSTEM_FIELDS.ASSIGNED_TEAM_ID]) {
          finalAssignedTeamId = systemFields[SYSTEM_FIELDS.ASSIGNED_TEAM_ID] as string | null;
        }
        
        // Se agents estiver em systemFields mas não foi passado explicitamente, usar do systemFields
        if (typeof input.agents === "undefined" && systemFields[SYSTEM_FIELDS.AGENTS]) {
          finalAgents = Array.isArray(systemFields[SYSTEM_FIELDS.AGENTS]) 
            ? systemFields[SYSTEM_FIELDS.AGENTS] as string[] 
            : undefined;
        }
        
        // IMPORTANTE: Também verificar se há valores de campos de sistema pelos IDs dos campos
        // Isso é necessário porque os valores podem vir com o ID do campo em vez do slug
        // Buscar o card para obter o stepId e então buscar os campos da etapa
        if (input.fieldValues && Object.keys(input.fieldValues).length > 0) {
          try {
            const { data: cardData } = await nexflowClient()
              .from("cards")
              .select("step_id")
              .eq("id", input.id)
              .single();
            
            if (cardData?.step_id) {
              const { data: stepFields } = await nexflowClient()
                .schema("nexflow")
                .from("step_fields")
                .select("id, slug")
                .eq("step_id", cardData.step_id);
              
              if (stepFields) {
                // Criar um mapa de field.id -> slug para identificar campos de sistema
                const fieldIdToSlug = new Map<string, string>();
                stepFields.forEach((field) => {
                  if (field.slug) {
                    fieldIdToSlug.set(field.id, field.slug);
                  }
                });
                
                // Verificar cada valor em fieldValues e extrair campos de sistema
                const fieldsToRemove: string[] = [];
                for (const [fieldId, value] of Object.entries(input.fieldValues)) {
                  const slug = fieldIdToSlug.get(fieldId);
                  if (slug && isSystemField(slug)) {
                    // Este é um campo de sistema, extrair o valor
                    if (slug === SYSTEM_FIELDS.ASSIGNED_TO && typeof input.assignedTo === "undefined") {
                      finalAssignedTo = typeof value === "string" && value.trim() ? value.trim() : null;
                      fieldsToRemove.push(fieldId);
                    } else if (slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID && typeof input.assignedTeamId === "undefined") {
                      finalAssignedTeamId = typeof value === "string" && value.trim() ? value.trim() : null;
                      fieldsToRemove.push(fieldId);
                    } else if (slug === SYSTEM_FIELDS.AGENTS && typeof input.agents === "undefined") {
                      finalAgents = Array.isArray(value) ? value as string[] : [];
                      fieldsToRemove.push(fieldId);
                    } else {
                      // Se já foi passado explicitamente, apenas remover do genericFields
                      fieldsToRemove.push(fieldId);
                    }
                  }
                }
                
                // Remover campos de sistema do genericFieldValues
                if (fieldsToRemove.length > 0) {
                  const cleanedGenericFields = { ...genericFieldValues };
                  fieldsToRemove.forEach((fieldId) => {
                    delete cleanedGenericFields[fieldId];
                  });
                  genericFieldValues = cleanedGenericFields;
                }
              }
            }
          } catch (error) {
            // Se houver erro ao buscar campos, continuar com a lógica normal
            console.warn("Erro ao buscar campos da etapa para extrair campos de sistema:", error);
          }
        }
      }

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
      if (typeof genericFieldValues !== "undefined") edgeFunctionPayload.fieldValues = genericFieldValues;
      if (typeof input.checklistProgress !== "undefined") edgeFunctionPayload.checklistProgress = input.checklistProgress;
      if (typeof finalAssignedTo !== "undefined") edgeFunctionPayload.assignedTo = finalAssignedTo;
      if (typeof finalAssignedTeamId !== "undefined") edgeFunctionPayload.assignedTeamId = finalAssignedTeamId;
      if (typeof finalAgents !== "undefined") edgeFunctionPayload.agents = finalAgents;
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
        assigneeType: data.card.assigneeType ?? (data.card.assignedTo ? 'user' : data.card.assignedTeamId ? 'team' : 'unassigned'),
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
      await Promise.all(
        items.map(({ id, stepId, position, movementHistory, status }) => {
          const payload: Partial<CardRow> = {
            step_id: stepId,
            position,
          };
          if (typeof movementHistory !== "undefined") {
            payload.movement_history = movementHistory;
          }
          if (typeof status !== "undefined") {
            payload.status = status;
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
              status:
                typeof update.status !== "undefined"
                  ? update.status
                  : card.status,
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

