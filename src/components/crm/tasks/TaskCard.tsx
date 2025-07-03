import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Users,
    Phone,
    Mail,
    Calendar,
    CheckCircle,
    Clock,
    User,
    Briefcase,
    Handshake,
    FileText,
    Monitor,
    LucideIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTaskStatusChange } from '@/hooks/useTaskHistory';
import clsx from 'clsx';
import { motion } from 'framer-motion';

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

interface TaskCardProps {
    task: Task;
    onTaskClick?: (taskId: string) => void;
    onCompleteTask?: (taskId: string) => void;
    isDragging?: boolean;
}

// Configuração de tipos de tarefa
const typeIconConfig: Record<string, { icon: LucideIcon; color: string }> = {
    'Reunião': { icon: Users, color: '#8b5cf6' },
    'E-mail': { icon: Mail, color: '#10b981' },
    'Negociação': { icon: Handshake, color: '#ef4444' },
    'Proposta': { icon: FileText, color: '#f59e0b' },
    'Ligação': { icon: Phone, color: '#3b82f6' },
    'Follow-up': { icon: Clock, color: '#f59e42' },
    'Demonstração': { icon: Monitor, color: '#6366f1' },
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return 'bg-red-50 text-red-700 border border-red-200';
        case 'medium': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
        case 'low': return 'bg-green-50 text-green-700 border border-green-200';
        default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
};

const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
};

const getTypeIconAndColor = (type: string) => {
    return typeIconConfig[type] || { icon: Calendar, color: '#64748b' };
};

export function TaskCard({ task, onTaskClick, onCompleteTask, isDragging }: TaskCardProps) {
    const isMobile = useIsMobile();
    const { logStatusChange } = useTaskStatusChange();

    const timeAgo = formatDistanceToNow(new Date(task.created_at), {
        addSuffix: true,
        locale: ptBR
    });

    const { icon: TypeIcon, color: typeColor } = getTypeIconAndColor(task.type);
    const isPending = !task.completed;
    const isCompleted = task.completed;

    const handleCompleteTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onCompleteTask && isPending) {
            // Registrar mudança de status no histórico
            logStatusChange(task.id, 'pending', 'completed', 'Usuário Atual');
            onCompleteTask(task.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            whileHover={{ scale: 1.025, boxShadow: '0 4px 24px 0 rgba(80,80,120,0.10)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{ zIndex: isDragging ? 100 : undefined }}
        >
            <Card
                className={clsx(
                    'p-3 sm:p-4 border rounded-xl transition-all duration-200 cursor-pointer',
                    isPending ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300' : 'bg-slate-50 border-slate-200 shadow-sm',
                    'hover:-translate-y-0.5',
                    isDragging ? 'scale-[1.03] shadow-lg ring-2 ring-blue-200' : ''
                )}
                onClick={() => onTaskClick?.(task.id)}
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Ícone do tipo */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0" style={{ background: typeColor + '22' }}>
                        <TypeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" color={typeColor} />
                    </div>

                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <h4 className={clsx(
                                    'font-semibold text-xs sm:text-sm mb-1 line-clamp-1 sm:line-clamp-none',
                                    isPending ? 'text-slate-900' : 'text-slate-600'
                                )}>
                                    {task.title}
                                </h4>
                                <p className="text-xs text-slate-500 mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
                                    {task.description}
                                </p>
                            </div>

                            {/* Botão de finalizar */}
                            {isPending && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:bg-green-50 hover:text-green-700 ml-2 sm:ml-3 flex-shrink-0 h-7 sm:h-8 transition-colors px-2 sm:px-3"
                                    onClick={handleCompleteTask}
                                >
                                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="ml-1 text-xs sm:text-sm hidden sm:inline">Finalizar</span>
                                </Button>
                            )}
                        </div>

                        {/* Metadados */}
                        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-slate-500 mb-2 sm:mb-3">
                            {task.opportunity_name && (
                                <div className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3 text-slate-400" />
                                    <span className="truncate max-w-[120px] sm:max-w-none">{task.opportunity_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="truncate">Responsável: {task.responsible}</span>
                            </div>
                        </div>

                        {/* Footer com badges e data */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <Badge className={clsx('text-xs px-1.5 sm:px-2 py-0.5 font-medium', getPriorityColor(task.priority))}>
                                    {priorityLabels[task.priority as keyof typeof priorityLabels]}
                                </Badge>
                                {isCompleted && (
                                    <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs px-1.5 sm:px-2 py-0.5 font-medium">
                                        Concluída
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span className="hidden sm:inline">{new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="sm:hidden">{new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <span className="hidden sm:inline">{timeAgo.replace('há ', '').replace('cerca de ', '').replace(' atrás', '')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}