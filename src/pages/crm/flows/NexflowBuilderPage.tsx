import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
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
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useFlowBuilderState } from "@/hooks/useFlowBuilderState";
import { useFlowPermissions } from "@/hooks/useFlowPermissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const { hasAccess, accessError } = useClientAccessGuard();
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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);
  const pendingNavigateRef = useRef<(() => void) | null>(null);

  // Bloqueia navegação quando há alterações não salvas
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      Boolean(hasPendingChanges && currentLocation.pathname !== nextLocation.pathname)
  );

  useEffect(() => {
    if (blocker.state === "blocked" && !showLeaveDialog) {
      pendingNavigateRef.current = () => blocker.proceed?.();
      setShowLeaveDialog(true);
    }
  }, [blocker.state, showLeaveDialog]);

  // Aviso ao fechar/recarregar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPendingChanges]);

  const flowName = useMemo(
    () => flowDraft.name || flow?.name || "Flow sem nome",
    [flowDraft.name, flow?.name]
  );

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p className="font-medium">Sem acesso aos flows</p>
          <p className="text-sm text-muted-foreground mt-1">{accessError ?? "Cliente não definido"}</p>
        </div>
      </div>
    );
  }

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
    if (updates.title) {
      await renameStep(stepId, updates.title);
    }
  };

  // Trocar de etapa: se houver alterações não salvas, mostrar diálogo
  const handleSelectStepWithConfirm = (stepId: string) => {
    if (stepId === activeStepId) return;
    if (hasPendingChanges) {
      setPendingStepId(stepId);
      setShowStepDialog(true);
    } else {
      selectStep(stepId);
    }
  };

  const handleStepDialogSaveAndSwitch = async () => {
    if (pendingStepId === null) return;
    await saveAll();
    setShowStepDialog(false);
    selectStep(pendingStepId);
    setPendingStepId(null);
  };

  const handleStepDialogSwitchWithoutSave = () => {
    if (pendingStepId === null) return;
    setShowStepDialog(false);
    selectStep(pendingStepId);
    setPendingStepId(null);
  };

  const handleStepDialogCancel = () => {
    setShowStepDialog(false);
    setPendingStepId(null);
  };

  const handleBack = () => {
    if (hasPendingChanges) {
      setShowLeaveDialog(true);
      pendingNavigateRef.current = () => navigate("/crm/flows");
    } else {
      navigate("/crm/flows");
    }
  };

  const handleLeaveDialogLeave = () => {
    setShowLeaveDialog(false);
    if (pendingNavigateRef.current) {
      pendingNavigateRef.current();
      pendingNavigateRef.current = null;
    }
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
  };

  const handleLeaveDialogStay = () => {
    setShowLeaveDialog(false);
    pendingNavigateRef.current = null;
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
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
          onSelectStep={handleSelectStepWithConfirm}
          onCreateStep={createStep}
          onRenameStep={renameStep}
          onDeleteStep={deleteStep}
          onReorderSteps={reorderSteps}
          onSave={saveAll}
          isSaving={isSaving}
          canSave={hasPendingChanges}
          pendingMutations={pendingMutations}
          onBack={handleBack}
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

      {/* Diálogo: alterações não salvas ao trocar de etapa */}
      <AlertDialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja salvar antes de trocar de etapa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStepDialogCancel}>
              Cancelar
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleStepDialogSwitchWithoutSave}>
              Trocar sem salvar
            </Button>
            <Button onClick={handleStepDialogSaveAndSwitch} disabled={isSaving}>
              Salvar e trocar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: alterações não salvas ao sair */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLeaveDialogStay}>
              Ficar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveDialogLeave}>
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default NexflowBuilderPage;

