import { Draggable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { Button } from "@/components/ui/button";
import { Edit2, GripVertical, LayoutGrid, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FieldCardProps {
  field: CustomField;
  index: number;
  onEdit: () => void;
  onLayoutChange?: (layout: any) => void;
}

export function FieldCard({ field, index, onEdit, onLayoutChange }: FieldCardProps) {
  const layoutConfig = field.layout_config || {
    width: 'full',
    forceNewLine: false,
    groupWithNext: false,
    responsiveBreakpoints: {
      sm: 'stack',
      md: 'maintain',
      lg: 'maintain'
    }
  };

  const handleLayoutChange = (changes: Partial<typeof layoutConfig>) => {
    if (onLayoutChange) {
      onLayoutChange({
        ...layoutConfig,
        ...changes
      });
    }
  };

  return (
    <Draggable draggableId={field.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "mb-2 rounded-lg border bg-card p-3",
            "hover:border-primary/20 hover:shadow-sm",
            "transition-all duration-200",
            snapshot.isDragging && "border-primary/30 shadow-md",
            layoutConfig.width === 'half' && "w-1/2",
            layoutConfig.width === 'third' && "w-1/3",
            layoutConfig.width === 'quarter' && "w-1/4"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              {...provided.dragHandleProps}
              className="text-muted-foreground hover:text-primary"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium">
                {field.name || "Novo Campo"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {field.field_type}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Layout do Campo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLayoutChange({ width: 'full' })}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Largura Total
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLayoutChange({ width: 'half' })}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Metade da Largura
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLayoutChange({ width: 'third' })}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Um Terço
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLayoutChange({ forceNewLine: !layoutConfig.forceNewLine })}>
                  Forçar Nova Linha {layoutConfig.forceNewLine && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLayoutChange({ groupWithNext: !layoutConfig.groupWithNext })}>
                  Agrupar com Próximo {layoutConfig.groupWithNext && "✓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Draggable>
  );
}