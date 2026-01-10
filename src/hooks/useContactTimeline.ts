import { useQuery } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface TimelineEvent {
  id: string;
  type: "contact_created" | "card_created" | "card_moved" | "card_completed" | "card_cancelled";
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    cardId?: string;
    cardTitle?: string;
    flowId?: string;
    flowName?: string;
    fromStepId?: string | null;
    fromStepTitle?: string | null;
    toStepId?: string | null;
    toStepTitle?: string | null;
    movementDirection?: "forward" | "backward" | "same";
    userName?: string | null;
  };
}

/**
 * Hook para buscar timeline completa do contato
 * Inclui: criação do contato, cards vinculados, histórico de movimentação de cada card
 */
export function useContactTimeline(contactId: string | null) {
  return useQuery({
    queryKey: ["contact-timeline", contactId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!contactId) return [];

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      const events: TimelineEvent[] = [];

      // 1. Buscar dados do contato
      const { data: contact, error: contactError } = await nexflowClient()
        .from("contacts")
        .select("id, client_name, created_at")
        .eq("id", contactId)
        .eq("client_id", clientId)
        .single();

      if (contactError || !contact) {
        console.error("Erro ao buscar contato:", contactError);
        return [];
      }

      // Adicionar evento de criação do contato
      events.push({
        id: `contact-${contact.id}`,
        type: "contact_created",
        title: "Contato criado",
        description: `Contato "${contact.client_name}" foi criado`,
        timestamp: contact.created_at || new Date().toISOString(),
      });

      // 2. Buscar cards vinculados ao contato
      const { data: cards, error: cardsError } = await nexflowClient()
        .from("cards")
        .select(
          `
          id,
          title,
          created_at,
          flow_id,
          flow:flows(
            id,
            name
          )
        `
        )
        .eq("contact_id", contactId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (cardsError) {
        console.error("Erro ao buscar cards:", cardsError);
      }

      // Adicionar eventos de criação de cards
      (cards || []).forEach((card: any) => {
        const flowName = card.flow?.name || "Flow desconhecido";
        events.push({
          id: `card-created-${card.id}`,
          type: "card_created",
          title: "Card criado",
          description: `Card "${card.title}" foi criado no flow "${flowName}"`,
          timestamp: card.created_at,
          metadata: {
            cardId: card.id,
            cardTitle: card.title,
            flowId: card.flow_id,
            flowName: flowName,
          },
        });
      });

      // 3. Buscar histórico de movimentação de cada card
      const cardIds = (cards || []).map((c: any) => c.id);
      
      if (cardIds.length > 0) {
        const { data: cardHistory, error: historyError } = await nexflowClient()
          .from("card_history")
          .select(
            `
            id,
            card_id,
            from_step_id,
            to_step_id,
            created_at,
            created_by,
            action_type,
            movement_direction,
            from_step_position,
            to_step_position,
            details,
            from_step:steps!card_history_from_step_id_fkey(
              id,
              title,
              position
            ),
            to_step:steps!card_history_to_step_id_fkey(
              id,
              title,
              position
            )
          `
          )
          .in("card_id", cardIds)
          .eq("client_id", clientId)
          .order("created_at", { ascending: true });

        if (historyError) {
          console.error("Erro ao buscar histórico:", historyError);
        }

        // Adicionar eventos de movimentação
        (cardHistory || []).forEach((history: any) => {
          const card = (cards || []).find((c: any) => c.id === history.card_id);
          const fromStepTitle = history.from_step?.title || (history.details as any)?.from_step_title || "Etapa anterior";
          const toStepTitle = history.to_step?.title || (history.details as any)?.to_step_title || "Etapa atual";
          const userName = (history.details as any)?.user_name || null;

          let eventType: TimelineEvent["type"] = "card_moved";
          let title = "Card movido";
          let description = `Card "${card?.title || "Desconhecido"}" moveu de "${fromStepTitle}" para "${toStepTitle}"`;

          if (history.action_type === "complete") {
            eventType = "card_completed";
            title = "Card concluído";
            description = `Card "${card?.title || "Desconhecido"}" foi concluído na etapa "${toStepTitle}"`;
          } else if (history.action_type === "cancel") {
            eventType = "card_cancelled";
            title = "Card cancelado";
            description = `Card "${card?.title || "Desconhecido"}" foi cancelado`;
          } else if (history.movement_direction === "backward") {
            title = "Card regrediu";
            description = `Card "${card?.title || "Desconhecido"}" regrediu de "${fromStepTitle}" para "${toStepTitle}"`;
          }

          if (userName) {
            description += ` por ${userName}`;
          }

          events.push({
            id: `history-${history.id}`,
            type: eventType,
            title,
            description,
            timestamp: history.created_at,
            metadata: {
              cardId: history.card_id,
              cardTitle: card?.title,
              flowId: card?.flow_id,
              flowName: card?.flow?.name,
              fromStepId: history.from_step_id,
              fromStepTitle,
              toStepId: history.to_step_id,
              toStepTitle,
              movementDirection: history.movement_direction || "forward",
              userName,
            },
          });
        });
      }

      // Ordenar eventos por timestamp (mais antigo primeiro)
      events.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return events;
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

