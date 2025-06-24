import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, Clock } from 'lucide-react';

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    status: 'todo' | 'doing' | 'done';
    priority: 'low' | 'medium' | 'high';
    assigned_to: string | null;
    due_date: string | null;
    assigned_to_collaborator?: {
      name: string;
    };
  };
  provided: any;
  onClick: () => void;
  isMobileLayout?: boolean;
  isDragging?: boolean;
};

const priorityConfig = {
  low: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400'
  },
  medium: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400'
  },
  high: {
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400'
  },
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const statusColors = {
  todo: 'bg-blue-500',
  doing: 'bg-yellow-500',
  done: 'bg-green-500'
};

export function TaskCard({ task, provided, onClick, isMobileLayout = false, isDragging = false }: TaskCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeUntilDue = () => {
    if (!task.due_date) return null;

    const now = new Date();
    const dueDate = new Date(task.due_date);
    const diffHours = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) return { text: 'Atrasada', urgent: true };
    if (diffHours < 24) return { text: `${diffHours}h`, urgent: true };
    if (diffHours < 48) return { text: 'Amanhã', urgent: false };

    const diffDays = Math.ceil(diffHours / 24);
    return { text: `${diffDays}d`, urgent: false };
  };

  const timeInfo = getTimeUntilDue();

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`
        cursor-grab active:cursor-grabbing transition-all duration-300 group
        ${isDragging
          ? 'shadow-2xl rotate-2 scale-105 z-50'
          : 'hover:shadow-lg shadow-sm hover:-translate-y-1'
        } 
        ${isMobileLayout ? 'border-slate-200' : 'border-slate-200/60 bg-white/90 backdrop-blur-sm'}
        hover:border-slate-300 relative overflow-hidden
      `}
      onClick={onClick}
    >
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 w-full h-0.5 ${statusColors[task.status]}`} />

      <CardContent className="p-3 relative">
        <div className="space-y-2.5">
          {/* Header com prioridade e tempo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
              <Badge
                variant="outline"
                className={`${priorityConfig[task.priority].color} text-[10px] px-1.5 py-0.5 font-medium border-0 shadow-sm`}
              >
                {priorityLabels[task.priority]}
              </Badge>
            </div>

            {timeInfo && (
              <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${timeInfo.urgent
                  ? 'bg-red-50 text-red-600'
                  : 'bg-slate-50 text-slate-600'
                }`}>
                <Clock className="w-2.5 h-2.5" />
                <span className="font-medium">{timeInfo.text}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h4 className="font-semibold text-slate-900 leading-tight text-sm line-clamp-2">
              {task.title}
            </h4>
          </div>

          {/* Footer com avatar e data */}
          <div className="flex items-center justify-between">
            {/* Avatar e nome */}
            {task.assigned_to_collaborator ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5 ring-1 ring-white shadow-sm">
                  <AvatarFallback className="text-[9px] bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {getInitials(task.assigned_to_collaborator.name)}
                  </AvatarFallback>
                </Avatar>
                {!isMobileLayout && (
                  <span className="text-[10px] text-slate-600 font-medium truncate max-w-16">
                    {task.assigned_to_collaborator.name.split(' ')[0]}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-2.5 h-2.5 text-slate-400" />
                </div>
                {!isMobileLayout && (
                  <span className="text-[10px] text-slate-400">Não atribuída</span>
                )}
              </div>
            )}

            {/* Data de vencimento */}
            {task.due_date && (
              <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                <Calendar className="w-2.5 h-2.5" />
                <span className="font-medium">
                  {new Date(task.due_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Subtle hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/[0.02] group-hover:to-purple-500/[0.02] transition-all duration-300 pointer-events-none" />
      </CardContent>
    </Card>
  );
}
