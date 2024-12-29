import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";

interface StageDropZoneProps {
  stageId: string;
  fields: CustomField[];
  isDraggingOver: boolean;
}

export function StageDropZone({ stageId, fields, isDraggingOver }: StageDropZoneProps) {
  return (
    <Droppable droppableId={stageId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[500px] p-4 rounded-lg transition-colors ${
            snapshot.isDraggingOver ? "bg-muted" : ""
          }`}
        >
          {fields?.map((field, index) => (
            <div key={field.id} className="p-2 mb-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{field.name}</span>
                {field.is_required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}
          {fields?.length === 0 && (
            <div className="text-center text-muted-foreground">
              Arraste campos aqui ou clique para adicionar
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}