import { useState, useCallback, useEffect, useMemo } from "react";
import { X, Workflow, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CardDetailsHeader } from "./CardDetailsHeader";
import { CardDetailsSidebar } from "./CardDetailsSidebar";
import { CardOverviewTab } from "./CardOverviewTab";
import { CardHistoryTab } from "./CardHistoryTab";
import { CardFieldsTab } from "./CardFieldsTab";
import { CardActions } from "./CardActions";
import { useCardDetails } from "../hooks/useCardDetails";
import { useCardForm } from "../hooks/useCardForm";
import { useCardValidation } from "../hooks/useCardValidation";
import { CardAttachments } from "@/components/crm/flows/CardAttachments";
import { CardComments } from "@/components/crm/flows/CardComments";
import { ProcessDetails } from "@/components/crm/flows/ProcessDetails";
import { toast } from "sonner";
import type { NexflowCard, CardStepAction } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { CardFormValues, ActiveSection, SaveStatus } from "../types";
import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type StepActionRow = Database["public"]["Tables"]["step_actions"]["Row"];

interface ProcessWithAction extends CardStepAction {
  stepAction: StepActionRow | null;
}

interface CardDetailsModalProps {
  card: NexflowCard | null;
  steps: NexflowStepWithFields[];
  onClose: () => void;
  onSave: (card: NexflowCard, values: CardFormValues) => Promise<void>;
  onMoveNext: (card: NexflowCard, values: CardFormValues) => Promise<void>;
  onDelete?: (cardId: string) => Promise<void>;
  onUpdateCard?: (input: { id: string; stepId?: string }) => Promise<void>;
  subtaskCount: number;
  parentTitle?: string | null;
  onOpenParentCard?: (card: NexflowCard) => void;
  currentFlowId?: string;
}

