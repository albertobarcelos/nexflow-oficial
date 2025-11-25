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
import { Skeleton } from "@/components/ui/skeleton";
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
    selectStep,
    createStep,
    renameStep,
    deleteStep,
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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {isLoading ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : (
        <FlowBuilderHeader
          flowName={flowName}
          flowDescription={flowDraft.description}
          steps={steps}
          activeStepId={activeStepId}
          onSelectStep={selectStep}
          onCreateStep={createStep}
          onRenameStep={renameStep}
          onDeleteStep={deleteStep}
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
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
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
            onFieldUpdate={updateField}
            onFieldConfigurationUpdate={updateFieldConfiguration}
            onDuplicateField={duplicateField}
            onDeleteField={deleteField}
          />
        </div>

        <DragOverlay>
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
            <div className="rounded-xl border border-orange-400 bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-lg">
              {activeDrag.definition.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default NexflowBuilderPage;

