import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import { NexflowCard } from "@/types/nexflow";
import { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { CardStepAction } from "@/types/nexflow";
import { Database, Json } from "@/types/database";
import { ProcessTimeline } from "./ProcessTimeline";
import { ProcessDetails } from "./ProcessDetails";
import { Loader2 } from "lucide-react";

type StepActionRow = Database["public"]["Tables"]["step_actions"]["Row"];

interface ProcessesViewProps {
  card: NexflowCard | null;
  steps: NexflowStepWithFields[];
}

interface ProcessWithAction extends CardStepAction {
  stepAction: StepActionRow | null;
}

export function ProcessesView({ card, steps }: ProcessesViewProps) {
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  // Buscar card_step_actions do card
  const { data: cardStepActions = [], isLoading: isLoadingActions, error: cardStepActionsError } = useQuery({
    queryKey: ["nexflow", "card_step_actions", card?.id],
    enabled: Boolean(card?.id),
    queryFn: async (): Promise<CardStepAction[]> => {
      if (!card?.id) {
        console.warn("[ProcessesView] Card ID não fornecido");
        return [];
      }

      console.log("[ProcessesView] Buscando processos para card:", card.id);

      const { data, error } = await nexflowClient()
        .from("card_step_actions")
        .select("*")
        .eq("card_id", card.id)
        .order("scheduled_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[ProcessesView] Erro ao carregar processos:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          cardId: card.id,
        });
        throw error;
      }

      if (!data) {
        console.warn("[ProcessesView] Nenhum dado retornado da query para card:", card.id);
        return [];
      }

      console.log(`[ProcessesView] ${data.length} processo(s) encontrado(s) para card:`, card.id);

      return data.map((row) => ({
        id: row.id,
        cardId: row.card_id,
        stepActionId: row.step_action_id,
        stepId: row.step_id,
        status: row.status as CardStepAction["status"],
        scheduledDate: row.scheduled_date,
        completedAt: row.completed_at,
        completedBy: row.completed_by,
        notes: row.notes,
        executionData: (row.execution_data as Record<string, Json | undefined>) || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });

  // Buscar dados completos dos step_actions
  const stepActionIds = useMemo(
    () => cardStepActions.map((csa) => csa.stepActionId).filter(Boolean),
    [cardStepActions]
  );

  const { data: stepActions = [], isLoading: isLoadingStepActions, error: stepActionsError } = useQuery({
    queryKey: ["nexflow", "step_actions", "by-ids", stepActionIds],
    enabled: stepActionIds.length > 0,
    queryFn: async (): Promise<StepActionRow[]> => {
      if (stepActionIds.length === 0) {
        console.log("[ProcessesView] Nenhum stepActionId para buscar");
        return [];
      }

      console.log("[ProcessesView] Buscando detalhes de step_actions:", stepActionIds);

      const { data, error } = await nexflowClient()
        .from("step_actions")
        .select("*")
        .in("id", stepActionIds);

      if (error) {
        console.error("[ProcessesView] Erro ao carregar detalhes dos processos:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          stepActionIds,
        });
        throw error;
      }

      if (!data) {
        console.warn("[ProcessesView] Nenhum dado retornado da query de step_actions");
        return [];
      }

      console.log(`[ProcessesView] ${data.length} step_action(s) encontrado(s)`);

      return data;
    },
  });

  // Combinar card_step_actions com step_actions
  const processesWithActions: ProcessWithAction[] = useMemo(() => {
    const stepActionsMap = new Map<string, StepActionRow>(
      stepActions.map((sa) => [sa.id, sa] as [string, StepActionRow])
    );
    return cardStepActions.map((csa) => ({
      ...csa,
      stepAction: stepActionsMap.get(csa.stepActionId) || null,
    }));
  }, [cardStepActions, stepActions]);

  // Obter processo selecionado
  const selectedProcess = useMemo(() => {
    if (!selectedProcessId) return null;
    return processesWithActions.find((p) => p.id === selectedProcessId) || null;
  }, [selectedProcessId, processesWithActions]);

  // Auto-selecionar primeiro processo quando carregar
  useEffect(() => {
    if (!selectedProcessId && processesWithActions.length > 0) {
      const firstActive = processesWithActions.find(
        (p) => p.status === "pending" || p.status === "in_progress"
      ) || processesWithActions[0];
      if (firstActive) {
        setSelectedProcessId(firstActive.id);
      }
    }
  }, [selectedProcessId, processesWithActions]);

  if (!card) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum card selecionado
        </p>
      </div>
    );
  }

  // Log de erros para debug
  useEffect(() => {
    if (cardStepActionsError) {
      console.error("[ProcessesView] Erro ao carregar card_step_actions:", cardStepActionsError);
    }
    if (stepActionsError) {
      console.error("[ProcessesView] Erro ao carregar step_actions:", stepActionsError);
    }
  }, [cardStepActionsError, stepActionsError]);

  if (isLoadingActions || isLoadingStepActions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Mostrar erro se houver
  if (cardStepActionsError || stepActionsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-red-500 dark:text-red-400 mb-2">
            Erro ao carregar processos
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {cardStepActionsError?.message || stepActionsError?.message || "Erro desconhecido"}
          </p>
        </div>
      </div>
    );
  }

  if (processesWithActions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum processo encontrado para este card
          </p>
          {card?.id && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Card ID: {card.id}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Sidebar esquerda com Day e Activity */}
      <ProcessTimeline
        processes={processesWithActions}
        selectedProcessId={selectedProcessId}
        onSelectProcess={setSelectedProcessId}
        card={card}
      />

      {/* Área principal com detalhes do processo */}
      {selectedProcess && card ? (
        <ProcessDetails process={selectedProcess} card={card} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecione um processo para visualizar os detalhes
          </p>
        </div>
      )}
    </div>
  );
}
