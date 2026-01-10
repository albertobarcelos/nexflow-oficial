import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNexflowFlow } from "@/hooks/useNexflowFlows";
import { useCardHistory } from "@/hooks/useCardHistory";
import { isSystemField, SYSTEM_FIELDS } from "@/lib/flowBuilder/systemFields";
import type { NexflowCard, NexflowStepWithFields, CardMovementEntry } from "@/types/nexflow";
import type { CardFormValues } from "../types";

interface UseCardDetailsProps {
  card: NexflowCard | null;
  steps: NexflowStepWithFields[];
  currentFlowId?: string;
}

export function useCardDetails({ card, steps, currentFlowId }: UseCardDetailsProps) {
  const cardFlowId = card?.flowId;
  const cardStepId = card?.stepId;
  const stepExistsInCurrentSteps = cardStepId ? steps.some(s => s.id === cardStepId) : false;
  const needsDifferentFlow = cardFlowId && !stepExistsInCurrentSteps;
  
  const { steps: cardFlowSteps } = useNexflowFlow(needsDifferentFlow ? cardFlowId : undefined);
  
  const effectiveSteps = needsDifferentFlow && cardFlowSteps.length > 0 ? cardFlowSteps : steps;
  
  const currentStep = useMemo(() => {
    if (!card) return null;
    return effectiveSteps.find((step) => step.id === card.stepId) ?? null;
  }, [card, effectiveSteps]);

  const nextStep = useMemo(() => {
    if (!card) return null;
    const currentIndex = effectiveSteps.findIndex((step) => step.id === card.stepId);
    if (currentIndex < 0) return null;
    return effectiveSteps[currentIndex + 1] ?? null;
  }, [card, effectiveSteps]);

  const previousStep = useMemo(() => {
    if (!card) return null;
    const currentIndex = effectiveSteps.findIndex((step) => step.id === card.stepId);
    if (currentIndex <= 0) return null;
    return effectiveSteps[currentIndex - 1] ?? null;
  }, [card, effectiveSteps]);
  
  const { data: cardHistory = [] } = useCardHistory(card?.id, card?.parentCardId);
  
  const isFrozenCard = useMemo(() => {
    if (!card || !currentStep) return false;
    return currentStep.stepType === 'freezing';
  }, [card, currentStep]);

  const isReadOnly = useMemo(() => {
    if (!card || !currentFlowId) return false;
    return card.flowId !== currentFlowId;
  }, [card, currentFlowId]);

  const isDisabled = isFrozenCard || isReadOnly;

  const initialValues = useMemo((): CardFormValues => {
    if (!card) {
      return { title: "", fields: {}, checklist: {}, assignedTo: null, assignedTeamId: null, assigneeType: 'user', agents: [], product: null, value: null };
    }
    
    let responsavelFieldId: string | null = null;
    let responsavelTeamFieldId: string | null = null;
    let agentsFieldId: string | null = null;
    if (currentStep?.fields) {
      for (const field of currentStep.fields) {
        const isResponsavelField = 
          field.fieldType === "user_select" && 
          field.slug === SYSTEM_FIELDS.ASSIGNED_TO;
        if (isResponsavelField) {
          responsavelFieldId = field.id;
        }
        
        const isResponsavelTeamField = 
          field.fieldType === "user_select" && 
          field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID;
        if (isResponsavelTeamField) {
          responsavelTeamFieldId = field.id;
        }
        
        if (!responsavelFieldId && !responsavelTeamFieldId) {
          const isGenericResponsavelField = 
            field.fieldType === "user_select" && 
            field.label.toLowerCase().includes("responsável") &&
            field.slug !== SYSTEM_FIELDS.AGENTS;
          if (isGenericResponsavelField) {
            responsavelFieldId = field.id;
          }
        }
        
        if (field.slug === SYSTEM_FIELDS.AGENTS) {
          agentsFieldId = field.id;
        }
      }
    }
    
    const genericFields: Record<string, string> = {};
    let extractedAssignedTo: string | null = card.assignedTo ?? null;
    let extractedAssignedTeamId: string | null = card.assignedTeamId ?? null;
    
    Object.entries((card.fieldValues as Record<string, string>) ?? {}).forEach(([key, value]) => {
      if (isSystemField(key)) {
        if (key === SYSTEM_FIELDS.ASSIGNED_TO && value) {
          extractedAssignedTo = value;
        }
        if (key === SYSTEM_FIELDS.ASSIGNED_TEAM_ID && value) {
          extractedAssignedTeamId = value;
        }
        return;
      }
      
      if (responsavelTeamFieldId && key === responsavelTeamFieldId && value) {
        extractedAssignedTeamId = value;
        return;
      }
      
      if (responsavelFieldId && key === responsavelFieldId && value) {
        extractedAssignedTo = value;
        return;
      }
      
      if (agentsFieldId && key === agentsFieldId) {
        return;
      }
      
      genericFields[key] = value;
    });
    
    const extractedAgents = card.agents ?? [];
    const assigneeType = extractedAssignedTo ? 'user' : extractedAssignedTeamId ? 'team' : 'user';
    
    return {
      title: card.title,
      fields: genericFields,
      checklist: (card.checklistProgress as Record<string, Record<string, boolean>>) ?? {},
      assignedTo: extractedAssignedTo,
      assignedTeamId: extractedAssignedTeamId,
      assigneeType: assigneeType,
      agents: extractedAgents,
      product: card.product ?? null,
      value: card.value ? Number(card.value) : null,
    };
  }, [card, currentStep]);

  const form = useForm<CardFormValues>({
    defaultValues: initialValues,
    mode: "onChange",
    values: initialValues,
  });

  useEffect(() => {
    if (card) {
      form.reset(initialValues);
    }
  }, [card?.id, initialValues, form]);

  const progressPercentage = useMemo(() => {
    if (!currentStep || !steps.length) return 0;
    const orderedSteps = [...steps].sort((a, b) => a.position - b.position);
    const currentIndex = orderedSteps.findIndex((s) => s.id === currentStep.id);
    if (currentIndex < 0) return 0;
    return ((currentIndex + 1) / orderedSteps.length) * 100;
  }, [currentStep, steps]);

  const timelineSteps = useMemo(() => {
    if (!card || !currentStep) {
      return [];
    }

    const orderedSteps = [...steps].sort((a, b) => a.position - b.position);
    
    const history = cardHistory.filter((entry) => {
      if (!entry.toStepId) return false;
      
      if (entry.actionType === 'complete' || entry.actionType === 'cancel') {
        return true;
      }
      
      return entry.toStepId !== card.stepId;
    });

    if (history.length === 0) {
      return orderedSteps
        .filter((step) => step.position < currentStep.position)
        .map((step) => ({
          entry: {
            id: `${card.id}-${step.id}-fallback`,
            fromStepId: null,
            toStepId: step.id,
            movedAt: card.createdAt,
            movedBy: null,
          } as CardMovementEntry,
          step,
        }));
    }

    const stepMap = new Map<string, NexflowStepWithFields>();
    orderedSteps.forEach((step) => stepMap.set(step.id, step));
    return history.map((entry) => ({
      entry,
      step: entry.toStepId ? stepMap.get(entry.toStepId) : undefined,
    })).filter((item) => item.step);
  }, [card, currentStep, steps, cardHistory]);

  const lastHistoryUpdate = useMemo(() => {
    if (!card || !timelineSteps.length) return null;
    const lastEntry = timelineSteps[timelineSteps.length - 1];
    return format(new Date(lastEntry.entry.movedAt), "dd/MM", { locale: ptBR });
  }, [card, timelineSteps]);

  return {
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
  };
}

