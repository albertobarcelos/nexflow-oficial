import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
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
    onStatusChange?: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => void;
    onTaskReorder?: (columnId: 'todo' | 'doing' | 'done', sourceIndex: number, destIndex: number) => void;
}

export function TaskBoardView({ columns, onColumnsChange, onTaskClick, onStatusChange, onTaskReorder }: TaskBoardViewProps) {
    const isMobile = useIsMobile();
    const { toast } = useToast();

    // Configuração dos sensores para @dnd-kit
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Encontrar a tarefa sendo movida
        let movedTask: Task | undefined;
        let sourceColumn: Column | undefined;
        let sourceIndex = -1;

        for (const column of columns) {
            const taskIndex = column.tasks.findIndex(task => task.id === activeId);
            if (taskIndex !== -1) {
                movedTask = column.tasks[taskIndex];
                sourceColumn = column;
                sourceIndex = taskIndex;
                break;
            }
        }

        if (!movedTask || !sourceColumn) return;

        // Determinar a coluna de destino
        let destColumn: Column | undefined;
        let destIndex = 0;

        // Se foi solto sobre uma coluna
        if (overId === 'todo' || overId === 'doing' || overId === 'done') {
            destColumn = columns.find(col => col.id === overId);
            destIndex = destColumn?.tasks.length || 0;
        } else {
            // Se foi solto sobre uma tarefa, encontrar a coluna dessa tarefa
            for (const column of columns) {
                const taskIndex = column.tasks.findIndex(task => task.id === overId);
                if (taskIndex !== -1) {
                    destColumn = column;
                    destIndex = taskIndex;
                    break;
                }
            }
        }

        if (!destColumn) return;

        // Criar cópia das colunas para manipulação
        const newColumns = [...columns];
        const newSourceColumn = newColumns.find(col => col.id === sourceColumn.id)!;
        const newDestColumn = newColumns.find(col => col.id === destColumn.id)!;

        // Remover a tarefa da coluna de origem
        newSourceColumn.tasks.splice(sourceIndex, 1);

        if (sourceColumn.id === destColumn.id) {
            // Reordenação dentro da mesma coluna
            newDestColumn.tasks.splice(destIndex, 0, movedTask);

            // Atualizar as colunas localmente
            onColumnsChange(newColumns);

            // Chamar callback para persistir a reordenação
            if (onTaskReorder) {
                onTaskReorder(sourceColumn.id, sourceIndex, destIndex);
            }

            toast({
                title: "Ordem atualizada",
                description: `"${movedTask.title}" foi reordenada na coluna ${destColumn.title}.`,
                duration: 2000,
            });
        } else {
            // Mover entre colunas diferentes
            // Atualizar o status da tarefa
            const updatedTask = { ...movedTask, status: destColumn.id };
            newDestColumn.tasks.splice(destIndex, 0, updatedTask);

            // Atualizar as colunas localmente
            onColumnsChange(newColumns);

            // Chamar callback para atualizar o status na fonte de dados principal
            if (onStatusChange) {
                onStatusChange(activeId, destColumn.id);
            }

            toast({
                title: "Status atualizado",
                description: `"${movedTask.title}" foi movida para ${destColumn.title}.`,
                duration: 2000,
            });
        }
    };

    // Handle status change from task card button
    const handleStatusChange = (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
        if (onStatusChange) {
            onStatusChange(taskId, newStatus);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Board content */}
            <div className="flex-1 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {isMobile ? (
                        <div className="h-full overflow-y-auto p-4 space-y-4">
                            {columns.map(column => (
                                <Card key={column.id} className="">
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
                                            onStatusChange={handleStatusChange}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full p-3 sm:p-4 lg:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 h-full sm:max-h-[calc(100vh-200px)]">
                                {columns.map(column => (
                                    <div key={column.id} className="flex flex-col h-full min-h-0">
                                        <TaskColumn
                                            id={column.id}
                                            title={column.title}
                                            tasks={column.tasks}
                                            isMobileLayout={false}
                                            onTaskClick={onTaskClick}
                                            onStatusChange={handleStatusChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DndContext>
            </div>
        </div>
    );
} 