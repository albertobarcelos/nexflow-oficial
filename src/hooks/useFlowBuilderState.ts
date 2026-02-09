import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fieldLibrary,
  FlowBuilderFieldDefinition,
  getFieldDefinition,
  getDefaultSlugForField,
} from "@/lib/flowBuilder/fieldLibrary";
import { useNexflowFlow, useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import {
  CreateStepFieldInput,
  UpdateStepFieldInput,
  useNexflowStepFields,
} from "@/hooks/useNexflowStepFields";
import {
  useFlowVisibilityData,
  useUpdateFlowVisibility,
} from "@/hooks/useFlowVisibility";
import {
  useStepVisibilityData,
  useUpdateStepVisibility,
} from "@/hooks/useStepVisibility";
import {
  NexflowFlow,
  NexflowStep,
  NexflowStepField,
  StepFieldConfiguration,
  StepType,
} from "@/types/nexflow";
import { SYSTEM_FIELDS } from "@/lib/flowBuilder/systemFields";

/**
 * Verifica se um campo é do tipo "responsável" (user_select com slug assigned_to)
 */
function isResponsavelField(field: NexflowStepField): boolean {
  return (
    field.fieldType === "user_select" &&
    field.slug === SYSTEM_FIELDS.ASSIGNED_TO
  );
}

/**
 * Verifica se um campo é do tipo "responsável time" (user_select com slug assigned_team_id)
 */
function isResponsavelTeamField(field: NexflowStepField): boolean {
  return (
    field.fieldType === "user_select" &&
    field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID
  );
}

export interface FlowDraft {
  name: string;
  description: string;
  isActive: boolean;
  visibilityType: "company" | "team" | "user";
  visibleTeamIds: string[];
  excludedUserIds: string[];
}

export interface StepDraft {
  visibilityType: "company" | "team" | "user";
  visibleTeamIds: string[];
  excludedUserIds: string[];
  color?: string;
  title?: string;
  stepType?: StepType;
}

export interface UseFlowBuilderStateReturn {
  flow: NexflowFlow | null;
  flowDraft: FlowDraft;
  updateFlowDraft: (updates: Partial<FlowDraft>) => void;
  steps: NexflowStep[];
  activeStepId: string | null;
  activeStep: NexflowStep | null;
  stepDraft: StepDraft | null;
  updateStepDraft: (updates: Partial<StepDraft>) => void;
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

  // Step visibility hooks
  const { data: stepVisibilityData } = useStepVisibilityData(activeStepId ?? undefined);
  const updateStepVisibility = useUpdateStepVisibility();

  const [stepDraft, setStepDraft] = useState<StepDraft | null>(null);

  useEffect(() => {
    if (activeStepId && stepVisibilityData && activeStep) {
      setStepDraft({
        visibilityType: stepVisibilityData.visibilityType as "company" | "team" | "user",
        visibleTeamIds: stepVisibilityData.teamIds,
        excludedUserIds: stepVisibilityData.excludedUserIds,
        color: activeStep.color,
        title: activeStep.title,
        stepType: activeStep.stepType ?? "standard",
      });
    } else {
      setStepDraft(null);
    }
  }, [activeStepId, stepVisibilityData, activeStep]);

  const updateStepDraft = useCallback((updates: Partial<StepDraft>) => {
    setStepDraft((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
      };
    });
    setHasLocalChanges(true);
  }, []);

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
    visibilityType: "company",
    visibleTeamIds: [],
    excludedUserIds: [],
  });

  // Visibility hooks - usando hook unificado que busca via Edge Function
  const { data: visibilityData } = useFlowVisibilityData(flowId);
  const updateFlowVisibility = useUpdateFlowVisibility();

  useEffect(() => {
    if (flow && visibilityData) {
      // Espera carregar os dados da edge function
      setFlowDraft({
        name: flow.name ?? "",
        description: flow.description ?? "",
        isActive: flow.isActive,
        // Usa os dados que vieram da Edge Function, não do objeto flow antigo
        visibilityType: visibilityData.visibilityType as "company" | "team" | "user",
        visibleTeamIds: visibilityData.teamIds,
        excludedUserIds: visibilityData.excludedUserIds,
      });
      setHasLocalChanges(false);
    }
  }, [flow, visibilityData]);

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
        createStep({ title: stepTitle, color }, { skipToasts: true })
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
        updateStep({ id: stepId, title: title.trim() }, { skipToasts: true })
      );
    },
    [updateStep, trackMutation]
  );

  const handleDeleteStep = useCallback(
    async (stepId: string) => {
      if (steps.length <= 1) {
        return;
      }
      await trackMutation(deleteStep(stepId, { skipToasts: true }));
    },
    [deleteStep, steps.length, trackMutation]
  );

  const handleReorderSteps = useCallback(
    async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        position: index,
      }));
      await trackMutation(reorderSteps({ updates }, { skipToasts: true }));
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
        return;
      }

      const definition = getFieldDefinition(definitionId);

      if (!definition) {
        return;
      }

      // Obter slug padrão para campos de sistema
      const defaultSlug = getDefaultSlugForField(definitionId);
      
      // Validar se já existe um campo "responsável" (usuário) na etapa
      if (definitionId === "assignee" || (definition.fieldType === "user_select" && defaultSlug === SYSTEM_FIELDS.ASSIGNED_TO)) {
        const existingResponsavelFields = fields.filter((field) => isResponsavelField(field));
        if (existingResponsavelFields.length > 0) {
          return;
        }
      }

      // Validar se já existe um campo "responsável time" na etapa
      if (definitionId === "assignee_team" || (definition.fieldType === "user_select" && defaultSlug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID)) {
        const existingResponsavelTeamFields = fields.filter((field) => isResponsavelTeamField(field));
        if (existingResponsavelTeamFields.length > 0) {
          return;
        }
      }
      
      const payload: CreateStepFieldInput = {
        stepId: activeStepId,
        label: definition.defaultLabel,
        slug: defaultSlug,
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
        return;
      }

      const targetField = fields.find((field) => field.id === fieldId);
      if (!targetField) {
        return;
      }

      // Validar se está tentando duplicar um campo "responsável" e já existe um
      if (isResponsavelField(targetField)) {
        const existingResponsavelFields = fields.filter((field) => isResponsavelField(field));
        if (existingResponsavelFields.length > 0) {
          return;
        }
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
          // Não duplicar o slug para campos de sistema
          slug: isResponsavelField(targetField) ? null : targetField.slug,
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
      return;
    }

    if (!flowDraft.name.trim()) {
      return;
    }

    // Validar se há mais de um campo "responsável" na etapa ativa
    if (activeStepId) {
      const responsavelFields = fields.filter((field) => isResponsavelField(field));
      if (responsavelFields.length > 1) {
        return;
      }
    }

    setIsSaving(true);
    try {
      await waitForPendingMutations();

      // Salvar flow (sem toasts no builder)
      await updateFlow(
        {
          id: flowId,
          name: flowDraft.name.trim(),
          description: flowDraft.description.trim() || null,
          isActive: flowDraft.isActive,
          visibilityType: flowDraft.visibilityType,
        },
        { skipToasts: true }
      );

      // Atualizar visibilidade usando Edge Function
      // O hook já faz o mapeamento de "user" para "user_exclusion" internamente
      await updateFlowVisibility.mutateAsync({
        flowId: flowId,
        visibilityType: flowDraft.visibilityType, // O hook mapeia "user" -> "user_exclusion"
        teamIds: flowDraft.visibleTeamIds,
        excludedUserIds: flowDraft.excludedUserIds,
      });

      // Salvar visibilidade da etapa ativa se houver mudanças
      if (activeStepId && stepDraft && flowId) {
        await updateStepVisibility.mutateAsync({
          stepId: activeStepId,
          flowId: flowId,
          visibilityType: stepDraft.visibilityType,
          teamIds: stepDraft.visibleTeamIds,
          excludedUserIds: stepDraft.excludedUserIds,
        });

        // Salvar título, cor e tipo da etapa se houver mudanças
        const stepUpdates: { title?: string; color?: string; stepType?: StepType } = {};
        if (activeStep && stepDraft.title && stepDraft.title !== activeStep.title) {
          stepUpdates.title = stepDraft.title;
        }
        if (activeStep && stepDraft.color && stepDraft.color !== activeStep.color) {
          stepUpdates.color = stepDraft.color;
        }
        if (activeStep && stepDraft.stepType && stepDraft.stepType !== activeStep.stepType) {
          stepUpdates.stepType = stepDraft.stepType;
        }
        
        if (Object.keys(stepUpdates).length > 0) {
          await updateStep(
            { id: activeStepId, ...stepUpdates },
            { skipToasts: true }
          );
        }
      }

      setHasLocalChanges(false);
    } catch (error) {
      console.error("Erro ao salvar flow:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    flowDraft,
    flowId,
    updateFlow,
    waitForPendingMutations,
    updateFlowVisibility,
    activeStepId,
    stepDraft,
    updateStepVisibility,
    updateStep,
    activeStep,
  ]);

  const isDirty = useMemo(() => {
    if (!flow || !visibilityData) {
      return false;
    }

    const teamIdsChanged = 
      JSON.stringify([...visibilityData.teamIds].sort()) !== 
      JSON.stringify([...flowDraft.visibleTeamIds].sort());
    
    const excludedIdsChanged = 
      JSON.stringify([...visibilityData.excludedUserIds].sort()) !== 
      JSON.stringify([...flowDraft.excludedUserIds].sort());

    return (
      flow.name !== flowDraft.name ||
      (flow.description ?? "") !== (flowDraft.description ?? "") ||
      flow.isActive !== flowDraft.isActive ||
      visibilityData.visibilityType !== flowDraft.visibilityType ||
      teamIdsChanged ||
      excludedIdsChanged
    );
  }, [flow, flowDraft, visibilityData]);

  return {
    flow,
    flowDraft,
    updateFlowDraft,
    steps,
    activeStepId,
    activeStep,
    stepDraft,
    updateStepDraft,
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

