// import { Draggable } from "@hello-pangea/dnd";
import { CustomField, EntityField } from "../types";
import { Button } from "@/components/ui/button";
import { Edit2, GripVertical, LayoutGrid, Trash2, MoreVertical, Pencil, Trash } from "lucide-react";
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
  field: EntityField | CustomField;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onLayoutChange?: (layout: { width: 'full' | 'half' | 'third' }) => void;
}

export function FieldCard({ field, index, onEdit, onDelete, onLayoutChange }: FieldCardProps) {
  const layoutConfig = field.layout_config || {
    width: 'full'
  };

  const handleLayoutChange = (width: 'full' | 'half' | 'third') => {
    if (onLayoutChange) {
      const newConfig = {
        width
      };
      onLayoutChange(newConfig);
      
      const widthLabels = {
        full: 'Largura Total',
        half: 'Metade da Largura',
        third: 'Um Terço'
      };
      
      toast.success(`Layout atualizado: ${widthLabels[width]}`);
    }
  };

  return (
    <Draggable draggableId={field.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "rounded-lg border bg-card p-3 h-full",
            "hover:border-primary/20 hover:shadow-sm",
            "transition-all duration-200",
            snapshot.isDragging && "border-primary/30 shadow-md"
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
                  onClick={() => handleLayoutChange('full')}
                  className={cn(layoutConfig.width === 'full' && "bg-muted")}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Largura Total
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange('half')}
                  className={cn(layoutConfig.width === 'half' && "bg-muted")}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Metade da Largura
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange('third')}
                  className={cn(layoutConfig.width === 'third' && "bg-muted")}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Um Terço
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(field)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(field.id)}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </Draggable>
  );
}
