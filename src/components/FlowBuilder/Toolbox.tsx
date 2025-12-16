import { Button } from "@/components/ui/button";
import type { FlowBuilderFieldDefinition } from "@/lib/flowBuilder/fieldLibrary";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  Mail,
  Paperclip,
  Phone,
  Type,
  UserRound,
  FileText,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  shortText: Type,
  longText: AlignLeft,
  checkbox: CheckSquare,
  date: CalendarDays,
  email: Mail,
  phone: Phone,
  attachment: Paperclip,
  assignee: UserRound,
  cnpjCpf: FileText,
};

const iconStyles: Record<string, string> = {
  shortText: "bg-blue-50 text-blue-600",
  longText: "bg-sky-50 text-sky-600",
  checkbox: "bg-emerald-50 text-emerald-600",
  date: "bg-purple-50 text-purple-600",
  email: "bg-indigo-50 text-indigo-600",
  phone: "bg-teal-50 text-teal-600",
  attachment: "bg-orange-50 text-orange-600",
  assignee: "bg-rose-50 text-rose-600",
  cnpjCpf: "bg-amber-50 text-amber-600",
};

interface ToolboxProps {
  definitions: FlowBuilderFieldDefinition[];
  onAdd: (definitionId: string) => void;
}

export function Toolbox({ definitions, onAdd }: ToolboxProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tipos de Campo
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Arraste um componente para o formulário
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {definitions.map((definition) => (
          <ToolboxItem
            key={definition.id}
            definition={definition}
            onAdd={onAdd}
          />
        ))}
      </div>
    </aside>
  );
}

interface ToolboxItemProps {
  definition: FlowBuilderFieldDefinition;
  onAdd: (definitionId: string) => void;
}

function ToolboxItem({ definition, onAdd }: ToolboxItemProps) {
  const Icon = iconMap[definition.id] ?? Type;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `toolbox-${definition.id}`,
      data: {
        type: "toolbox",
        definitionId: definition.id,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onAdd(definition.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-orange-500 hover:bg-orange-50",
        isDragging && "cursor-grabbing border-orange-500 shadow-lg"
      )}
      type="button"
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          iconStyles[definition.id] ?? "bg-slate-100 text-slate-700"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">
          {definition.label}
        </p>
        <p className="text-xs text-slate-500">{definition.description}</p>
      </div>
    </button>
  );
}

