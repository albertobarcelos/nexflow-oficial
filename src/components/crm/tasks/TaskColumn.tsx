import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { useNavigate } from 'react-router-dom';

type Task = {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  due_date: string | null;
  assigned_to_collaborator?: {
    name: string;
  };
};

type TaskColumnProps = {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
  isMobileLayout?: boolean;
};

export function TaskColumn({ id, title, tasks, isMobileLayout = false }: TaskColumnProps) {
  const navigate = useNavigate();

  return (
    <div className={`${isMobileLayout ? '' : 'bg-muted p-4 rounded-lg h-full flex flex-col'}`}>
      {!isMobileLayout && title && (
        <h3 className="font-semibold mb-4">{title}</h3>
      )}
      <Droppable droppableId={id}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`${isMobileLayout ? 'space-y-2' : 'space-y-2 min-h-[200px] flex-1'}`}
          >
            {tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
              >
                {(provided) => (
                  <TaskCard
                    task={task}
                    provided={provided}
                    onClick={() => navigate(`/crm/tasks/${task.id}`)}
                    isMobileLayout={isMobileLayout}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Empty state */}
            {tasks.length === 0 && (
              <div className={`flex items-center justify-center text-muted-foreground text-sm ${isMobileLayout ? 'py-4' : 'py-8'}`}>
                Nenhuma tarefa
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
