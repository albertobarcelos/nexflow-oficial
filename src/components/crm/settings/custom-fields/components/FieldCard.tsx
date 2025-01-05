import { Draggable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { EntityField } from "../../entities/types";
import { Button } from "@/components/ui/button";
import { Edit2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldCardProps {
  field: CustomField | EntityField;
  index: number;
  onEdit: () => void;
}

export function FieldCard({ field, index, onEdit }: FieldCardProps) {
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