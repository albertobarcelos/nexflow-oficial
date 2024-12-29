import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

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
    assigned_to?: {
      name: string;
      avatar_url?: string;
    } | null;
  };
  provided: any;
  onClick: () => void;
};

export function OpportunityCard({ opportunity, provided, onClick }: OpportunityCardProps) {
  const [visibleFields, setVisibleFields] = useState({
    value: true,
    date: true,
    category: true,
  });

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="w-[256px] bg-white border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mx-auto"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm flex-1">{opportunity.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Campos Visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleFields.value}
                onCheckedChange={(checked) =>
                  setVisibleFields((prev) => ({ ...prev, value: checked }))
                }
              >
                Valor
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleFields.date}
                onCheckedChange={(checked) =>
                  setVisibleFields((prev) => ({ ...prev, date: checked }))
                }
              >
                Data Prevista
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleFields.category}
                onCheckedChange={(checked) =>
                  setVisibleFields((prev) => ({ ...prev, category: checked }))
                }
              >
                Categoria
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {opportunity.category && visibleFields.category && (
          <Badge 
            className={`bg-${opportunity.category.color}-100 text-${opportunity.category.color}-800 hover:bg-${opportunity.category.color}-200`}
          >
            {opportunity.category.name}
          </Badge>
        )}
        
        {opportunity.value && visibleFields.value && (
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(opportunity.value)}
          </p>
        )}
        
        {opportunity.expected_close_date && visibleFields.date && (
          <p className="text-xs text-muted-foreground">
            Previsão: {new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')}
          </p>
        )}

        <div className="pt-2 flex items-center justify-between">
          {opportunity.assigned_to && (
            <Avatar className="h-[22px] w-[22px]">
              <AvatarImage src={opportunity.assigned_to.avatar_url} />
              <AvatarFallback>
                {opportunity.assigned_to.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}