import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { FieldCard } from "./FieldCard";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface CustomFieldDropZoneProps {
  stageId: string;
  fields: CustomField[];
  onEditField: (field: CustomField) => void;
}

export function CustomFieldDropZone({ stageId, fields, onEditField }: CustomFieldDropZoneProps) {
  console.log(`🎯 CustomFieldDropZone render for ${stageId}:`, {
    fields,
    fieldsLength: fields.length,
    firstField: fields[0]
  });
  
  return (
    <Card className="flex flex-col h-[calc(100vh-400px)]">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Estrutura da Entidade</h3>
        <p className="text-sm text-muted-foreground">
          Arraste os campos para organizar a estrutura do formulário
        </p>
      </div>

      <Droppable droppableId={stageId} type="FIELD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-4 overflow-y-auto",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  onEdit={() => onEditField(field)}
                />
              ))}
              {fields.length === 0 && !snapshot.isDraggingOver && (
                <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Arraste os tipos de campo acima para começar a montar a estrutura
                  </p>
                </div>
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </Card>
  );
}