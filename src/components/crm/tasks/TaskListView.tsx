import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { GripVertical } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Task {
    id: string;
    title: string;
    description: string;
    type: string;
    status: 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    created_at: string;
    assigned_to: string;
    opportunity_id?: string;
    opportunity_name?: string;
    created_by: string;
    responsible: string;
    completed: boolean;
}

interface TaskListViewProps {
    tasks: Task[];
    onAddTask: () => void;
    onTaskClick?: (taskId: string) => void;
    onCompleteTask?: (taskId: string) => void;
    onReorderTasks?: (startIndex: number, endIndex: number) => void;
}

// Componente para item draggable usando @dnd-kit
function SortableTaskItem({ 
  task, 
  index, 
  onTaskClick, 
  onCompleteTask 
}: { 
  task: Task; 
  index: number; 
  onTaskClick?: (taskId: string) => void; 
  onCompleteTask?: (taskId: string) => void; 
}) {
  const isMobile = useIsMobile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative transition-all duration-200 ${isDragging
        ? 'shadow-xl scale-105 rotate-2 z-50 bg-white rounded-lg border-2 border-blue-200'
        : 'hover:shadow-md'
        }`}
    >
      {/* Handle de drag */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 transition-all duration-200 cursor-grab active:cursor-grabbing ${isDragging
          ? 'opacity-100 scale-110'
          : isMobile ? 'opacity-75' : 'opacity-0 group-hover:opacity-100'
          }`}
      >
        <div className={`backdrop-blur-sm rounded p-1.5 shadow-lg border ${isDragging
          ? 'bg-blue-500/90 border-blue-200'
          : 'bg-white/90 border-gray-200'
          }`}>
          <GripVertical className={`h-4 w-4 ${isDragging ? 'text-white' : 'text-gray-400'
            }`} />
        </div>
      </div>

      {/* TaskCard com padding à esquerda para o handle */}
      <div className={`transition-all duration-200 ${isDragging ? 'pl-12' : 'pl-8 group-hover:pl-12'
        }`}>
        <TaskCard
          task={task}
          onTaskClick={onTaskClick}
          onCompleteTask={onCompleteTask}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
}

export function TaskListView({ tasks, onAddTask, onTaskClick, onCompleteTask, onReorderTasks }: TaskListViewProps) {
    const isMobile = useIsMobile();

    // Configuração dos sensores para @dnd-kit
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = tasks.findIndex(task => task.id === active.id);
            const newIndex = tasks.findIndex(task => task.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1 && onReorderTasks) {
                onReorderTasks(oldIndex, newIndex);
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header com dica de reordenação */}
            {tasks.length > 1 && (
                <div className="px-4 md:px-6 py-2 border-b bg-slate-50/50">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <GripVertical className="h-4 w-4" />
                        <span>
                            {isMobile
                                ? 'Toque e arraste pelo ícone para reordenar'
                                : 'Passe o mouse sobre uma tarefa e arraste para reordenar'
                            }
                        </span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {/* Ícone de vazio */}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Nenhuma tarefa</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Nenhuma tarefa encontrada com os filtros atuais.
                            </p>
                        </div>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="space-y-3">
                            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                                {tasks.map((task, index) => (
                                    <SortableTaskItem
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        onTaskClick={onTaskClick}
                                        onCompleteTask={onCompleteTask}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </DndContext>
                )}
            </div>
        </div>
    );
}

