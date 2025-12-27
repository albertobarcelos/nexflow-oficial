import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { Database } from "@/types/database";
import { NexflowCard } from "@/types/nexflow";

interface CreateCardFromOpportunityInput {
  opportunityId: string;
  flowId: string;
  stepId: string;
  title?: string;
}

export function useCreateCardFromOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCardFromOpportunityInput): Promise<NexflowCard> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      // Buscar a oportunidade para obter dados
      const { data: opportunity, error: oppError } = await nexflowClient()
        .from("opportunities")
        .select("*")
        .eq("id", input.opportunityId)
        .eq("client_id", clientId)
        .single();

      if (oppError || !opportunity) {
        throw new Error("Oportunidade não encontrada ou acesso negado.");
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

      // Calcular a próxima posição
      const { data: positionData } = await nexflowClient()
        .from("cards")
        .select("position")
        .eq("step_id", input.stepId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      const maxPosition = positionData?.position ?? 0;
      const nextPosition = maxPosition + 1000;

      // Determinar o título do card
      const cardTitle = input.title || 
        (opportunity as any).name || 
        (opportunity as any).client_name || 
        "Nova Oportunidade";

      // Criar o card
      const payload: Database["nexflow"]["Tables"]["cards"]["Insert"] = {
        flow_id: input.flowId,
        step_id: input.stepId,
        client_id: clientId,
        title: cardTitle,
        opportunity_id: input.opportunityId,
        position: nextPosition,
        field_values: {},
        checklist_progress: {},
        card_type: cardType,
        product: null,
        value: null,
      };

      const { data: newCard, error: cardError } = await nexflowClient()
        .from("cards")
        .insert(payload)
        .select("*")
        .single();

      if (cardError || !newCard) {
        throw cardError ?? new Error("Falha ao criar card.");
      }

      // Mapear para NexflowCard
      const assignedTo = newCard.assigned_to ?? null;
      const assignedTeamId = newCard.assigned_team_id ?? null;
      const assigneeType = assignedTo ? 'user' : assignedTeamId ? 'team' : 'unassigned';
      
      return {
        id: newCard.id,
        flowId: newCard.flow_id,
        stepId: newCard.step_id,
        clientId: newCard.client_id,
        title: newCard.title,
        fieldValues: (newCard.field_values as Record<string, unknown>) ?? {},
        checklistProgress: (newCard.checklist_progress as Record<string, unknown>) ?? {},
        movementHistory: (newCard.movement_history as Array<{
          id: string;
          fromStepId: string | null;
          toStepId: string;
          movedAt: string;
          movedBy?: string | null;
        }>) ?? [],
        parentCardId: newCard.parent_card_id,
        assignedTo: assignedTo,
        assignedTeamId: assignedTeamId,
        assigneeType: assigneeType,
        agents: Array.isArray(newCard.agents) ? newCard.agents : undefined,
        opportunityId: newCard.opportunity_id,
        position: newCard.position,
        status: newCard.status ?? null,
        createdAt: newCard.created_at,
        cardType: newCard.card_type ?? 'onboarding',
        product: newCard.product ?? null,
        value: newCard.value ? Number(newCard.value) : null,
      };
    },
    onSuccess: (newCard) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", newCard.flowId] });
      queryClient.invalidateQueries({ queryKey: ["opportunity-details"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Card criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar card: ${error.message}`);
    },
  });
}