export function CardDetailsModal({
  card,
  steps,
  onClose,
  onSave,
  onMoveNext,
  onDelete,
  onUpdateCard,
  subtaskCount,
  parentTitle,
  onOpenParentCard,
  currentFlowId,
}: CardDetailsModalProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isMoving, setIsMoving] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [activeTab, setActiveTab] = useState<"informacoes" | "processos">("informacoes");
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const {
    currentStep,
    nextStep,
    previousStep,
    isFrozenCard,
    isReadOnly,
    isDisabled,
    form,
    progressPercentage,
    timelineSteps,
    lastHistoryUpdate,
    effectiveSteps,
  } = useCardDetails({ card, steps, currentFlowId });

  const { handleCheckboxChange, handleDateChange } = useCardForm({ form, isDisabled });

  const { isMoveDisabled } = useCardValidation({
    form,
    currentStep,
    nextStep,
  });

  const { data: cardStepActions = [] } = useQuery({
    queryKey: ["nexflow", "card_step_actions", card?.id],
    enabled: Boolean(card?.id),
    queryFn: async () => {
      if (!card?.id) return [];
      const { data, error } = await nexflowClient()
        .from("card_step_actions")
        .select("*")
        .eq("card_id", card.id)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
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
        executionData: (row.execution_data as Record<string, any>) || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });

  const stepActionIds = useMemo(
    () => cardStepActions.map((csa) => csa.stepActionId).filter(Boolean),
    [cardStepActions]
  );

  const { data: stepActions = [] } = useQuery({
    queryKey: ["nexflow", "step_actions", "by-ids", stepActionIds],
    enabled: stepActionIds.length > 0,
    queryFn: async () => {
      if (stepActionIds.length === 0) return [];
      const { data, error } = await nexflowClient()
        .from("step_actions")
        .select("*")
        .in("id", stepActionIds);
      if (error) throw error;
      return data;
    },
  });

  const processesWithActions: ProcessWithAction[] = useMemo(() => {
    const stepActionsMap = new Map<string, StepActionRow>(
      stepActions.map((sa) => [sa.id, sa] as [string, StepActionRow])
    );
    return cardStepActions.map((csa) => ({
      ...csa,
      stepAction: stepActionsMap.get(csa.stepActionId) || null,
    }));
  }, [cardStepActions, stepActions]);

  const selectedProcess = useMemo(() => {
    if (!selectedProcessId) return null;
    return processesWithActions.find((p) => p.id === selectedProcessId) ?? null;
  }, [selectedProcessId, processesWithActions]);

  useEffect(() => {
    if (activeSection === "processes") {
      setActiveTab("processos");
    } else {
      setActiveTab("informacoes");
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "processes" && !selectedProcessId && processesWithActions.length > 0) {
      const firstActive = processesWithActions.find(
        (p) => p.status === "pending" || p.status === "in_progress"
      ) || processesWithActions[0];
      if (firstActive) {
        setSelectedProcessId(firstActive.id);
      }
    }
  }, [activeSection, selectedProcessId, processesWithActions]);

  const renderTimelineFieldValue = useCallback((field: any) => {
    if (field.fieldType === "checklist") {
      const progress = card?.checklistProgress?.[field.id] as Record<string, boolean> | undefined;
      const items = field.configuration.items ?? [];
      const checkedCount = items.filter((item: string) => progress?.[item] === true).length;
      return (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
          {checkedCount} de {items.length} itens concluídos
        </p>
      );
    }
    if (field.fieldType === "date") {
      const value = card?.fieldValues?.[field.id];
      if (!value) return <p className="text-xs text-gray-400 italic mt-0.5">Não preenchido</p>;
      try {
        // Validar que o valor é string ou número antes de converter
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {date.toLocaleDateString("pt-BR")}
              </p>
            );
          }
        }
        return <p className="text-xs text-gray-400 italic mt-0.5">Data inválida</p>;
      } catch {
        return <p className="text-xs text-gray-400 italic mt-0.5">Data inválida</p>;
      }
    }
    const value = card?.fieldValues?.[field.id];
    if (!value) return <p className="text-xs text-gray-400 italic mt-0.5">Não preenchido</p>;
    return (
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 break-words">
        {String(value)}
      </p>
    );
  }, [card]);

  const handleSave = useCallback(async () => {
    if (!card || saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      const values = form.getValues();
      const formValues: CardFormValues = {
        ...values,
        assignedTo: values.assignedTo !== undefined ? values.assignedTo : null,
        assignedTeamId: values.assignedTeamId !== undefined ? values.assignedTeamId : null,
      };
      await onSave(card, formValues);
      setSaveStatus("saved");
      form.reset(formValues);
      setTimeout(() => {
        setSaveStatus((current) => (current === "saved" ? "idle" : current));
      }, 2000);
    } catch (error) {
      console.error("[Save] Erro ao salvar:", error);
      setSaveStatus("idle");
    }
  }, [card, form, onSave, saveStatus]);

  const handleMoveNext = useCallback(async () => {
    if (!card || !nextStep || isMoveDisabled || isMoving) return;
    setIsMoving(true);
    try {
      const currentValues = form.getValues();
      if (form.formState.isDirty) {
        await onSave(card, currentValues);
      }
      await onMoveNext(card, currentValues);
    } catch (error) {
      console.error("[Move] Erro na movimentação:", error);
    } finally {
      setIsMoving(false);
    }
  }, [card, nextStep, isMoveDisabled, isMoving, form, onSave, onMoveNext]);

  const handleMoveBack = useCallback(async () => {
    if (!card || !previousStep || isMoving || !onUpdateCard) return;
    setIsMoving(true);
    try {
      const currentValues = form.getValues();
      if (form.formState.isDirty) {
        await onSave(card, currentValues);
      }
      await onUpdateCard({
        id: card.id,
        stepId: previousStep.id,
      });
      onClose();
    } catch (error) {
      console.error("[MoveBack] Erro:", error);
    } finally {
      setIsMoving(false);
    }
  }, [card, previousStep, isMoving, form, onSave, onUpdateCard, onClose]);

  const handleDelete = useCallback(async () => {
    if (!card || !onDelete) return;
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar o card "${card.title}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;
    try {
      await onDelete(card.id);
      onClose();
    } catch (error) {
      console.error("[Delete] Erro:", error);
    }
  }, [card, onDelete, onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  const renderSectionContent = () => {
    if (!card) return null;

    switch (activeSection) {
      case "overview":
        return (
          <CardOverviewTab
            card={card}
            currentStep={currentStep}
            subtaskCount={subtaskCount}
            parentTitle={parentTitle}
          />
        );
      case "history":
        return (
          <CardHistoryTab
            card={card}
            timelineSteps={timelineSteps}
            renderTimelineFieldValue={renderTimelineFieldValue}
          />
        );
      case "fields":
        return (
          <CardFieldsTab
            card={card}
            currentStep={currentStep}
            form={form}
            isDisabled={isDisabled}
            onCheckboxChange={handleCheckboxChange}
            onDateChange={handleDateChange}
          />
        );
      case "attachments":
        return (
          <div className="space-y-4">
            <CardAttachments cardId={card.id} />
          </div>
        );
      case "comments":
        return (
          <div className="h-full">
            <CardComments cardId={card.id} />
          </div>
        );
      case "processes":
        if (selectedProcess) {
          return <ProcessDetails process={selectedProcess} card={card} />;
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecione um processo na sidebar para visualizar os detalhes
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!card) {
    return null;
  }

  return (
    <Dialog open={Boolean(card)} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[900px] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 p-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogTitle className="sr-only">Detalhes do Card: {card.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Visualize e edite os detalhes do card, incluindo campos, histórico e processos
        </DialogDescription>

        <div className="flex h-full flex-col bg-white dark:bg-gray-900">
          <CardDetailsHeader
            card={card}
            currentStep={currentStep}
            onClose={onClose}
            onOpenParentCard={onOpenParentCard}
          />

          <div className="flex flex-1 overflow-hidden">
            <CardDetailsSidebar
              activeTab={activeTab}
              activeSection={activeSection}
              setActiveTab={setActiveTab}
              setActiveSection={setActiveSection}
              card={card}
              selectedProcessId={selectedProcessId}
              setSelectedProcessId={setSelectedProcessId}
              lastHistoryUpdate={lastHistoryUpdate}
              progressPercentage={progressPercentage}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 p-6">
              {isReadOnly && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3">
                  <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Este card pertence a outro flow. Você pode visualizar, mas não pode editar.
                  </p>
                </div>
              )}
              {isFrozenCard && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
                  <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Este card está congelado e não pode ser editado.
                  </p>
                </div>
              )}
              {renderSectionContent()}
            </div>
          </div>

          <CardActions
            saveStatus={saveStatus}
            isMoving={isMoving}
            isMoveDisabled={isMoveDisabled}
            hasNextStep={Boolean(nextStep)}
            hasPreviousStep={Boolean(previousStep)}
            isDisabled={isDisabled}
            onSave={handleSave}
            onMoveNext={handleMoveNext}
            onMoveBack={handleMoveBack}
            onDelete={handleDelete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { CardFormValues } from "../types";

