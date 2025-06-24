import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus,
    List,
    Users,
    Phone,
    Mail,
    Calendar,
    CheckCircle,
    Clock,
    User,
    Briefcase,
    Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import clsx from 'clsx';

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
}

export function TaskListView({ tasks, onAddTask, onTaskClick }: TaskListViewProps) {
    const [activeTab, setActiveTab] = useState('pending');
    const [filterBy, setFilterBy] = useState('all');
    const isMobile = useIsMobile();

    const filteredTasks = tasks.filter(task => {
        if (activeTab === 'pending') return !task.completed;
        if (activeTab === 'completed') return task.completed;
        return true;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-50 text-red-700 border border-red-200';
            case 'medium': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            case 'low': return 'bg-green-50 text-green-700 border border-green-200';
            default: return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'meeting': return Users;
            case 'call': return Phone;
            case 'email': return Mail;
            default: return Calendar;
        }
    };

    const handleCompleteTask = (taskId: string) => {
        // Implementar lógica de completar tarefa
        console.log('Completar tarefa:', taskId);
    };

    const TaskCard = ({ task }: { task: Task }) => {
        const timeAgo = formatDistanceToNow(new Date(task.created_at), {
            addSuffix: true,
            locale: ptBR
        });

        const TypeIcon = getTypeIcon(task.type);
        const isPending = !task.completed;

        return (
            <Card
                className={clsx(
                    'p-4 border rounded-xl transition-all duration-200 cursor-pointer',
                    isPending ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300' : 'bg-slate-50 border-slate-200 shadow-sm',
                    'hover:-translate-y-0.5'
                )}
                onClick={() => onTaskClick?.(task.id)}
            >
                <div className="flex items-center gap-4">
                    {/* Ícone do tipo */}
                    <div className={clsx(
                        'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 shadow-sm',
                        isPending ? 'bg-blue-100' : 'bg-slate-200'
                    )}>
                        <TypeIcon className={clsx('w-5 h-5', isPending ? 'text-blue-600' : 'text-slate-500')} />
                    </div>

                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <h4 className={clsx(
                                    'font-semibold text-sm mb-1 line-clamp-1',
                                    isPending ? 'text-slate-900' : 'text-slate-600'
                                )}>
                                    {task.title}
                                </h4>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                    {task.description}
                                </p>
                            </div>

                            {/* Botão de finalizar */}
                            {isPending && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:bg-green-50 hover:text-green-700 ml-3 flex-shrink-0 h-8 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCompleteTask(task.id);
                                    }}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {!isMobile && <span className="ml-1 text-sm">Finalizar</span>}
                                </Button>
                            )}
                        </div>

                        {/* Metadados */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                            {task.opportunity_name && (
                                <div className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3 text-slate-400" />
                                    <span className="truncate">{task.opportunity_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>Responsável: {task.responsible}</span>
                            </div>
                        </div>

                        {/* Footer com badges e data */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge className={clsx('text-xs px-2 py-0.5 font-medium', getPriorityColor(task.priority))}>
                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                </Badge>
                                {task.completed && (
                                    <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5 font-medium">
                                        Concluída
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <span>{timeAgo.replace('há ', '').replace('cerca de ', '').replace(' atrás', '')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Controles de filtro */}
            <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="grid w-fit grid-cols-2 bg-slate-100 h-10">
                        <TabsTrigger
                            value="pending"
                            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-sm px-4 transition-all"
                        >
                            Pendentes ({tasks.filter(t => !t.completed).length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="completed"
                            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-sm px-4 transition-all"
                        >
                            Finalizadas ({tasks.filter(t => t.completed).length})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-32 h-9 text-sm border-slate-200">
                            <SelectValue placeholder="Filtrar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="week">Esta semana</SelectItem>
                            <SelectItem value="priority">Por prioridade</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Lista de tarefas */}
            <div className="space-y-3">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">
                                {activeTab === 'pending' ? 'Nenhuma tarefa pendente' : 'Nenhuma tarefa finalizada'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {activeTab === 'pending'
                                    ? 'Adicione uma nova tarefa para começar'
                                    : 'Complete algumas tarefas para vê-las aqui'
                                }
                            </p>
                            {activeTab === 'pending' && (
                                <Button onClick={onAddTask} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Tarefa
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 