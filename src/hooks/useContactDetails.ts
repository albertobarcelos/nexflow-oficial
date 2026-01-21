import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import { Contact } from "@/hooks/useOpportunities";
import { NexflowCard } from "@/types/nexflow";
import type { Json } from "@/types/database";

export interface ContactDetails extends Contact {
  linkedCards: NexflowCard[];
  interactionHistory: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
  indicated_by: string | null;
  contact_type: ("cliente" | "parceiro")[] | null;
  indicated_by_contact?: {
    id: string;
    client_name: string;
    main_contact: string | null;
  } | null;
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
        .from("contacts" as any)
        .select("*")
        .eq("id", contactId)
        .single();

      if (contactError || !contact) {
        console.error("Erro ao buscar contato:", contactError);
        return null;
      }

      // Buscar contato indicador separadamente (auto-referência não funciona com PostgREST)
      let indicatedByContact = null;
      if ((contact as any).indicated_by) {
        const { data: indicatedByData } = await nexflowClient()
          .from("contacts" as any)
          .select("id, client_name, main_contact")
          .eq("id", (contact as any).indicated_by)
          .single();
        
        if (indicatedByData) {
          indicatedByContact = indicatedByData;
        }
      }

      // Empresas agora são armazenadas apenas no array company_names da tabela contacts

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
        fieldValues: (card.field_values as Record<string, Json | undefined>) ?? {},
        checklistProgress: (card.checklist_progress as Record<string, Json | undefined>) ?? {},
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
      const contactData = contact as any;
      interactionHistory.push({
        id: contactData.id,
        type: "created",
        description: "Contato criado",
        createdAt: contactData.created_at || new Date().toISOString(),
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
        id: contactData.id,
        client_id: contactData.client_id,
        client_name: contactData.client_name || contactData.name || "",
        main_contact: contactData.main_contact || "",
        phone_numbers: contactData.phone_numbers || [],
        company_names: contactData.company_names || [],
        tax_ids: contactData.tax_ids || [],
        related_card_ids: linkedCards.map((c) => c.id),
        assigned_team_id: contactData.assigned_team_id || null,
        avatar_type: contactData.avatar_type,
        avatar_seed: contactData.avatar_seed,
        created_at: contactData.created_at || new Date().toISOString(),
        updated_at: contactData.updated_at || new Date().toISOString(),
        indicated_by: contactData.indicated_by || null,
        contact_type: contactData.contact_type || null,
        indicated_by_contact: indicatedByContact || null,
        linkedCards,
        interactionHistory,
      };
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}


