import { useQuery } from "@tanstack/react-query";
import { supabase, nexflowClient } from "@/lib/supabase";
import { Indication, type IndicationStatus } from "@/types/indications";
import { NexflowCard } from "@/types/nexflow";
import type { Json } from "@/types/database";

export interface IndicationDetails extends Indication {
  linkedCards: NexflowCard[];
  interactionHistory: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export function useIndicationDetails(indicationId: string | null | undefined) {
  return useQuery({
    queryKey: ["indication-details", indicationId],
    queryFn: async (): Promise<IndicationDetails | null> => {
      if (!indicationId) {
        return null;
      }

      // Buscar indicação
      const { data: indication, error: indError } = await supabase
        .from("core_indications")
        .select("*")
        .eq("id", indicationId)
        .single();

      if (indError || !indication) {
        console.error("Erro ao buscar indicação:", indError);
        return null;
      }

      // Buscar cards vinculados
      const { data: cards, error: cardsError } = await nexflowClient()
        .from("cards")
        .select("*")
        .eq("indication_id", indicationId)
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
        fieldValues: (card.field_values as Record<string, Json | undefined>) ?? ({} as Record<string, Json | undefined>),
        checklistProgress: (card.checklist_progress as Record<string, Json | undefined>) ?? ({} as Record<string, Json | undefined>),
        movementHistory: (card.movement_history as Array<{
          id: string;
          fromStepId: string | null;
          toStepId: string;
          movedAt: string;
          movedBy?: string | null;
        }>) ?? [],
        parentCardId: card.parent_card_id,
        assignedTo: card.assigned_to,
        assignedTeamId: card.assigned_team_id,
        assigneeType: card.assigned_to ? 'user' : card.assigned_team_id ? 'team' : 'unassigned',
        indicationId: card.indication_id,
        position: card.position,
        status: card.status ?? null,
        createdAt: card.created_at,
        cardType: card.card_type ?? 'onboarding',
        product: card.product ?? null,
        value: card.value ? Number(card.value) : null,
      }));

      // Buscar informações do hunter
      let hunter = null;
      if (indication.hunter_id) {
        // Usar schema nexhunters para buscar o hunter
        // Cast necessário porque o tipo Database só inclui o schema 'public'
        const { data: hunterData } = await (supabase as any)
          .schema("nexhunters" as any)
          .from("hunters")
          .select("*")
          .eq("id", indication.hunter_id)
          .single();
        
        if (hunterData && hunterData.client_users_id) {
          // Buscar informações do usuário relacionado
          const { data: userData } = await supabase
            .from("core_client_users")
            .select("name, email")
            .eq("id", hunterData.client_users_id)
            .single();
          
          hunter = {
            id: hunterData.id,
            name: userData?.name || null,
            email: userData?.email || null,
          };
        }
      }

      // Buscar histórico de interações (pode ser expandido no futuro)
      const interactionHistory: Array<{
        id: string;
        type: string;
        description: string;
        createdAt: string;
      }> = [
        {
          id: indication.id,
          type: "created",
          description: `Indicação criada${indication.indication_name ? `: ${indication.indication_name}` : ""}`,
          createdAt: indication.created_at,
        },
      ];

      // Adicionar histórico de criação de cards
      linkedCards.forEach((card) => {
        interactionHistory.push({
          id: `card-${card.id}`,
          type: "card_created",
          description: `Card "${card.title}" criado a partir desta indicação`,
          createdAt: card.createdAt,
        });
      });

      return {
        ...indication,
        status: indication.status as IndicationStatus,
        hunter: hunter,
        linkedCards,
        interactionHistory: interactionHistory.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      };
    },
    enabled: !!indicationId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

