import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GitBranch, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { NexflowCard } from "@/types/nexflow";
import { ParentCardViewModal } from "./ParentCardViewModal";

interface ParentCardWidgetProps {
  parentCardId: string | null | undefined;
  onOpenParentCard?: (card: NexflowCard) => void;
}

export function ParentCardWidget({
  parentCardId,
  onOpenParentCard,
}: ParentCardWidgetProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: parentCard, isLoading, error: parentCardError } = useQuery({
    queryKey: ["nexflow", "card", parentCardId],
    queryFn: async () => {
      if (!parentCardId) return null;

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return null;
      }

      const { data, error } = await nexflowClient()
        .from("cards")
        .select("*")
        .eq("id", parentCardId)
        .eq("client_id", clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar card pai:", error);
        throw error;
      }

      if (!data) {
        return null;
      }

      // Mapear para NexflowCard
      return {
        id: data.id,
        flowId: data.flow_id,
        stepId: data.step_id,
        clientId: data.client_id,
        title: data.title,
        fieldValues: (data.field_values as Record<string, unknown>) ?? {},
        checklistProgress: (data.checklist_progress as Record<string, unknown>) ?? {},
        movementHistory: [],
        parentCardId: data.parent_card_id ?? null,
        assignedTo: data.assigned_to ?? null,
        assignedTeamId: data.assigned_team_id ?? null,
        assigneeType: data.assigned_to ? 'user' : data.assigned_team_id ? 'team' : 'unassigned',
        agents: Array.isArray(data.agents) ? data.agents : [],
        contactId: data.contact_id ?? null,
        position: data.position ?? 0,
        status: data.status ?? null,
        createdAt: data.created_at,
        cardType: data.card_type ?? 'onboarding',
        product: data.product ?? null,
        value: data.value ? Number(data.value) : null,
      } as NexflowCard;
    },
    enabled: !!parentCardId,
    retry: 1,
  });

  const { data: parentStep } = useQuery({
    queryKey: ["nexflow", "step", parentCard?.step_id],
    queryFn: async () => {
      if (!parentCard?.step_id) return null;

      const clientId = await getCurrentClientId();
      if (!clientId) return null;

      const { data, error } = await nexflowClient()
        .from("steps")
        .select("id, title, color")
        .eq("id", parentCard.step_id)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    },
    enabled: !!parentCard?.step_id,
  });

  if (!parentCardId) {
    return null;
  }

  const handleOpenParentCard = () => {
    if (parentCard && onOpenParentCard) {
      onOpenParentCard(parentCard);
      setIsPopoverOpen(false);
    } else if (parentCardError) {
      toast.error("Não foi possível carregar o card pai");
    }
  };

  const handleBadgeClick = () => {
    if (parentCard) {
      setIsViewModalOpen(true);
    } else if (parentCardError) {
      toast.error("Não foi possível carregar o card pai");
    } else if (isLoading) {
      // Se ainda estiver carregando, abrir popover para mostrar loading
      setIsPopoverOpen(true);
    }
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2 px-3 py-1.5"
            onClick={handleBadgeClick}
          >
            <GitBranch className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Card Pai</span>
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Card Pai
              </h4>
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : parentCardError ? (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro ao carregar card pai</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {parentCard?.title || "Card não encontrado"}
                </p>
              )}
            </div>
            {parentStep && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: parentStep.color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {parentStep.title}
                </span>
              </div>
            )}
            {parentCard && onOpenParentCard && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleOpenParentCard}
              >
                Abrir Card Pai (Edição)
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal de visualização somente leitura */}
      {parentCard && (
        <ParentCardViewModal
          card={parentCard}
          open={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </>
  );
}

