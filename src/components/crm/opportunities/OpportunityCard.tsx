import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type OpportunityCardProps = {
  opportunity: {
    id: string;
    title: string;
    value: number | null;
    expected_close_date: string | null;
    category?: {
      name: string;
      color: string;
    } | null;
  };
  provided: any;
  onClick: () => void;
};

export function OpportunityCard({ opportunity, provided, onClick }: OpportunityCardProps) {
  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="bg-white border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        {opportunity.category && (
          <Badge 
            className={`bg-${opportunity.category.color}-100 text-${opportunity.category.color}-800 hover:bg-${opportunity.category.color}-200`}
          >
            {opportunity.category.name}
          </Badge>
        )}
        <h4 className="font-medium text-sm">{opportunity.title}</h4>
        {opportunity.value && (
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(opportunity.value)}
          </p>
        )}
        {opportunity.expected_close_date && (
          <p className="text-xs text-muted-foreground">
            Previsão: {new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}