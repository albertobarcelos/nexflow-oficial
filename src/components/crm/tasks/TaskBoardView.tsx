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
    onStatusChange?: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => void;
}

export function TaskBoardView({ columns, onColumnsChange, onTaskClick, onStatusChange }: TaskBoardViewProps) {
    const isMobile = useIsMobile();
    const { toast } = useToast();

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
        const filteredSourceCol = columns.find(col => col.id === source.droppableId);
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
                let insertIndex = destination.index;

                if (destination.index < col.tasks.length) {
                    const taskAtIndex = col.tasks[destination.index];
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
                <DragDropContext onDragEnd={onDragEnd}>
                    {isMobile ? (
                        <div className="h-full overflow-y-auto p-4 space-y-4">
                            {columns.map(column => (
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
                                            onStatusChange={handleStatusChange}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full p-4 md:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                                {columns.map(column => (
                                    <div key={column.id} className="flex flex-col min-h-0">
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
                </DragDropContext>
            </div>
        </div>
    );
} 