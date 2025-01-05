import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { EntityField } from "../../entities/types";
import { FieldCard } from "./FieldCard";
import { cn } from "@/lib/utils";

interface StageDropZoneProps {
  stageId: string;
  fields: (CustomField | EntityField)[];
  onEditField: (field: CustomField | EntityField) => void;
}

export function StageDropZone({ stageId, fields, onEditField }: StageDropZoneProps) {
  return (
    <Droppable droppableId={`stage-${stageId}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "min-h-[200px] rounded-lg p-4 transition-all duration-200",
            "border-2 border-dashed border-primary/20",
            "hover:border-primary/40",
            snapshot.isDraggingOver && "border-primary/60 bg-primary/5"
          )}
        >
          {fields.length === 0 && !snapshot.isDraggingOver && (
            <div className="flex h-full items-center justify-center">
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
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}