import { useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  due_date: string | null;
  assigned_to_collaborator?: {
    name: string;
  };
  type?: string;
  opportunity_name?: string;
  responsible?: string;
  completed?: boolean;
  created_at?: string;
};

type TaskColumnProps = {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
  isMobileLayout?: boolean;
  onTaskClick?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => void;
};

const getColumnTheme = (id: string) => {
  switch (id) {
    case 'todo':
      return {
        bg: 'bg-gradient-to-br from-blue-50/80 to-blue-100/40',
        border: 'border-blue-200/60',
        header: 'bg-blue-50/90 border-blue-200/60',
        title: 'text-blue-700',
        accent: 'bg-blue-500'
      };
    case 'doing':
      return {
        bg: 'bg-gradient-to-br from-amber-50/80 to-amber-100/40',
        border: 'border-amber-200/60',
        header: 'bg-amber-50/90 border-amber-200/60',
        title: 'text-amber-700',
        accent: 'bg-amber-500'
      };
    case 'done':
      return {
        bg: 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/40',
        border: 'border-emerald-200/60',
        header: 'bg-emerald-50/90 border-emerald-200/60',
        title: 'text-emerald-700',
        accent: 'bg-emerald-500'
      };
    default:
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        header: 'bg-slate-50',
        title: 'text-slate-700',
        accent: 'bg-slate-500'
      };
  }
};

// Componente para item draggable usando @dnd-kit
function DraggableTaskItem({ task, onTaskClick, onCompleteTask }: {
  task: Task;
  onTaskClick: () => void;
  onCompleteTask: () => void;
}) {
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
    opacity: isDragging ? 0.75 : 1,
  };

  // Convert task format for TaskCard
  const convertTaskForListCard = (task: Task) => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    type: task.type || 'Reunião',
    status: task.status === 'done' ? 'completed' as const : 'pending' as const,
    priority: task.priority,
    due_date: task.due_date || new Date().toISOString(),
    created_at: task.created_at || new Date().toISOString(),
    assigned_to: task.assigned_to || '',
    opportunity_id: undefined,
    opportunity_name: task.opportunity_name,
    created_by: 'Sistema',
    responsible: task.responsible || task.assigned_to_collaborator?.name || 'Não atribuído',
    completed: task.status === 'done'
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={convertTaskForListCard(task)}
        onTaskClick={onTaskClick}
        onCompleteTask={onCompleteTask}
        isDragging={isDragging}
      />
    </div>
  );
}

export function TaskColumn({ id, title, tasks, isMobileLayout = false, onTaskClick, onStatusChange }: TaskColumnProps) {
  const navigate = useNavigate();
  const theme = getColumnTheme(id);
  
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const handleTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    } else {
      navigate(`/crm/tasks/${taskId}`);
    }
  };

  const handleCompleteTask = (taskId: string) => {
    if (onStatusChange) {
      onStatusChange(taskId, 'done');
    }
  };

  return (
    <div className={`${isMobileLayout
      ? 'h-full flex flex-col min-h-0'
      : `backdrop-blur-sm border rounded-xl shadow-sm h-full flex flex-col min-h-0 ${theme.border} relative overflow-hidden`
      }`}>
      {/* Accent bar */}
      {!isMobileLayout && (
        <div className={`absolute top-0 left-0 w-full h-0.5 ${theme.accent}`} />
      )}

      {!isMobileLayout && title && (
        <div className={`px-3 sm:px-4 py-2 sm:py-3 ${theme.header} backdrop-blur-sm relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-xs sm:text-sm ${theme.title}`}>
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white/60 text-slate-600 text-xs font-medium border-0 shadow-sm px-1.5 sm:px-2 py-0.5"
              >
                {tasks.length}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div
        ref={setNodeRef}
        className={
          isMobileLayout
            ? 'flex-1 flex flex-col space-y-2'
            : `flex-1 flex flex-col space-y-2 sm:space-y-3 p-2 sm:p-3 ${theme.bg} overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 transition-all duration-200 ${isOver ? 'bg-blue-50' : ''}`
        }
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task, index) => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              onTaskClick={() => handleTaskClick(task.id)}
              onCompleteTask={() => handleCompleteTask(task.id)}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className={`flex flex-1 flex-col items-center justify-center text-slate-400 text-sm rounded-lg border-2 border-dashed border-slate-200 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/50 ${isMobileLayout ? 'py-6' : 'py-6 sm:py-8 my-1 sm:my-2'}`}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-slate-200 transition-colors">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </div>
            <span className="font-medium text-xs">Nenhuma tarefa</span>
            <span className="text-xs text-slate-300 mt-0.5">Arraste tarefas aqui</span>
          </div>
        )}
      </div>
    </div>
  );
}
