import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import { Contact } from "@/hooks/useOpportunities";
import { NexflowCard } from "@/types/nexflow";

export interface ContactDetails extends Contact {
  linkedCards: NexflowCard[];
  interactionHistory: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export function useContactDetails(contactId: string | null | undefined) {
  return useQuery({
    queryKey: ["contact-details", contactId],
    queryFn: async (): Promise<ContactDetails | null> => {
      if (!contactId) {
        return null;
      }

      // Buscar contato
      const { data: contact, error: contactError } = await nexflowClient()
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single();

      if (contactError || !contact) {
        console.error("Erro ao buscar contato:", contactError);
        return null;
      }

      // Buscar cards vinculados
      const { data: cards, error: cardsError } = await nexflowClient()
        .from("cards")
        .select("*")
        .eq("contact_id", contactId)
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
        assignedTeamId: card.assigned_team_id,
        assigneeType: card.assigned_to ? 'user' : card.assigned_team_id ? 'team' : 'unassigned',
        contactId: card.contact_id,
        indicationId: card.indication_id,
        position: card.position,
        status: card.status ?? null,
        createdAt: card.created_at,
        cardType: card.card_type ?? 'onboarding',
        product: card.product ?? null,
        value: card.value ? Number(card.value) : null,
      }));

      // Buscar histórico de interações (pode ser expandido no futuro)
      const interactionHistory: Array<{
        id: string;
        type: string;
        description: string;
        createdAt: string;
      }> = [];

      // Adicionar criação do contato ao histórico
      interactionHistory.push({
        id: contact.id,
        type: "created",
        description: "Contato criado",
        createdAt: contact.created_at || new Date().toISOString(),
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
        id: contact.id,
        client_id: contact.client_id,
        client_name: (contact as any).client_name || (contact as any).name || "",
        main_contact: (contact as any).main_contact || "",
        phone_numbers: (contact as any).phone_numbers || [],
        company_names: (contact as any).company_names || [],
        tax_ids: (contact as any).tax_ids || [],
        related_card_ids: linkedCards.map((c) => c.id),
        assigned_team_id: (contact as any).assigned_team_id || null,
        avatar_type: (contact as any).avatar_type,
        avatar_seed: (contact as any).avatar_seed,
        created_at: contact.created_at || new Date().toISOString(),
        updated_at: (contact as any).updated_at || new Date().toISOString(),
        linkedCards,
        interactionHistory,
      };
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}


