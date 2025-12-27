import { useState } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStepActions } from "@/hooks/useStepActions";
import { NexflowStepAction, ActionType } from "@/types/nexflow";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

interface ProcessSidebarProps {
  stepId: string;
  selectedActionId: string | null;
  onSelectAction: (actionId: string | null) => void;
  onCreateAction: () => void;
  onDeleteAction: (actionId: string) => void;
  canAddProcesses?: boolean;
}

// Ícones para cada tipo de ação
const getActionIcon = (actionType: ActionType): string => {
  const icons: Record<ActionType, string> = {
    phone_call: "call",
    email: "mail",
    linkedin_message: "chat",
    whatsapp: "chat",
    meeting: "event",
    task: "task",
  };
  return icons[actionType] || "task";
};

// Componente para um item de ação sortable
function SortableActionItem({
  action,
  isSelected,
  onSelect,
  onDelete,
}: {
  action: NexflowStepAction;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const iconName = getActionIcon(action.actionType);
  const isActive = isSelected;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 ${
        isActive
          ? "bg-indigo-50 dark:bg-indigo-900/20 border border-primary/30 rounded-lg cursor-pointer shadow-sm relative overflow-hidden"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg cursor-pointer transition-all"
      }`}
      onClick={onSelect}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
      )}
      <div
        className={`w-8 h-8 rounded-full ${
          isActive
            ? "bg-white dark:bg-slate-800 text-primary shadow-sm border border-indigo-100 dark:border-indigo-800"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
        } flex items-center justify-center shrink-0`}
      >
        <span className="material-icons-outlined text-sm">{iconName}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isActive
              ? "text-slate-900 dark:text-white"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {action.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {action.actionType === "phone_call" && "Ligação"}
          {action.actionType === "email" && "Email"}
          {action.actionType === "linkedin_message" && "LinkedIn"}
          {action.actionType === "whatsapp" && "WhatsApp"}
          {action.actionType === "meeting" && "Reunião"}
          {action.actionType === "task" && "Tarefa"}
        </p>
      </div>
      <button
        className={`opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all ${
          isDragging ? "opacity-0" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div
        {...attributes}
        {...listeners}
        className="text-slate-300 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  );
}

export function ProcessSidebar({
  stepId,
  selectedActionId,
  onSelectAction,
  onCreateAction,
  onDeleteAction,
  canAddProcesses = true,
}: ProcessSidebarProps) {
  const { actionsByDay, reorderStepActions, isLoading } = useStepActions(stepId);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Encontrar o day_offset do item ativo
    let activeDayOffset: number | null = null;
    let activeIndex: number = -1;
    let overIndex: number = -1;

    for (const dayGroup of actionsByDay) {
      const activeIdx = dayGroup.actions.findIndex((a) => a.id === active.id);
      if (activeIdx !== -1) {
        activeDayOffset = dayGroup.dayOffset;
        activeIndex = activeIdx;
        break;
      }
    }

    // Encontrar o índice do item sobre o qual foi solto
    for (const dayGroup of actionsByDay) {
      if (dayGroup.dayOffset === activeDayOffset) {
        const overIdx = dayGroup.actions.findIndex((a) => a.id === over.id);
        if (overIdx !== -1) {
          overIndex = overIdx;
          break;
        }
      }
    }

    if (activeDayOffset === null || activeIndex === -1 || overIndex === -1) {
      return;
    }

    // Reordenar dentro do mesmo day_offset
    const dayGroup = actionsByDay.find((d) => d.dayOffset === activeDayOffset);
    if (!dayGroup) return;

    const newActions = [...dayGroup.actions];
    const [removed] = newActions.splice(activeIndex, 1);
    newActions.splice(overIndex, 0, removed);

    // Atualizar posições
    const updates = newActions.map((action, index) => ({
      id: action.id,
      position: index + 1,
    }));

    await reorderStepActions({ updates });
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };

  if (isLoading) {
    return (
      <aside className="w-80 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 z-10">
        <div className="p-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 z-10 transition-colors duration-300">
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Process Outline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag to reorder steps
          </p>
        </div>
        <button className="text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
          <span className="material-icons-outlined">playlist_add_check</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {actionsByDay.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-sm">Nenhuma ação criada ainda.</p>
              <p className="text-xs mt-1">Clique em "Add New Step" para começar.</p>
            </div>
          ) : (
            actionsByDay.map((dayGroup) => (
              <div key={dayGroup.dayOffset} className="relative">
                <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 px-2 py-2 flex items-center gap-2 mb-1">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                    Day {dayGroup.dayOffset}
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                </div>

                <SortableContext
                  items={dayGroup.actions.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {dayGroup.actions.map((action) => (
                      <SortableActionItem
                        key={action.id}
                        action={action}
                        isSelected={selectedActionId === action.id}
                        onSelect={() => onSelectAction(action.id)}
                        onDelete={() => onDeleteAction(action.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))
          )}
        </DndContext>

        {canAddProcesses ? (
          <button
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary dark:hover:border-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium mt-4"
            onClick={onCreateAction}
          >
            <Plus className="w-4 h-4" />
            Add New Step
          </button>
        ) : (
          <div className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2 text-sm font-medium mt-4 cursor-not-allowed">
            <Plus className="w-4 h-4" />
            <span>Processos não podem ser adicionados neste tipo de etapa</span>
          </div>
        )}
        <div className="h-10"></div>
      </div>
    </aside>
  );
}

