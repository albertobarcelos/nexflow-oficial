import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FlowBuilderFieldDefinition } from "@/lib/flowBuilder/fieldLibrary";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  Mail,
  Phone,
  Type,
  UserRound,
  FileText,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  shortText: Type,
  longText: AlignLeft,
  checkbox: CheckSquare,
  date: CalendarDays,
  email: Mail,
  phone: Phone,
  assignee: UserRound,
  assignee_team: Users,
  cnpjCpf: FileText,
};

const iconStyles: Record<string, string> = {
  shortText: "bg-blue-50 text-blue-600",
  longText: "bg-sky-50 text-sky-600",
  checkbox: "bg-emerald-50 text-emerald-600",
  date: "bg-purple-50 text-purple-600",
  email: "bg-indigo-50 text-indigo-600",
  phone: "bg-teal-50 text-teal-600",
  assignee: "bg-rose-50 text-rose-600",
  assignee_team: "bg-violet-50 text-violet-600",
  cnpjCpf: "bg-amber-50 text-amber-600",
};

interface ToolboxProps {
  definitions: FlowBuilderFieldDefinition[];
  onAdd: (definitionId: string) => void;
}

export function Toolbox({ definitions, onAdd }: ToolboxProps) {
  return (
    <aside className="h-[600px] max-h-[800px] rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tipos de Campo
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Arraste um componente para o formulário
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {definitions.map((definition) => (
            <ToolboxItem
              key={definition.id}
              definition={definition}
              onAdd={onAdd}
            />
          ))}
        </div>
      </ScrollArea>
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
      {...attributes}
      {...listeners}
      onClick={() => onAdd(definition.id)}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-orange-500 hover:bg-orange-50"
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

