import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { OpportunityCard } from "./OpportunityCard";
import { useNavigate } from "react-router-dom";

type Opportunity = {
  id: string;
  title: string;
  value: number | null;
  expected_close_date: string | null;
  category?: {
    name: string;
    color: string;
  } | null;
};

type KanbanColumnProps = {
  id: string;
  title: string;
  color: string;
  opportunities: Opportunity[];
};

export function KanbanColumn({ id, title, color, opportunities }: KanbanColumnProps) {
  const navigate = useNavigate();

  return (
    <Card className={`w-80 shrink-0 border-t-4 border-t-${color}-500 bg-muted/50`}>
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{title}</span>
          {opportunities.length > 0 && (
            <span className="text-muted-foreground text-xs">
              ({opportunities.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Droppable droppableId={id}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2 min-h-[200px]"
            >
              {opportunities.map((opportunity, index) => (
                <Draggable
                  key={opportunity.id}
                  draggableId={opportunity.id}
                  index={index}
                >
                  {(provided) => (
                    <OpportunityCard
                      opportunity={opportunity}
                      provided={provided}
                      onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}