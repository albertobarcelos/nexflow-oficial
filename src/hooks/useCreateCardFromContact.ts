import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSecureClientMutation, invalidateClientQueries } from "@/hooks/useSecureClientMutation";
import { Json } from "@/types/database";
import { NexflowCard, ChecklistProgressMap, StepFieldValueMap } from "@/types/nexflow";

interface CardRow {
  id: string;
  flow_id: string;
  step_id: string;
  client_id: string;
  title: string;
  field_values: Json | null;
  checklist_progress: Json | null;
  movement_history: Json | null;
  parent_card_id: string | null;
  assigned_to: string | null;
  assigned_team_id: string | null;
  agents: string[] | null;
  contact_id: string | null;
  indication_id: string | null;
  position: number;
  status: string | null;
  created_at: string;
  updated_at: string;
  card_type: "finance" | "onboarding" | null;
  product: string | null;
  value: number | null;
}

interface CardInsert {
  flow_id: string;
  step_id: string;
  client_id: string;
  title: string;
  contact_id?: string | null;
  position: number;
  field_values?: Json | null;
  checklist_progress?: Json | null;
  card_type?: "finance" | "onboarding" | null;
  product?: string | null;
  value?: number | null;
}

export interface CreateCardFromContactInput {
  contactId: string;
  flowId: string;
  stepId: string;
  title?: string;
}

/**
 * Hook para criar card a partir de um contato (multi-tenant: useSecureClientMutation).
 * Garante que o contato pertence ao client_id antes de criar o card.
 */
export function useCreateCardFromContact() {
  const queryClient = useQueryClient();

  return useSecureClientMutation({
    mutationFn: async (client, clientId, input: CreateCardFromContactInput): Promise<NexflowCard> => {
      const c = client as any;

      const { data: contact, error: contactError } = await c
        .from("contacts")
        .select("*")
        .eq("id", input.contactId)
        .eq("client_id", clientId)
        .single();

      if (contactError || !contact) {
        throw new Error("Contato não encontrado ou acesso negado.");
      }

      const { data: flow, error: flowError } = await c
        .from("flows")
        .select("category")
        .eq("id", input.flowId)
        .single();

      if (flowError || !flow) {
        throw new Error("Não foi possível encontrar o flow.");
      }

      const cardType = flow.category === "finance" ? "finance" : "onboarding";

      const { data: positionData } = await c
        .from("cards")
        .select("position")
        .eq("step_id", input.stepId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const maxPosition = positionData?.position ?? 0;
      const nextPosition = maxPosition + 1000;

      const cardTitle =
        input.title || contact.name || contact.client_name || "Novo Contato";

      const payload: CardInsert = {
        flow_id: input.flowId,
        step_id: input.stepId,
        client_id: clientId,
        title: cardTitle,
        contact_id: input.contactId,
        position: nextPosition,
        field_values: {},
        checklist_progress: {},
        card_type: cardType,
        product: null,
        value: null,
      };

      const { data: newCard, error: cardError } = await c
        .from("cards")
        .insert(payload)
        .select("*")
        .single();

      if (cardError || !newCard) {
        throw cardError ?? new Error("Falha ao criar card.");
      }

      const card = newCard as unknown as CardRow;
      const assignedTo = card.assigned_to ?? null;
      const assignedTeamId = card.assigned_team_id ?? null;
      const assigneeType = assignedTo ? "user" : assignedTeamId ? "team" : "unassigned";

      return {
        id: card.id,
        flowId: card.flow_id,
        stepId: card.step_id,
        clientId: card.client_id,
        title: card.title,
        fieldValues: (card.field_values as StepFieldValueMap) ?? {},
        checklistProgress: (card.checklist_progress as ChecklistProgressMap) ?? {},
        movementHistory: (card.movement_history as Array<{
          id: string;
          fromStepId: string | null;
          toStepId: string;
          movedAt: string;
          movedBy?: string | null;
        }>) ?? [],
        parentCardId: card.parent_card_id,
        assignedTo,
        assignedTeamId,
        assigneeType,
        agents: Array.isArray(card.agents) ? card.agents : undefined,
        contactId: card.contact_id,
        position: card.position,
        status: card.status ?? null,
        createdAt: card.created_at,
        cardType: card.card_type ?? "onboarding",
        product: card.product ?? null,
        value: card.value ? Number(card.value) : null,
      };
    },
    validateClientIdOnResult: false,
    mutationOptions: {
      onSuccess: (newCard) => {
        queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", newCard.flowId] });
        invalidateClientQueries(queryClient, ["contact-details"]);
        invalidateClientQueries(queryClient, ["contacts-with-indications"]);
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast.success("Card criado com sucesso!");
      },
      onError: (error: Error) => {
        toast.error(`Erro ao criar card: ${error.message}`);
      },
    },
  });
}
