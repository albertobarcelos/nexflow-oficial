import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { FieldCard } from "./FieldCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomFieldDropZoneProps {
  stageId: string;
  fields: CustomField[];
  onEditField: (field: CustomField) => void;
}

export function CustomFieldDropZone({ stageId, fields, onEditField }: CustomFieldDropZoneProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Campos Personalizados</h3>
        <p className="text-sm text-muted-foreground">
          Arraste os campos para organizar a estrutura
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-20rem)]">
        <Droppable droppableId={stageId}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="p-4 space-y-2 min-h-[200px]"
            >
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
      </ScrollArea>
    </div>
  );
}