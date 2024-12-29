import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { OpportunityCard } from "./OpportunityCard";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Opportunity = {
  id: string;
  title: string;
  value: number | null;
  expected_close_date: string | null;
  category?: {
    name: string;
    color: string;
  } | null;
  assigned_to?: {
    name: string;
    avatar_url?: string;
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
    <Card className="w-[278px] shrink-0 bg-white shadow-sm">
      <CardHeader className={`h-[35px] p-2 border-t-4 border-t-${color}-500 bg-${color}-50 flex flex-row items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-muted-foreground text-xs">
            ({opportunities.length})
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-2 bg-muted/30 h-[723px] overflow-y-auto mt-2">
        <Droppable droppableId={id}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
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