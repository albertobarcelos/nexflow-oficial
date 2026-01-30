import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";
import { FlowBuilderHeader } from "@/components/FlowBuilder/Header";
import { Toolbox } from "@/components/FlowBuilder/Toolbox";
import { Canvas } from "@/components/FlowBuilder/Canvas";
import { PropertiesPanel } from "@/components/FlowBuilder/PropertiesPanel";
import { FieldCard } from "@/components/FlowBuilder/FieldCard";
import { useFlowBuilderState } from "@/hooks/useFlowBuilderState";
import { useFlowPermissions } from "@/hooks/useFlowPermissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserRound, Type, AlignLeft, CheckSquare, CalendarDays, Mail, Phone, Paperclip, FileText } from "lucide-react";
import type { FlowBuilderFieldDefinition } from "@/lib/flowBuilder/fieldLibrary";
import type { NexflowStepField } from "@/types/nexflow";

interface ActiveDragData {
  type: "field" | "toolbox";
  field?: NexflowStepField;
  definition?: FlowBuilderFieldDefinition;
}

export function NexflowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permissions, isLoading: isLoadingPermissions } = useFlowPermissions(id);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const {
    flow,
    flowDraft,
    updateFlowDraft,
    steps,
    activeStepId,
    activeStep,
    stepDraft,
    updateStepDraft,
    selectStep,
    createStep,
    renameStep,
    deleteStep,
    reorderSteps,
    fields,
    selectedFieldId,
    selectedField,
    selectField,
    createFieldFromLibrary,
    updateField,
    updateFieldConfiguration,
    duplicateField,
    deleteField,
    reorderFields,
    availableFields,
    isLoading,
    isSaving,
    hasPendingChanges,
    pendingMutations,
    saveAll,
  } = useFlowBuilderState(id);

  const [activeDrag, setActiveDrag] = useState<ActiveDragData | null>(null);

  const flowName = useMemo(
    () => flowDraft.name || flow?.name || "Flow sem nome",
    [flowDraft.name, flow?.name]
  );

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          ID do flow não foi informado. Retorne à lista e tente novamente.
        </p>
      </div>
    );
  }

  // Verificar permissão de edição
  const canEdit = permissions?.canEditFlow ?? false;
  const isCheckingPermissions = isLoadingPermissions;

  if (!isCheckingPermissions && !canEdit && id) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sem permissão para editar</AlertTitle>
          <AlertDescription>
            Você não tem permissão para editar este flow. Apenas o dono do flow, leaders, admins de time e administrators podem editar flows.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <button
            onClick={() => navigate("/crm/flows")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Voltar para lista de flows
          </button>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as ActiveDragData["type"];

    if (type === "field") {
      const field = fields.find((item) => item.id === event.active.id);
      if (field) {
        setActiveDrag({ type, field });
      }
    }

    if (type === "toolbox") {
      const definitionId = event.active.data.current?.definitionId as string;
      const definition = availableFields.find(
        (def) => def.id === definitionId
      );
      if (definition) {
        setActiveDrag({ type, definition });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) {
      return;
    }

    const activeType = active.data.current?.type;
    const overType = over.data?.current?.type;
    const overArea = over.data?.current?.area as string | undefined;

    if (activeType === "field" && overType === "field") {
      const fromId = active.data.current?.fieldId as string;
      const toId = over.data.current?.fieldId as string;
      if (fromId && toId && fromId !== toId) {
        const orderedIds = fields.map((field) => field.id);
        const fromIndex = orderedIds.indexOf(fromId);
        const toIndex = orderedIds.indexOf(toId);
        if (fromIndex !== -1 && toIndex !== -1) {
          orderedIds.splice(fromIndex, 1);
          orderedIds.splice(toIndex, 0, fromId);
          await reorderFields(orderedIds);
        }
      }
      return;
    }

    if (activeType === "field" && overArea === "canvas") {
      const fieldId = active.data.current?.fieldId as string;
      if (fieldId) {
        const orderedIds = fields
          .map((field) => field.id)
          .filter((id) => id !== fieldId);
        orderedIds.push(fieldId);
        await reorderFields(orderedIds);
      }
      return;
    }

    if (activeType === "toolbox") {
      const definitionId = active.data.current?.definitionId as string;
      if (!definitionId) return;

      let targetIndex: number | undefined;
      if (overType === "field") {
        const overFieldId = over.data.current?.fieldId as string;
        targetIndex = fields.findIndex((field) => field.id === overFieldId);
      }
      await createFieldFromLibrary(definitionId, targetIndex);
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveDrag(null);
  };

  const handleEmptyAdd = () => {
    if (!availableFields.length) {
      return;
    }
    createFieldFromLibrary(availableFields[0].id);
  };

  const handleStepUpdate = async (stepId: string, updates: { title?: string; color?: string }) => {
    // Apenas atualizar título imediatamente (compatibilidade)
    // A cor agora é gerenciada via stepDraft e salva apenas quando o usuário clicar em "Salvar"
    if (updates.title) {
      await renameStep(stepId, updates.title);
    }
    // Cor removida daqui - agora é gerenciada via stepDraft
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {isLoading ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : (
        <FlowBuilderHeader
          flowName={flowName}
          flowDescription={flowDraft.description}
          steps={steps}
          activeStepId={activeStepId}
          activeStepDraft={stepDraft}
          onSelectStep={selectStep}
          onCreateStep={createStep}
          onRenameStep={renameStep}
          onDeleteStep={deleteStep}
          onReorderSteps={reorderSteps}
          onSave={saveAll}
          isSaving={isSaving}
          canSave={hasPendingChanges}
          pendingMutations={pendingMutations}
          onBack={() => navigate("/crm/flows")}
        />
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <Toolbox definitions={availableFields} onAdd={createFieldFromLibrary} />
          <Canvas
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={selectField}
            onDuplicateField={duplicateField}
            onDeleteField={deleteField}
            onEmptyAdd={handleEmptyAdd}
          />
          <PropertiesPanel
            flowDraft={flowDraft}
            onFlowDraftChange={updateFlowDraft}
            selectedField={selectedField}
            activeStep={activeStep}
            stepDraft={stepDraft}
            onFieldUpdate={updateField}
            onFieldConfigurationUpdate={updateFieldConfiguration}
            onDuplicateField={duplicateField}
            onDeleteField={deleteField}
            onStepUpdate={handleStepUpdate}
            onStepDraftChange={updateStepDraft}
          />
        </div>

        <DragOverlay
          style={{
            cursor: "grabbing",
            opacity: 0.9,
          }}
        >
          {activeDrag?.type === "field" && activeDrag.field ? (
            <div className="w-[420px] max-w-full">
              <FieldCard
                field={activeDrag.field}
                isActive
                onSelect={() => undefined}
                onDuplicate={() => undefined}
                onDelete={() => undefined}
              />
            </div>
          ) : null}
          {activeDrag?.type === "toolbox" && activeDrag.definition ? (
            <div className="rounded-xl border-2 border-primary bg-card px-4 py-3 shadow-2xl transform rotate-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  {activeDrag.definition.label === "Responsável" ? (
                    <UserRound className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "Texto Curto" ? (
                    <Type className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "Texto Longo" ? (
                    <AlignLeft className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "Checkbox" ? (
                    <CheckSquare className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "Data" ? (
                    <CalendarDays className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "Email" ? (
                    <Mail className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "Telefone" ? (
                    <Phone className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "Anexo" ? (
                    <Paperclip className="h-5 w-5 text-orange-600" />
                  ) : activeDrag.definition.label === "CNPJ/CPF" ? (
                    <FileText className="h-5 w-5 text-orange-600" />
                  ) : (
                    <Type className="h-5 w-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-700">
                    {activeDrag.definition.label}
                  </p>
                  <p className="text-xs text-orange-500">
                    {activeDrag.definition.description}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default NexflowBuilderPage;

