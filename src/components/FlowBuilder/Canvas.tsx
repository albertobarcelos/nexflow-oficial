import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { NexflowStepField } from "@/types/nexflow";
import { FieldCard, SortableHandlers } from "./FieldCard";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasProps {
  fields: NexflowStepField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onEmptyAdd: () => void;
}

export function Canvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDuplicateField,
  onDeleteField,
  onEmptyAdd,
}: CanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: "canvas-dropzone",
    data: {
      area: "canvas",
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition",
        "min-h-[620px]",
        isOver && "border border-dashed border-orange-400 bg-orange-50/40"
      )}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Formulário da etapa
          </p>
          <p className="text-xs text-slate-500">
            Arraste campos e organize a ordem desejada.
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/80 p-10 text-center">
            <Inbox className="mb-4 h-10 w-10 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhum campo adicionado ainda
            </p>
            <p className="text-xs text-slate-500">
              Utilize a toolbox para arrastar um campo ou crie rapidamente.
            </p>
            <Button
              className="mt-4 bg-orange-500 text-white hover:bg-orange-600"
              onClick={onEmptyAdd}
            >
              Adicionar primeiro campo
            </Button>
          </div>
        ) : (
          <SortableContext
            items={fields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 min-h-[400px]">
              {fields.map((field) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  isActive={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field.id)}
                  onDuplicate={() => onDuplicateField(field.id)}
                  onDelete={() => onDeleteField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </section>
  );
}

interface SortableFieldCardProps {
  field: NexflowStepField;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SortableFieldCard({
  field,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
}: SortableFieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: field.id,
      data: {
        type: "field",
        fieldId: field.id,
      },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sortableHandlers: SortableHandlers = {
    attributes,
    listeners,
    setNodeRef,
    style,
    isDragging,
  };

  return (
    <FieldCard
      field={field}
      isActive={isActive}
      onSelect={onSelect}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      sortable={sortableHandlers}
    />
  );
}

