import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  fieldLibrary,
  FlowBuilderFieldDefinition,
  getFieldDefinition,
} from "@/lib/flowBuilder/fieldLibrary";
import { useNexflowFlow, useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import {
  CreateStepFieldInput,
  UpdateStepFieldInput,
  useNexflowStepFields,
} from "@/hooks/useNexflowStepFields";
import {
  NexflowFlow,
  NexflowStep,
  NexflowStepField,
  StepFieldConfiguration,
} from "@/types/nexflow";

export interface FlowDraft {
  name: string;
  description: string;
  isActive: boolean;
}

export interface UseFlowBuilderStateReturn {
  flow: NexflowFlow | null;
  flowDraft: FlowDraft;
  updateFlowDraft: (updates: Partial<FlowDraft>) => void;
  steps: NexflowStep[];
  activeStepId: string | null;
  activeStep: NexflowStep | null;
  selectStep: (stepId: string) => void;
  createStep: (payload: { title: string; color: string }) => Promise<void>;
  renameStep: (stepId: string, title: string) => Promise<void>;
  deleteStep: (stepId: string) => Promise<void>;
  reorderSteps: (orderedIds: string[]) => Promise<void>;
  fields: NexflowStepField[];
  selectedFieldId: string | null;
  selectedField: NexflowStepField | null;
  selectField: (fieldId: string | null) => void;
  createFieldFromLibrary: (
    definitionId: string,
    targetIndex?: number
  ) => Promise<void>;
  updateField: (input: UpdateStepFieldInput) => Promise<void>;
  updateFieldConfiguration: (
    fieldId: string,
    configuration: StepFieldConfiguration
  ) => Promise<void>;
  duplicateField: (fieldId: string) => Promise<void>;
  deleteField: (fieldId: string) => Promise<void>;
  reorderFields: (orderedIds: string[]) => Promise<void>;
  availableFields: FlowBuilderFieldDefinition[];
  isLoading: boolean;
  isSaving: boolean;
  hasPendingChanges: boolean;
  pendingMutations: number;
  saveAll: () => Promise<void>;
}

export function useFlowBuilderState(
  flowId?: string
): UseFlowBuilderStateReturn {
  const { flow, isLoading: isFlowLoading } = useNexflowFlow(flowId);
  const {
    steps,
    createStep,
    updateStep,
    deleteStep,
    reorderSteps,
    isLoading: isStepsLoading,
  } = useNexflowSteps(flowId);

  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const previousStepsLength = useRef(0);

  useEffect(() => {
    if (!steps.length) {
      setActiveStepId(null);
      previousStepsLength.current = 0;
      return;
    }

    const currentStepExists = steps.some((step) => step.id === activeStepId);

    if (!activeStepId || !currentStepExists) {
      setActiveStepId(steps[0].id);
    } else if (steps.length > previousStepsLength.current) {
      setActiveStepId(steps[steps.length - 1].id);
    }

    previousStepsLength.current = steps.length;
  }, [steps, activeStepId]);

  const activeStep = useMemo(
    () => steps.find((step) => step.id === activeStepId) ?? null,
    [steps, activeStepId]
  );

  const {
    fields,
    createField,
    updateField,
    deleteField,
    reorderFields,
    isLoading: isFieldsLoading,
  } = useNexflowStepFields(activeStepId ?? undefined);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedFieldId(null);
  }, [activeStepId]);

  useEffect(() => {
    if (
      selectedFieldId &&
      !fields.some((field) => field.id === selectedFieldId)
    ) {
      setSelectedFieldId(null);
    }
  }, [fields, selectedFieldId]);

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId]
  );

  const [flowDraft, setFlowDraft] = useState<FlowDraft>({
    name: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (flow) {
      setFlowDraft({
        name: flow.name ?? "",
        description: flow.description ?? "",
        isActive: flow.isActive,
      });
      setHasLocalChanges(false);
    }
  }, [flow?.id, flow?.name, flow?.description, flow?.isActive]);

  const { updateFlow } = useNexflowFlows();
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const mutationPromisesRef = useRef<Promise<unknown>[]>([]);
  const [pendingMutations, setPendingMutations] = useState(0);

  const trackMutation = useCallback(
    <T,>(promise: Promise<T>): Promise<T> => {
      mutationPromisesRef.current = [...mutationPromisesRef.current, promise];
      setHasLocalChanges(true);
      setPendingMutations((count) => count + 1);

      const finalize = () => {
        mutationPromisesRef.current = mutationPromisesRef.current.filter(
          (item) => item !== promise
        );
        setPendingMutations((count) => Math.max(count - 1, 0));
      };

      promise.then(finalize).catch(finalize);

      return promise;
    },
    []
  );

  const waitForPendingMutations = useCallback(async () => {
    if (!mutationPromisesRef.current.length) {
      return;
    }

    const snapshot = [...mutationPromisesRef.current];
    await Promise.allSettled(snapshot);
  }, []);

  const handleCreateStep = useCallback(
    async ({ title, color }: { title: string; color: string }) => {
      const stepTitle =
        title.trim() || `Etapa ${String(steps.length + 1).padStart(2, "0")}`;
      const createdStep = await trackMutation(
        createStep({
          title: stepTitle,
          color,
        })
      );
      if (createdStep?.id) {
        setActiveStepId(createdStep.id);
      }
    },
    [createStep, steps.length, trackMutation]
  );

  const handleRenameStep = useCallback(
    async (stepId: string, title: string) => {
      await trackMutation(
        updateStep({
          id: stepId,
          title: title.trim(),
        })
      );
    },
    [updateStep, trackMutation]
  );

  const handleDeleteStep = useCallback(
    async (stepId: string) => {
      if (steps.length <= 1) {
        toast.error("O flow precisa de pelo menos uma etapa.");
        return;
      }
      await trackMutation(deleteStep(stepId));
    },
    [deleteStep, steps.length, trackMutation]
  );

  const handleReorderSteps = useCallback(
    async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        position: index,
      }));

      await trackMutation(
        reorderSteps({
          updates,
        })
      );
    },
    [reorderSteps, trackMutation]
  );

  const handleSelectStep = useCallback((stepId: string) => {
    setActiveStepId(stepId);
  }, []);

  const handleSelectField = useCallback((fieldId: string | null) => {
    setSelectedFieldId(fieldId);
  }, []);

  const nextPosition = useCallback(
    (targetIndex?: number) => {
      if (typeof targetIndex === "number") {
        return targetIndex;
      }
      if (!fields.length) {
        return 0;
      }
      return fields[fields.length - 1].position + 1;
    },
    [fields]
  );

  const handleCreateFieldFromLibrary = useCallback(
    async (definitionId: string, targetIndex?: number) => {
      if (!activeStepId) {
        toast.error("Selecione uma etapa antes de adicionar campos.");
        return;
      }

      const definition = getFieldDefinition(definitionId);

      if (!definition) {
        toast.error("Tipo de campo não encontrado.");
        return;
      }

      const payload: CreateStepFieldInput = {
        stepId: activeStepId,
        label: definition.defaultLabel,
        fieldType: definition.fieldType,
        configuration: definition.defaultConfiguration(),
        position: nextPosition(targetIndex),
      };

      try {
        const newField = await trackMutation(createField(payload));

        if (typeof targetIndex === "number") {
          const orderedIds = fields.map((field) => field.id);
          orderedIds.splice(targetIndex, 0, newField.id);
          await trackMutation(
            reorderFields({
              items: orderedIds.map((id, index) => ({
                id,
                position: index,
              })),
            })
          );
        }

        setSelectedFieldId(newField.id);
      } catch (error) {
        console.error("Erro ao criar campo:", error);
        toast.error("Não foi possível criar o campo.");
      }
    },
    [
      activeStepId,
      createField,
      fields,
      nextPosition,
      reorderFields,
      trackMutation,
    ]
  );

  const handleUpdateField = useCallback(
    async (input: UpdateStepFieldInput) => {
      await trackMutation(updateField(input));
    },
    [trackMutation, updateField]
  );

  const handleUpdateFieldConfiguration = useCallback(
    async (fieldId: string, configuration: StepFieldConfiguration) => {
      await handleUpdateField({
        id: fieldId,
        configuration,
      });
    },
    [handleUpdateField]
  );

  const handleDuplicateField = useCallback(
    async (fieldId: string) => {
      if (!activeStepId) {
        toast.error("Selecione uma etapa para duplicar campos.");
        return;
      }

      const targetField = fields.find((field) => field.id === fieldId);
      if (!targetField) {
        return;
      }

      const cloneConfig = JSON.parse(
        JSON.stringify(targetField.configuration ?? {})
      ) as StepFieldConfiguration;

      await trackMutation(
        createField({
          stepId: activeStepId,
          label: `${targetField.label} (cópia)`,
          fieldType: targetField.fieldType,
          isRequired: targetField.isRequired,
          configuration: cloneConfig,
          position: nextPosition(),
        })
      );
    },
    [activeStepId, createField, fields, nextPosition, trackMutation]
  );

  const handleDeleteField = useCallback(
    async (fieldId: string) => {
      await trackMutation(deleteField(fieldId));
    },
    [deleteField, trackMutation]
  );

  const handleReorderFields = useCallback(
    async (orderedIds: string[]) => {
      if (!orderedIds.length) {
        return;
      }

      await trackMutation(
        reorderFields({
          items: orderedIds.map((id, index) => ({
            id,
            position: index,
          })),
        })
      );
    },
    [reorderFields, trackMutation]
  );

  const updateFlowDraft = useCallback((updates: Partial<FlowDraft>) => {
    setFlowDraft((prev) => ({
      ...prev,
      ...updates,
    }));
    setHasLocalChanges(true);
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const saveAll = useCallback(async () => {
    if (!flowId) {
      toast.error("Flow não encontrado.");
      return;
    }

    if (!flowDraft.name.trim()) {
      toast.error("O flow precisa de um nome para ser salvo.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando alterações...");
    try {
      await waitForPendingMutations();
      await updateFlow({
        id: flowId,
        name: flowDraft.name.trim(),
        description: flowDraft.description.trim() || null,
        isActive: flowDraft.isActive,
      });
      setHasLocalChanges(false);
      toast.success("Flow salvo com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao salvar flow:", error);
      toast.error("Não foi possível salvar o flow.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }, [flowDraft, flowId, updateFlow, waitForPendingMutations]);

  const isDirty = useMemo(() => {
    if (!flow) {
      return false;
    }

    return (
      flow.name !== flowDraft.name ||
      (flow.description ?? "") !== (flowDraft.description ?? "") ||
      flow.isActive !== flowDraft.isActive
    );
  }, [flow, flowDraft]);

  return {
    flow,
    flowDraft,
    updateFlowDraft,
    steps,
    activeStepId,
    activeStep,
    selectStep: handleSelectStep,
    createStep: handleCreateStep,
    renameStep: handleRenameStep,
    deleteStep: handleDeleteStep,
    reorderSteps: handleReorderSteps,
    fields,
    selectedFieldId,
    selectedField,
    selectField: handleSelectField,
    createFieldFromLibrary: handleCreateFieldFromLibrary,
    updateField: handleUpdateField,
    updateFieldConfiguration: handleUpdateFieldConfiguration,
    duplicateField: handleDuplicateField,
    deleteField: handleDeleteField,
    reorderFields: handleReorderFields,
    availableFields: fieldLibrary,
    isLoading: isFlowLoading || isStepsLoading || isFieldsLoading,
    isSaving,
    hasPendingChanges: hasLocalChanges || pendingMutations > 0,
    pendingMutations,
    saveAll,
  };
}

