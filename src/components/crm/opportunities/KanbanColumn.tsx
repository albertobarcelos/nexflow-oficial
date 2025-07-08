import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// Componente para item draggable usando @dnd-kit
function SortableOpportunityItem({ 
  opportunity, 
  onClick 
}: { 
  opportunity: Opportunity; 
  onClick: () => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <OpportunityCard
        opportunity={opportunity}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}

export function KanbanColumn({ id, title, color, opportunities }: KanbanColumnProps) {
  const navigate = useNavigate();
  
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

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
      <CardContent className={`p-2 bg-muted/30 h-[723px] overflow-y-auto mt-2 ${isOver ? 'bg-blue-50' : ''}`}>
        <div
          ref={setNodeRef}
          className="space-y-2"
        >
          <SortableContext items={opportunities.map(opp => opp.id)} strategy={verticalListSortingStrategy}>
            {opportunities.map((opportunity) => (
              <SortableOpportunityItem
                key={opportunity.id}
                opportunity={opportunity}
                onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
              />
            ))}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
}
