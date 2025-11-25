import { useMemo, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Plus, ArrowLeft } from "lucide-react";
import { useNexflowFlow, type NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { useNexflowCards } from "@/hooks/useNexflowCards";
import type {
  ChecklistProgressMap,
  NexflowCard,
  NexflowStepField,
} from "@/types/nexflow";

type ViewMode = "kanban" | "list";

interface CardFormValues {
  title: string;
  fields: Record<string, string>;
  checklist: Record<string, Record<string, boolean>>;
}

export function NexflowBoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [activeCard, setActiveCard] = useState<NexflowCard | null>(null);

  const { flow, steps, isLoading } = useNexflowFlow(id);
  const {
    cards,
    isLoading: isLoadingCards,
    createCard,
    updateCard,
    reorderCards,
  } = useNexflowCards(id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const cardsByStep = useMemo(() => {
    const map: Record<string, NexflowCard[]> = {};
    cards.forEach((card) => {
      if (!map[card.stepId]) {
        map[card.stepId] = [];
      }
      map[card.stepId].push(card);
    });

    Object.values(map).forEach((column) =>
      column.sort((a, b) => a.position - b.position)
    );
    return map;
  }, [cards]);

  const handleCreateCard = async (stepId: string) => {
    if (!id) return;
    await createCard({
      flowId: id,
      stepId,
      title: "Novo card",
    });
  };

  const handleValidateRequiredFields = useCallback(
    (card: NexflowCard, fromStepId: string): boolean => {
      const step = steps.find((item) => item.id === fromStepId);
      if (!step) {
        return true;
      }

      const requiredFields = step.fields?.filter(
        (field: NexflowStepField) => field.isRequired
      );
      if (!requiredFields || requiredFields.length === 0) {
        return true;
      }

      const missingLabels: string[] = [];

      requiredFields.forEach((field: NexflowStepField) => {
        const value = card.fieldValues?.[field.id];
        if (field.fieldType === "checklist") {
          const configItems = field.configuration.items ?? [];
          const progress = (card.checklistProgress?.[field.id] ??
            {}) as Record<string, boolean>;
          const allChecked = configItems.every(
            (item) => progress?.[item] === true
          );
          if (!allChecked) {
            missingLabels.push(`${field.label} (checklist incompleto)`);
          }
          return;
        }

        const isFilled =
          typeof value === "number" ||
          (typeof value === "string" && value.trim() !== "") ||
          (Array.isArray(value) && value.length > 0);

        if (!isFilled) {
          missingLabels.push(field.label);
        }
      });

      if (missingLabels.length > 0) {
        toast.error(
          `Complete os campos obrigatórios antes de avançar: ${missingLabels.join(
            ", "
          )}`
        );
        return false;
      }

      return true;
    },
    [steps]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const card = cards.find((item) => item.id === active.id);
    if (!card) {
      return;
    }

    const overData = over.data?.current as { stepId?: string } | undefined;
    const overCard = cards.find((item) => item.id === over.id);
    const targetStepId =
      overData?.stepId ?? overCard?.stepId ?? card.stepId;

    if (!targetStepId) {
      return;
    }

    if (targetStepId !== card.stepId) {
      const canMove = handleValidateRequiredFields(card, card.stepId);
      if (!canMove) {
        return;
      }
    }

    const sourceStepId = card.stepId;
    const sourceCards = cardsByStep[sourceStepId] ?? [];
    const destinationCards =
      targetStepId === sourceStepId
        ? sourceCards
        : cardsByStep[targetStepId] ?? [];

    const sourceIndex = sourceCards.findIndex((item) => item.id === card.id);
    let targetIndex =
      overCard && overCard.id !== card.id
        ? destinationCards.findIndex((item) => item.id === overCard.id)
        : destinationCards.length;

    if (targetIndex < 0) {
      targetIndex = destinationCards.length;
    }

    let updates: { id: string; stepId: string; position: number }[] = [];

    if (targetStepId === sourceStepId) {
      const reordered = arrayMove(
        [...destinationCards],
        sourceIndex,
        targetIndex
      );
      updates = reordered.map((item, index) => ({
        id: item.id,
        stepId: targetStepId,
        position: (index + 1) * 1000,
      }));
    } else {
      const updatedSource = sourceCards.filter((item) => item.id !== card.id);
      const updatedDestination = [...destinationCards];
      const movedCard = { ...card, stepId: targetStepId };
      updatedDestination.splice(targetIndex, 0, movedCard);

      updates = [
        ...updatedSource.map((item, index) => ({
          id: item.id,
          stepId: sourceStepId,
          position: (index + 1) * 1000,
        })),
        ...updatedDestination.map((item, index) => ({
          id: item.id,
          stepId: targetStepId,
          position: (index + 1) * 1000,
        })),
      ];
    }

    await reorderCards({
      items: updates,
    });
  };

  const handleUpdateCard = async (values: CardFormValues) => {
    if (!activeCard) return;
    await updateCard({
      id: activeCard.id,
      title: values.title.trim(),
      fieldValues: values.fields,
      checklistProgress: values.checklist as ChecklistProgressMap,
    });
    setActiveCard(null);
  };

  const isLoadingPage = isLoading || isLoadingCards;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/crm/flows")}
            className="text-slate-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Execução do Flow
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              {flow?.name ?? "Flow"}
            </h1>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="p-4">
        {isLoadingPage ? (
          <div className="text-center text-slate-500 py-12">Carregando...</div>
        ) : viewMode === "list" ? (
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Título</th>
                    <th className="px-4 py-2">Etapa</th>
                    <th className="px-4 py-2">Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => {
                    const step = steps.find((item) => item.id === card.stepId);
                    return (
                      <tr
                        key={card.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setActiveCard(card)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {card.title}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {step?.title ?? "Etapa"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(card.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-8">
              {steps.map((step) => {
                const columnCards = cardsByStep[step.id] ?? [];
                return (
                  <div
                    key={step.id}
                    className="flex w-72 flex-shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
                    style={{ minHeight: "calc(100vh - 260px)" }}
                  >
                    <div
                      className="border-b border-slate-100 px-4 py-3"
                      style={{ borderTop: `6px solid ${step.color}` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
                            <span
                              className="inline-flex h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: step.color }}
                            />
                            Etapa
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900">
                            {step.title}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {columnCards.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                      <ColumnDropZone stepId={step.id}>
                        <SortableContext
                          items={columnCards.map((card) => card.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {columnCards.map((card) => (
                            <SortableCard
                              key={card.id}
                              card={card}
                              onClick={() => setActiveCard(card)}
                              stepId={step.id}
                            />
                          ))}
                        </SortableContext>
                      </ColumnDropZone>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border border-dashed border-slate-200 hover:border-orange-400 hover:bg-orange-50"
                        onClick={() => handleCreateCard(step.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Novo card
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </DndContext>
        )}
      </main>

      <CardDrawer
        card={activeCard}
        step={
          activeCard
            ? (steps.find((item) => item.id === activeCard.stepId) ?? null)
            : null
        }
        onClose={() => setActiveCard(null)}
        onSubmit={handleUpdateCard}
      />
    </div>
  );
}

interface SortableCardProps {
  card: NexflowCard;
  onClick: () => void;
  stepId: string;
}

function SortableCard({ card, onClick, stepId }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { stepId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      {...attributes}
      {...listeners}
      className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm cursor-pointer ${
        isDragging ? "opacity-75 ring-2 ring-blue-200" : ""
      }`}
      onClick={onClick}
    >
      <p className="text-sm font-semibold text-slate-900">{card.title}</p>
      <p className="text-xs text-slate-400 mt-1">
        {new Date(card.createdAt).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}

function ColumnDropZone({
  stepId,
  children,
}: {
  stepId: string;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `column-${stepId}`,
    data: { stepId },
  });

  return (
    <div ref={setNodeRef} className="flex min-h-[400px] flex-col gap-2">
      {children}
    </div>
  );
}

interface CardDrawerProps {
  card: NexflowCard | null;
  step: NexflowStepWithFields | null;
  onClose: () => void;
  onSubmit: (values: CardFormValues) => Promise<void>;
}

function CardDrawer({ card, step, onClose, onSubmit }: CardDrawerProps) {
  const form = useForm<CardFormValues>({
    defaultValues: {
      title: card?.title ?? "",
      fields: (card?.fieldValues as Record<string, string>) ?? {},
      checklist:
        (card?.checklistProgress as Record<string, Record<string, boolean>>) ??
        {},
    },
  });

  useEffect(() => {
    form.reset({
      title: card?.title ?? "",
      fields: (card?.fieldValues as Record<string, string>) ?? {},
      checklist:
        (card?.checklistProgress as Record<string, Record<string, boolean>>) ??
        {},
    });
  }, [card, form]);

  if (!card || !step) {
    return null;
  }

  const handleSubmit = form.handleSubmit(onSubmit);
  const fields: NexflowStepField[] = step?.fields ?? [];

  return (
    <Sheet open={Boolean(card)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar card</SheetTitle>
        </SheetHeader>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              {...form.register("title", { required: true })}
              placeholder="Nome do card"
            />
          </div>

          {fields.map((field) => {
            if (field.fieldType === "checklist") {
              const items = field.configuration.items ?? [];
              return (
                <div key={field.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {field.label}
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <Checkbox
                          checked={
                            form.watch(`checklist.${field.id}.${item}`) ?? false
                          }
                          onCheckedChange={(checked) =>
                            form.setValue(
                              `checklist.${field.id}.${item}`,
                              checked === true
                            )
                          }
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">
                  {field.label}
                </label>
                {field.configuration.variant === "long" ? (
                  <Textarea
                    rows={4}
                    {...form.register(`fields.${field.id}`)}
                    placeholder={field.configuration.placeholder as string}
                  />
                ) : (
                  <Input
                    {...form.register(`fields.${field.id}`)}
                    placeholder={field.configuration.placeholder as string}
                  />
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default NexflowBoardPage;

