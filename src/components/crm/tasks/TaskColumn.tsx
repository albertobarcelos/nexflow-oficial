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
};

export function TaskColumn({ id, title, tasks }: TaskColumnProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="font-semibold mb-4">{title}</h3>
      <Droppable droppableId={id}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2 min-h-[200px]"
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
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}