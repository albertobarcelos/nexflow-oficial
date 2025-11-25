import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Edit3, Trash2 } from "lucide-react";
import type { DraggableAttributes, SyntheticListenerMap } from "@dnd-kit/core";
import type { NexflowStepField } from "@/types/nexflow";

export interface SortableHandlers {
  setNodeRef: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
}

interface FieldCardProps {
  field: NexflowStepField;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  sortable?: SortableHandlers;
}

export function FieldCard({
  field,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
  onEdit,
  sortable,
}: FieldCardProps) {
  const { isRequired } = field;

  return (
    <div
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-400 hover:shadow-lg",
        isActive && "border-orange-500 shadow-md",
        sortable?.isDragging && "opacity-80 shadow-xl"
      )}
      {...sortable?.attributes}
      {...sortable?.listeners}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{field.label}</p>
          <p className="text-xs text-gray-500 capitalize">
            {field.fieldType.replace("_", " ")}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isRequired && (
        <span className="mt-3 inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
          Obrigatório
        </span>
      )}
    </div>
  );
}

