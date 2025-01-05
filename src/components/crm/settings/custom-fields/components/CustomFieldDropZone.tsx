import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { FieldCard } from "./FieldCard";

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
    <div className="flex flex-col h-full rounded-lg border bg-card">
      <div className="p-4 border-b flex-shrink-0">
        <h3 className="text-lg font-medium">Campos Personalizados</h3>
        <p className="text-sm text-muted-foreground">
          Arraste os campos para organizar a estrutura
        </p>
      </div>

      <Droppable droppableId={stageId}>
        {(provided, snapshot) => {
          console.log('🎨 Droppable state:', { 
            isDraggingOver: snapshot.isDraggingOver,
            droppableId: stageId,
            fieldsCount: fields.length
          });
          
          return (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 p-4 overflow-y-auto min-h-[200px]"
            >
              <div className="space-y-2">
                {fields.map((field, index) => {
                  console.log(`🎴 Rendering FieldCard ${index}:`, field);
                  return (
                    <FieldCard
                      key={field.id}
                      field={field}
                      index={index}
                      onEdit={() => onEditField(field)}
                    />
                  );
                })}
                {fields.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      Arraste os campos para organizar a estrutura
                    </p>
                  </div>
                )}
                {provided.placeholder}
              </div>
            </div>
          );
        }}
      </Droppable>
    </div>
  );
}