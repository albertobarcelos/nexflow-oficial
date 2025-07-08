// import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { FieldCard } from "./FieldCard";
import { cn } from "@/lib/utils";

interface StageDropZoneProps {
  stageId: string;
  fields: CustomField[];
  onEditField: (field: CustomField) => void;
  onDeleteField?: (fieldId: string) => void;
}

export function StageDropZone({ stageId, fields, onEditField, onDeleteField }: StageDropZoneProps) {
  return (
    <Droppable droppableId={stageId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "min-h-[200px] rounded-lg p-4 transition-all duration-200",
            "border-2 border-dashed",
            snapshot.isDraggingOver
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-primary/20 hover:border-primary/40",
          )}
        >
          {fields.length === 0 && !snapshot.isDraggingOver && (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Arraste e solte os campos aqui para configurar a estrutura
              </p>
            </div>
          )}
          
          {fields.map((field, index) => (
            <FieldCard
              key={field.id}
              field={field}
              index={index}
              onEdit={() => onEditField(field)}
              onDelete={() => onDeleteField?.(field.id)}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
