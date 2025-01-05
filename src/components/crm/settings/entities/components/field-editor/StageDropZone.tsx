import { Droppable } from "@hello-pangea/dnd";
import { EntityField } from "../../types";
import { FieldCard } from "./FieldCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StageDropZoneProps {
  stageId: string;
  fields: EntityField[];
  onEditField: (field: EntityField) => void;
}

export function StageDropZone({ stageId, fields, onEditField }: StageDropZoneProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Estrutura da Entidade</h3>
        <p className="text-sm text-muted-foreground">
          Arraste os campos para organizar a estrutura da entidade
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-20rem)]">
        <Droppable droppableId={stageId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-4 space-y-2 min-h-[200px] transition-colors duration-200 ${
                snapshot.isDraggingOver 
                  ? "bg-primary/5 border-2 border-dashed border-primary" 
                  : ""
              }`}
            >
              {fields.map((field, index) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  onEdit={() => onEditField(field)}
                />
              ))}
              {fields.length === 0 && !snapshot.isDraggingOver && (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Arraste e solte os campos aqui para configurar a estrutura
                  </p>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </ScrollArea>
    </div>
  );
}