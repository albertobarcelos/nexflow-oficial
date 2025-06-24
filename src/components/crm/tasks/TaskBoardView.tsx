import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskColumn } from './TaskColumn';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
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
                            <div className="flex gap-1 bg-slate-100 rounded-md p-1">
                                {(['all', 'today', 'week'] as const).map((period) => (
                                    <Button
                                        key={period}
                                        variant="ghost"
                                        size="sm"
                                        className={`h-7 px-2 text-xs transition-all ${periodFilter === period
                                            ? 'bg-white shadow-sm text-slate-900'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        onClick={() => setPeriodFilter(period)}
                                    >
                                        {period === 'all' && <span className="hidden sm:inline">Todas</span>}
                                        {period === 'all' && <span className="sm:hidden">Todas</span>}
                                        {period === 'today' && <span className="hidden sm:inline">Hoje</span>}
                                        {period === 'today' && <span className="sm:hidden">Hoje</span>}
                                        {period === 'week' && <span className="hidden sm:inline">Esta semana</span>}
                                        {period === 'week' && <span className="sm:hidden">Semana</span>}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Filtro por prioridade */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-600 font-medium whitespace-nowrap">Prioridade:</span>
                            <div className="flex gap-1 bg-slate-100 rounded-md p-1">
                                {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
                                    <Button
                                        key={priority}
                                        variant="ghost"
                                        size="sm"
                                        className={`h-7 px-2 text-xs transition-all ${priorityFilter === priority
                                            ? 'bg-white shadow-sm text-slate-900'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        onClick={() => setPriorityFilter(priority)}
                                    >
                                        {priority === 'all' && <span className="hidden sm:inline">Todas</span>}
                                        {priority === 'all' && <span className="sm:hidden">Todas</span>}
                                        {priority === 'high' && <span className="hidden sm:inline">Alta</span>}
                                        {priority === 'high' && <span className="sm:hidden">Alta</span>}
                                        {priority === 'medium' && <span className="hidden sm:inline">Média</span>}
                                        {priority === 'medium' && <span className="sm:hidden">Méd</span>}
                                        {priority === 'low' && <span className="hidden sm:inline">Baixa</span>}
                                        {priority === 'low' && <span className="sm:hidden">Baixa</span>}
                                    </Button>
                                ))}
                            </div>
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