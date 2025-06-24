import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskColumn } from './TaskColumn';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Mail, Phone, Handshake, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Task {
    id: string;
    title: string;
    status: 'todo' | 'doing' | 'done';
    priority: 'low' | 'medium' | 'high';
    assigned_to: string | null;
    due_date: string;
    assigned_to_collaborator?: {
        name: string;
    };
    type?: string;
}

type Column = {
    id: 'todo' | 'doing' | 'done';
    title: string;
    tasks: Task[];
};

interface TaskBoardViewProps {
    columns: Column[];
    onColumnsChange: (columns: Column[]) => void;
    onTaskClick?: (taskId: string) => void;
}

export function TaskBoardView({ columns, onColumnsChange, onTaskClick }: TaskBoardViewProps) {
    const [activeTab, setActiveTab] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const isMobile = useIsMobile();
    const { toast } = useToast();

    // Filter tasks based on active filters
    const getFilteredColumns = () => {
        return columns.map(column => {
            let filteredTasks = column.tasks;

            // Filter by tab (status)
            if (activeTab === 'pending') {
                filteredTasks = filteredTasks.filter(task => task.status === 'todo' || task.status === 'doing');
            } else if (activeTab === 'completed') {
                filteredTasks = filteredTasks.filter(task => task.status === 'done');
            }

            // Filter by priority
            if (priorityFilter !== 'all') {
                filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
            }

            // Filter by period (simplified - can be enhanced)
            if (periodFilter === 'today') {
                const today = new Date().toDateString();
                filteredTasks = filteredTasks.filter(task =>
                    new Date(task.due_date).toDateString() === today
                );
            } else if (periodFilter === 'week') {
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                filteredTasks = filteredTasks.filter(task =>
                    new Date(task.due_date) <= weekFromNow
                );
            }

            // Filter by type
            if (typeFilter !== 'all') {
                filteredTasks = filteredTasks.filter(task => (task.type || 'email') === typeFilter);
            }

            return {
                ...column,
                tasks: filteredTasks
            };
        });
    };

    const onDragEnd = async (result: {
        destination?: { droppableId: string; index: number };
        source: { droppableId: string; index: number };
        draggableId: string;
    }) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Find the task in the original (unfiltered) columns
        const sourceCol = columns.find(col => col.id === source.droppableId);
        const destCol = columns.find(col => col.id === destination.droppableId);

        if (!sourceCol || !destCol) return;

        // Find the actual task in the filtered results
        const filteredSourceCol = filteredColumns.find(col => col.id === source.droppableId);
        if (!filteredSourceCol) return;

        const draggedTask = filteredSourceCol.tasks[source.index];
        if (!draggedTask) return;

        // Find the task index in the original column
        const originalSourceIndex = sourceCol.tasks.findIndex(task => task.id === draggedTask.id);
        if (originalSourceIndex === -1) return;

        const newColumns = columns.map(col => {
            if (col.id === source.droppableId) {
                const newTasks = Array.from(col.tasks);
                newTasks.splice(originalSourceIndex, 1);
                return { ...col, tasks: newTasks };
            }
            if (col.id === destination.droppableId) {
                const newTasks = Array.from(col.tasks);
                const updatedTask = { ...draggedTask, status: destination.droppableId as 'todo' | 'doing' | 'done' };

                // Calculate the correct insertion index in the original column
                const filteredDestCol = filteredColumns.find(col => col.id === destination.droppableId);
                let insertIndex = destination.index;

                if (filteredDestCol && destination.index < filteredDestCol.tasks.length) {
                    const taskAtIndex = filteredDestCol.tasks[destination.index];
                    insertIndex = newTasks.findIndex(task => task.id === taskAtIndex.id);
                } else {
                    insertIndex = newTasks.length;
                }

                newTasks.splice(insertIndex, 0, updatedTask);
                return { ...col, tasks: newTasks };
            }
            return col;
        });

        onColumnsChange(newColumns);

        try {
            toast({
                title: "Status atualizado",
                description: "O status da tarefa foi atualizado com sucesso.",
            });
        } catch (error) {
            console.error('Error updating task status:', error);
            toast({
                title: "Erro ao atualizar status",
                description: "Não foi possível atualizar o status da tarefa.",
                variant: "destructive",
            });
        }
    };

    const filteredColumns = getFilteredColumns();
    const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
    const pendingTasks = columns.reduce((sum, col) =>
        sum + col.tasks.filter(t => t.status === 'todo' || t.status === 'doing').length, 0
    );
    const completedTasks = columns.find(col => col.id === 'done')?.tasks.length || 0;

    return (
        <div className="h-full flex flex-col">
            {/* Filtros */}
            <div className="bg-white border-b px-4 py-4 md:px-6 flex-shrink-0">
                <div className="flex flex-col gap-4">
                    {/* Filtros adicionais */}
                    <div className="flex items-center gap-3 overflow-x-auto">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />

                        {/* Filtro por período */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-600 font-medium whitespace-nowrap">Período:</span>
                            <Select value={periodFilter} onValueChange={setPeriodFilter}>
                                <SelectTrigger className="w-32 h-8 text-xs bg-slate-100 border-none focus:ring-0 focus:outline-none">
                                    <SelectValue>{
                                        periodFilter === 'all' ? 'Todas' :
                                            periodFilter === 'today' ? 'Hoje' :
                                                periodFilter === 'week' ? 'Esta semana' : ''
                                    }</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="today">Hoje</SelectItem>
                                    <SelectItem value="week">Esta semana</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro por prioridade */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-600 font-medium whitespace-nowrap">Prioridade:</span>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-32 h-8 text-xs bg-slate-100 border-none focus:ring-0 focus:outline-none">
                                    <SelectValue>{
                                        priorityFilter === 'all' ? 'Todas' :
                                            priorityFilter === 'high' ? 'Alta' :
                                                priorityFilter === 'medium' ? 'Média' :
                                                    priorityFilter === 'low' ? 'Baixa' : ''
                                    }</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="low">Baixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro por tipo */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-600 font-medium whitespace-nowrap">Tipo:</span>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-36 h-8 text-xs bg-slate-100 border-none focus:ring-0 focus:outline-none">
                                    <SelectValue>
                                        {typeFilter === 'all' && <span className="flex items-center gap-2">Todos</span>}
                                        {typeFilter === 'email' && <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" />E-mail</span>}
                                        {typeFilter === 'call' && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" />Ligação</span>}
                                        {typeFilter === 'meeting' && <span className="flex items-center gap-2"><Handshake className="w-4 h-4 text-yellow-500" />Reunião</span>}
                                        {typeFilter === 'team' && <span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" />Equipe</span>}
                                        {typeFilter === 'document' && <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" />Documento</span>}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all"><span className="flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" />Todos</span></SelectItem>
                                    <SelectItem value="email"><span className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" />E-mail</span></SelectItem>
                                    <SelectItem value="call"><span className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" />Ligação</span></SelectItem>
                                    <SelectItem value="meeting"><span className="flex items-center gap-2"><Handshake className="w-4 h-4 text-yellow-500" />Reunião</span></SelectItem>
                                    <SelectItem value="team"><span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" />Equipe</span></SelectItem>
                                    <SelectItem value="document"><span className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" />Documento</span></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Board content */}
            <div className="flex-1 overflow-hidden">
                {/* Empty state quando todos os filtros estão ativos mas não há tarefas */}
                {(activeTab !== 'all' || priorityFilter !== 'all' || periodFilter !== 'all') &&
                    filteredColumns.every(col => col.tasks.length === 0) ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Nenhuma tarefa encontrada</h3>
                            <p className="text-sm text-slate-500">
                                Ajuste os filtros para ver mais tarefas
                            </p>
                        </div>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        {isMobile ? (
                            // Layout mobile: cards em coluna única
                            <div className="h-full overflow-y-auto p-4 space-y-4">
                                {filteredColumns.map(column => (
                                    <Card key={column.id} className="overflow-hidden">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center justify-between text-base">
                                                <span>{column.title}</span>
                                                <span className="text-sm font-normal bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                    {column.tasks.length}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <TaskColumn
                                                id={column.id}
                                                title=""
                                                tasks={column.tasks}
                                                isMobileLayout={true}
                                                onTaskClick={onTaskClick}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            // Layout desktop: kanban horizontal
                            <div className="h-full p-4 md:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                                    {filteredColumns.map(column => (
                                        <div key={column.id} className="flex flex-col min-h-0">
                                            <TaskColumn
                                                id={column.id}
                                                title={column.title}
                                                tasks={column.tasks}
                                                isMobileLayout={false}
                                                onTaskClick={onTaskClick}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DragDropContext>
                )}
            </div>
        </div>
    );
} 