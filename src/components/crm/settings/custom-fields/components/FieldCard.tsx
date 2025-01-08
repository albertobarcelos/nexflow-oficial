import { Draggable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { Button } from "@/components/ui/button";
import { Edit2, GripVertical, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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
      const newConfig = {
        ...layoutConfig,
        ...changes
      };
      onLayoutChange(newConfig);
      
      // Feedback visual para o usuário
      const widthLabels = {
        full: 'Largura Total',
        half: 'Metade da Largura',
        third: 'Um Terço',
        quarter: 'Um Quarto'
      };
      
      toast.success(`Layout atualizado: ${widthLabels[changes.width as keyof typeof widthLabels] || 'Configuração alterada'}`);
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
            layoutConfig.width === 'quarter' && "w-1/4",
            layoutConfig.forceNewLine && "clear-both",
            layoutConfig.groupWithNext && "float-left"
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
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Layout do Campo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange({ width: 'full' })}
                  className={cn(layoutConfig.width === 'full' && "bg-muted")}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Largura Total
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange({ width: 'half' })}
                  className={cn(layoutConfig.width === 'half' && "bg-muted")}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Metade da Largura
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange({ width: 'third' })}
                  className={cn(layoutConfig.width === 'third' && "bg-muted")}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Um Terço
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange({ forceNewLine: !layoutConfig.forceNewLine })}
                  className={cn(layoutConfig.forceNewLine && "bg-muted")}
                >
                  Forçar Nova Linha {layoutConfig.forceNewLine && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange({ groupWithNext: !layoutConfig.groupWithNext })}
                  className={cn(layoutConfig.groupWithNext && "bg-muted")}
                >
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