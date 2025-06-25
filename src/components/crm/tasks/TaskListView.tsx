import { TaskCard } from './TaskCard';

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
}

export function TaskListView({ tasks, onAddTask, onTaskClick, onCompleteTask }: TaskListViewProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="space-y-3">
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
                        tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onTaskClick={onTaskClick}
                                onCompleteTask={onCompleteTask}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Determina se é agendamento baseado na data/hora
const isScheduled = () => {
    if (!formData.due_date) return false;

    const now = new Date();
    const selectedDateTime = new Date(formData.due_date);

    if (formData.due_time) {
        const [hours, minutes] = formData.due_time.split(':');
        selectedDateTime.setHours(parseInt(hours), parseInt(minutes));
    }

    return selectedDateTime > now;
}; 