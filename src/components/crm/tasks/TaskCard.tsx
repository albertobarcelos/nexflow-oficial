import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type TaskCardProps = {
  task: {
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
  provided: any;
  onClick: () => void;
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export function TaskCard({ task, provided, onClick }: TaskCardProps) {
  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <h4 className="font-medium">{task.title}</h4>
        <div className="flex gap-2 mt-2">
          <Badge 
            variant="secondary"
            className={priorityColors[task.priority]}
          >
            {task.priority === 'low' ? 'Baixa' : 
             task.priority === 'medium' ? 'Média' : 'Alta'}
          </Badge>
          {task.assigned_to_collaborator && (
            <Badge variant="outline">
              {task.assigned_to_collaborator.name}
            </Badge>
          )}
        </div>
        {task.due_date && (
          <p className="text-sm text-muted-foreground mt-2">
            Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}