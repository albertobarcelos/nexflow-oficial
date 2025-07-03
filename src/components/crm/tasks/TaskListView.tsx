import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { GripVertical } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
    onCompleteTask?: (taskId: string) => void;
    onReorderTasks?: (startIndex: number, endIndex: number) => void;
}

export function TaskListView({ tasks, onAddTask, onTaskClick, onCompleteTask, onReorderTasks }: TaskListViewProps) {
    const isMobile = useIsMobile();

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const startIndex = result.source.index;
        const endIndex = result.destination.index;

        if (startIndex !== endIndex && onReorderTasks) {
            onReorderTasks(startIndex, endIndex);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header com dica de reordenação */}
            {tasks.length > 1 && (
                <div className="px-4 md:px-6 py-2 border-b bg-slate-50/50">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <GripVertical className="h-4 w-4" />
                        <span>
                            {isMobile
                                ? 'Toque e arraste pelo ícone para reordenar'
                                : 'Passe o mouse sobre uma tarefa e arraste para reordenar'
                            }
                        </span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {/* Ícone de vazio */}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Nenhuma tarefa</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Nenhuma tarefa encontrada com os filtros atuais.
                            </p>
                        </div>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="task-list">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-3"
                                >
                                    {tasks.map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`group relative transition-all duration-200 ${snapshot.isDragging
                                                        ? 'shadow-xl scale-105 rotate-2 z-50 bg-white rounded-lg border-2 border-blue-200'
                                                        : 'hover:shadow-md'
                                                        }`}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        transform: snapshot.isDragging
                                                            ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                                            : provided.draggableProps.style?.transform,
                                                    }}
                                                >
                                                    {/* Handle de drag */}
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 transition-all duration-200 cursor-grab active:cursor-grabbing ${snapshot.isDragging
                                                            ? 'opacity-100 scale-110'
                                                            : isMobile ? 'opacity-75' : 'opacity-0 group-hover:opacity-100'
                                                            }`}
                                                    >
                                                        <div className={`backdrop-blur-sm rounded p-1.5 shadow-lg border ${snapshot.isDragging
                                                            ? 'bg-blue-500/90 border-blue-200'
                                                            : 'bg-white/90 border-gray-200'
                                                            }`}>
                                                            <GripVertical className={`h-4 w-4 ${snapshot.isDragging ? 'text-white' : 'text-gray-400'
                                                                }`} />
                                                        </div>
                                                    </div>

                                                    {/* TaskCard com padding à esquerda para o handle */}
                                                    <div className={`transition-all duration-200 ${snapshot.isDragging ? 'pl-12' : 'pl-8 group-hover:pl-12'
                                                        }`}>
                                                        <TaskCard
                                                            task={task}
                                                            onTaskClick={onTaskClick}
                                                            onCompleteTask={onCompleteTask}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>
        </div>
    );
}

