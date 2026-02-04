import { useQuery } from "@tanstack/react-query";
import { getCurrentClientId, nexflowClient } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
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

/**
 * Hook para detalhes do contato. Isolado por client_id: queryKey com clientId,
 * filtro por client_id na busca e validação dupla no retorno.
 */
export function useContactDetails(contactId: string | null | undefined) {
  const { currentClient } = useClientStore();
  const clientId = currentClient?.id ?? null;

  return useQuery({
    queryKey: ["contact-details", clientId, contactId],
    queryFn: async (): Promise<ContactDetails | null> => {
      if (!contactId) {
        return null;
      }

      const currentClientId = await getCurrentClientId();
      if (!currentClientId) {
        return null;
      }

      // Buscar contato restrito ao cliente atual
      const { data: contact, error: contactError } = await nexflowClient()
        .from("contacts" as any)
        .select("*")
        .eq("id", contactId)
        .eq("client_id", currentClientId)
        .single();

      if (contactError || !contact) {
        console.error("Erro ao buscar contato:", contactError);
        return null;
      }

      // Validação dupla: contato deve pertencer ao cliente atual
      const contactData = contact as { client_id?: string };
      if (contactData.client_id !== currentClientId) {
        console.error("[SECURITY] useContactDetails: contato de outro cliente detectado.");
        return null;
      }

      // Buscar contato indicador separadamente (auto-referência não funciona com PostgREST); mesmo client_id
      let indicatedByContact = null;
      if ((contact as any).indicated_by) {
        const { data: indicatedByData } = await nexflowClient()
          .from("contacts" as any)
          .select("id, client_name, main_contact")
          .eq("id", (contact as any).indicated_by)
          .eq("client_id", currentClientId)
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

      // Montar resultado (contactData já definido acima para validação)
      const contactPayload = contact as any;
      interactionHistory.push({
        id: contactPayload.id,
        type: "created",
        description: "Contato criado",
        createdAt: contactPayload.created_at || new Date().toISOString(),
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
        id: contactPayload.id,
        client_id: contactPayload.client_id,
        client_name: contactPayload.client_name || contactPayload.name || "",
        main_contact: contactPayload.main_contact || "",
        phone_numbers: contactPayload.phone_numbers || [],
        company_names: contactPayload.company_names || [],
        tax_ids: contactPayload.tax_ids || [],
        related_card_ids: linkedCards.map((c) => c.id),
        assigned_team_id: contactPayload.assigned_team_id || null,
        avatar_type: contactPayload.avatar_type,
        avatar_seed: contactPayload.avatar_seed,
        created_at: contactPayload.created_at || new Date().toISOString(),
        updated_at: contactPayload.updated_at || new Date().toISOString(),
        indicated_by: contactPayload.indicated_by || null,
        contact_type: contactPayload.contact_type || null,
        indicated_by_contact: indicatedByContact || null,
        linkedCards,
        interactionHistory,
      };
    },
    enabled: !!contactId && !!clientId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}


