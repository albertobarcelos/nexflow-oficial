import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import { Opportunity } from "@/hooks/useOpportunities";
import { NexflowCard } from "@/types/nexflow";

export interface OpportunityDetails extends Opportunity {
  linkedCards: NexflowCard[];
  interactionHistory: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export function useOpportunityDetails(opportunityId: string | null | undefined) {
  return useQuery({
    queryKey: ["opportunity-details", opportunityId],
    queryFn: async (): Promise<OpportunityDetails | null> => {
      if (!opportunityId) {
        return null;
      }

      // Buscar oportunidade
      const { data: opportunity, error: oppError } = await nexflowClient()
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId)
        .single();

      if (oppError || !opportunity) {
        console.error("Erro ao buscar oportunidade:", oppError);
        return null;
      }

      // Buscar cards vinculados
      const { data: cards, error: cardsError } = await nexflowClient()
        .from("cards")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });

      if (cardsError) {
        console.error("Erro ao buscar cards vinculados:", cardsError);
      }

      // Mapear cards para NexflowCard
      const linkedCards: NexflowCard[] = (cards || []).map((card) => ({
        id: card.id,
        flowId: card.flow_id,
        stepId: card.step_id,
        clientId: card.client_id,
        title: card.title,
        fieldValues: (card.field_values as Record<string, unknown>) ?? {},
        checklistProgress: (card.checklist_progress as Record<string, unknown>) ?? {},
        movementHistory: (card.movement_history as Array<{
          id: string;
          fromStepId: string | null;
          toStepId: string;
          movedAt: string;
          movedBy?: string | null;
        }>) ?? [],
        parentCardId: card.parent_card_id,
        assignedTo: card.assigned_to,
        opportunityId: card.opportunity_id,
        position: card.position,
        createdAt: card.created_at,
      }));

      // Buscar histórico de interações (pode ser expandido no futuro)
      const interactionHistory: Array<{
        id: string;
        type: string;
        description: string;
        createdAt: string;
      }> = [];

      // Adicionar criação da oportunidade ao histórico
      interactionHistory.push({
        id: opportunity.id,
        type: "created",
        description: "Oportunidade criada",
        createdAt: opportunity.created_at || new Date().toISOString(),
      });

      // Adicionar criação de cards ao histórico
      linkedCards.forEach((card) => {
        interactionHistory.push({
          id: card.id,
          type: "card_created",
          description: `Card "${card.title}" criado no flow`,
          createdAt: card.createdAt,
        });
      });

      // Ordenar histórico por data
      interactionHistory.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        id: opportunity.id,
        client_id: opportunity.client_id,
        client_name: (opportunity as any).client_name || (opportunity as any).name || "",
        main_contact: (opportunity as any).main_contact || "",
        phone_numbers: (opportunity as any).phone_numbers || [],
        company_names: (opportunity as any).company_names || [],
        tax_ids: (opportunity as any).tax_ids || [],
        related_card_ids: linkedCards.map((c) => c.id),
        assigned_team_id: (opportunity as any).assigned_team_id || null,
        avatar_type: (opportunity as any).avatar_type,
        avatar_seed: (opportunity as any).avatar_seed,
        created_at: opportunity.created_at || new Date().toISOString(),
        updated_at: (opportunity as any).updated_at || new Date().toISOString(),
        linkedCards,
        interactionHistory,
      };
    },
    enabled: !!opportunityId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

