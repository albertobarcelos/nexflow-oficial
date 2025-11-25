import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { Plus, Settings, Trash2, Edit2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StepConfigurationPanel } from "@/components/crm/nexflow/StepConfigurationPanel";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface FlowKanbanEditorProps {
  flowId: string;
}

export function FlowKanbanEditor({ flowId }: FlowKanbanEditorProps) {
  const {
    steps,
    isLoading,
    createStep,
    deleteStep,
    updateStep,
    reorderSteps,
  } = useNexflowSteps(flowId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [configStepId, setConfigStepId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const orderedSteps = useMemo(
    () => [...steps].sort((a, b) => a.position - b.position),
    [steps]
  );
  const selectedStep = useMemo(
    () => orderedSteps.find((item) => item.id === configStepId),
    [orderedSteps, configStepId]
  );

  const handleAddStep = async () => {
    if (!newStepName.trim()) {
      return;
    }
    await createStep({ title: newStepName.trim(), color: "#2563eb" });
    setNewStepName("");
    setShowAddDialog(false);
  };

  const handleStartEdit = (stepId: string, currentTitle: string) => {
    setEditingStepId(stepId);
    setEditingValue(currentTitle);
  };

  const handleSaveEdit = async () => {
    if (!editingStepId || !editingValue.trim()) {
      setEditingStepId(null);
      return;
    }

    await updateStep({ id: editingStepId, title: editingValue.trim() });
    setEditingStepId(null);
    setEditingValue("");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = orderedSteps.findIndex((step) => step.id === active.id);
    const overIndex = orderedSteps.findIndex((step) => step.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;

    const reordered = arrayMove(orderedSteps, activeIndex, overIndex);
    const updates = reordered.map((step, index) => ({
      id: step.id,
      position: index + 1,
    }));

    await reorderSteps({ updates });
  };

  const handleDeleteStep = async () => {
    if (!stepToDelete) return;
    await deleteStep(stepToDelete);
    setStepToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Etapas do Flow</h2>
          <p className="text-sm text-muted-foreground">
            Arraste para reorganizar ou clique na engrenagem para configurar detalhes.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar etapa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-48 w-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedSteps.map((step) => step.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-4 pb-4">
                {orderedSteps.length === 0 && (
                  <Card className="flex h-48 w-64 items-center justify-center text-sm text-muted-foreground">
                    Nenhuma etapa cadastrada ainda.
                  </Card>
                )}
                {orderedSteps.map((step) => (
                  <SortableStepCard
                    key={step.id}
                    step={step}
                    isEditing={editingStepId === step.id}
                    editingValue={editingValue}
                    onEditChange={setEditingValue}
                    onStartEdit={() => handleStartEdit(step.id, step.title)}
                    onCancelEdit={() => setEditingStepId(null)}
                    onSaveEdit={handleSaveEdit}
                    onRequestDelete={() => setStepToDelete(step.id)}
                    onOpenSettings={() => setConfigStepId(step.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da etapa</label>
            <Input
              value={newStepName}
              onChange={(event) => setNewStepName(event.target.value)}
              placeholder="Ex: Aprovação Financeira"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStep}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(stepToDelete)} onOpenChange={(open) => !open && setStepToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação remove a etapa e todos os campos configurados nela. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDeleteStep}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StepConfigurationPanel
        flowId={flowId}
        step={selectedStep}
        stepId={configStepId}
        open={Boolean(configStepId)}
        onOpenChange={(open) => !open && setConfigStepId(null)}
        onRenameStep={async (title) => {
          if (configStepId && title.trim()) {
            await updateStep({ id: configStepId, title: title.trim() });
          }
        }}
        onDeleteStep={(stepId) => setStepToDelete(stepId)}
      />
    </div>
  );
}

interface SortableStepCardProps {
  step: {
    id: string;
    title: string;
    position: number;
  };
  isEditing: boolean;
  editingValue: string;
  onEditChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRequestDelete: () => void;
  onOpenSettings: () => void;
}

function SortableStepCard({
  step,
  isEditing,
  editingValue,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
  onOpenSettings,
}: SortableStepCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex w-64 flex-col rounded-2xl border bg-white shadow-sm",
        isDragging && "opacity-70"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex items-center gap-2">
          <button
            className="text-muted-foreground hover:text-primary"
            {...attributes}
            {...listeners}
            type="button"
          >
            <GripHorizontal className="h-4 w-4" />
          </button>
          <span className="text-xs uppercase text-muted-foreground">
            Etapa #{step.position}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onStartEdit}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={onRequestDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editingValue}
              onChange={(event) => onEditChange(event.target.value)}
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={onSaveEdit} size="sm">
                Salvar
              </Button>
              <Button
                className="flex-1"
                onClick={onCancelEdit}
                size="sm"
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-base font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">
              Configure campos específicos clicando na engrenagem.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

