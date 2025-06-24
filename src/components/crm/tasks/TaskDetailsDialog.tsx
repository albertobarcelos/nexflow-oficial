import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Flag, Edit, Trash2, CheckCircle, Circle, Play } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'doing' | 'done' | 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    assigned_to: string | null;
    due_date: string;
    created_at?: string;
    responsible?: string;
    completed?: boolean;
    assigned_to_collaborator?: {
        name: string;
    };
}

interface TaskDetailsDialogProps {
    task: Task | null;
    open: boolean;
    onClose: () => void;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onStatusChange?: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => void;
}

const priorityConfig = {
    low: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-400',
        label: 'Baixa'
    },
    medium: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-400',
        label: 'Média'
    },
    high: {
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-400',
        label: 'Alta'
    },
};

const statusConfig = {
    todo: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Circle,
        label: 'A Fazer',
        dot: 'bg-blue-500'
    },
    doing: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Play,
        label: 'Em Andamento',
        dot: 'bg-amber-500'
    },
    done: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle,
        label: 'Concluído',
        dot: 'bg-emerald-500'
    },
    pending: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Circle,
        label: 'A Fazer',
        dot: 'bg-blue-500'
    },
    completed: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle,
        label: 'Concluído',
        dot: 'bg-emerald-500'
    },
};

export function TaskDetailsDialog({
    task,
    open,
    onClose,
    onEdit,
    onDelete,
    onStatusChange
}: TaskDetailsDialogProps) {
    if (!task) return null;

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
        if (diffHours < 24) return { text: `${diffHours} horas restantes`, urgent: true };
        if (diffHours < 48) return { text: 'Vence amanhã', urgent: false };

        const diffDays = Math.ceil(diffHours / 24);
        return { text: `${diffDays} dias restantes`, urgent: false };
    };

    const timeInfo = getTimeUntilDue();

    // Map status to display format
    const getDisplayStatus = (status: string): 'todo' | 'doing' | 'done' => {
        if (status === 'completed' || status === 'done') return 'done';
        if (status === 'doing') return 'doing';
        return 'todo';
    };

    const displayStatus = getDisplayStatus(task.status);
    const StatusIcon = statusConfig[displayStatus].icon;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-semibold text-slate-900 leading-tight pr-8">
                                {task.title}
                            </DialogTitle>
                        </div>
                    </div>

                    {/* Status e Priority Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                            variant="outline"
                            className={`${statusConfig[displayStatus].color} border-0 shadow-sm px-3 py-1.5 font-medium`}
                        >
                            <div className={`w-2 h-2 rounded-full ${statusConfig[displayStatus].dot} mr-2`} />
                            {statusConfig[displayStatus].label}
                        </Badge>

                        <Badge
                            variant="outline"
                            className={`${priorityConfig[task.priority].color} border-0 shadow-sm px-3 py-1.5 font-medium`}
                        >
                            <Flag className="w-3 h-3 mr-2" />
                            Prioridade {priorityConfig[task.priority].label}
                        </Badge>

                        {timeInfo && (
                            <Badge
                                variant="outline"
                                className={`${timeInfo.urgent
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    } border-0 shadow-sm px-3 py-1.5 font-medium`}
                            >
                                <Clock className="w-3 h-3 mr-2" />
                                {timeInfo.text}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Descrição */}
                    {task.description && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-slate-900 text-sm">Descrição</h3>
                            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg">
                                {task.description}
                            </p>
                        </div>
                    )}

                    <Separator />

                    {/* Informações principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Responsável */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Responsável
                            </h3>
                            <div className="flex items-center gap-3">
                                {task.assigned_to_collaborator || task.responsible ? (
                                    <>
                                        <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                                            <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                                {getInitials(task.assigned_to_collaborator?.name || task.responsible || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">
                                                {task.assigned_to_collaborator?.name || task.responsible}
                                            </p>
                                            <p className="text-xs text-slate-500">Responsável pela tarefa</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm">Não atribuída</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Data de vencimento */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Data de Vencimento
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${timeInfo?.urgent ? 'bg-red-100' : 'bg-blue-100'
                                    }`}>
                                    <Calendar className={`w-5 h-5 ${timeInfo?.urgent ? 'text-red-600' : 'text-blue-600'
                                        }`} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 text-sm">
                                        {new Date(task.due_date).toLocaleDateString('pt-BR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(task.due_date).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data de criação */}
                    {task.created_at && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-900 text-sm">Informações adicionais</h3>
                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                    <p>
                                        <strong>Criada em:</strong> {' '}
                                        {new Date(task.created_at).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    <p className="mt-1">
                                        <strong>ID da tarefa:</strong> {task.id}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <Separator />

                    {/* Ações rápidas de status */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 text-sm">Alterar Status</h3>
                        <div className="flex gap-2 flex-wrap">
                            {(['todo', 'doing', 'done'] as const).map((status) => {
                                const config = statusConfig[status];
                                const Icon = config.icon;
                                const isActive = displayStatus === status;

                                return (
                                    <Button
                                        key={status}
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        className={`${isActive
                                                ? `${config.color} border-0`
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        onClick={() => onStatusChange?.(task.id, status)}
                                        disabled={isActive}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {config.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <Separator />

                    {/* Ações */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit?.(task)}
                                className="text-slate-600 hover:text-slate-900"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete?.(task.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={onClose}>
                            Fechar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 