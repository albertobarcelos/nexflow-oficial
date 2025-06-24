import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, CheckCircle, Users, Mail, Handshake, FileText, Phone, Monitor, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description?: string;
    entity?: string; // Ex: "Venda para ACME S.A."
    status: 'todo' | 'doing' | 'done';
    priority: 'low' | 'medium' | 'high';
    assigned_to: string | null;
    due_date: string | null;
    assigned_to_collaborator?: {
      name: string;
    };
    // Para ação rápida
    onFinish?: () => void;
  };
  provided: any;
  onClick: () => void;
  isMobileLayout?: boolean;
  isDragging?: boolean;
};

const priorityConfig = {
  low: {
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400'
  },
  medium: {
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400'
  },
  high: {
    color: 'bg-rose-100 text-rose-700',
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

const typeIconConfig: Record<string, { icon: any; color: string }> = {
  'Reunião': { icon: Users, color: '#8b5cf6' },
  'E-mail': { icon: Mail, color: '#10b981' },
  'Negociação': { icon: Handshake, color: '#ef4444' },
  'Proposta': { icon: FileText, color: '#f59e0b' },
  'Ligação': { icon: Phone, color: '#3b82f6' },
  'Follow-up': { icon: Clock, color: '#f59e42' },
  'Demonstração': { icon: Monitor, color: '#6366f1' },
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
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    if (diffHours < 0) return { text: 'Atrasada', urgent: true };
    if (diffHours < 1) return { text: `${diffMinutes} min`, urgent: true };
    if (diffHours < 24) return { text: `${diffHours}h`, urgent: true };
    if (diffHours < 48) return { text: 'Amanhã', urgent: false };
    const diffDays = Math.ceil(diffHours / 24);
    return { text: `${diffDays}d`, urgent: false };
  };
  const timeInfo = getTimeUntilDue();

  // Ícone do tipo de tarefa
  const typeKey = (task as any).type || 'Reunião';
  const TypeIcon = typeIconConfig[typeKey]?.icon || Users;
  const typeColor = typeIconConfig[typeKey]?.color || '#64748b';

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`
        group relative overflow-visible border-0 shadow-none rounded-md bg-white transition-all duration-150
        ${isDragging ? 'shadow-md scale-[1.03] z-50' : 'hover:shadow-md'}
        ${isMobileLayout ? 'border-slate-200' : 'border-slate-200/60'}
        px-0 py-0
        min-h-[54px] max-w-full
        mb-1.5
      `}
      onClick={onClick}
    >
      <CardContent className="p-2.5 pb-1.5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 min-h-[20px]">
          {/* Ícone do tipo de tarefa */}
          <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm" style={{ background: typeColor + '22' }}>
            <TypeIcon className="w-4 h-4" color={typeColor} />
          </div>
          {/* Título e responsável/prioridade */}
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-[13px] font-semibold text-slate-900 truncate">
              {task.title}
            </span>
            {/* Oportunidade */}
            {task.entity && (
              <span className="text-[11px] text-slate-400 truncate leading-tight -mt-0.5 mb-0.5">
                {task.entity}
              </span>
            )}
            <div className="flex items-center gap-1 mt-0.5">
              {task.assigned_to_collaborator && (
                <span className="text-xs text-slate-700 truncate max-w-[70px]">
                  {task.assigned_to_collaborator.name}
                </span>
              )}
            </div>
          </div>

          {/* Prioridade */}
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className={`${priorityConfig[task.priority].color} text-[10px] px-2 py-0.5 font-medium border-0 rounded-full ml-1`}
            >
              {priorityLabels[task.priority]}
            </Badge>
          </div>
        </div>
        {/* Descrição */}
        {task.description && (
          <div className="text-xs text-slate-400 font-normal truncate leading-tight mt-0.5">
            {task.description}
          </div>
        )}
        {/* Rodapé: data/hora e tempo restante */}
        <div className="flex items-center justify-end gap-2 text-[11px] mt-0.5">
          {task.due_date && (
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {timeInfo && (
            <span className={timeInfo.urgent ? 'text-red-500 font-semibold' : 'text-slate-400'}>
              {timeInfo.text}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
