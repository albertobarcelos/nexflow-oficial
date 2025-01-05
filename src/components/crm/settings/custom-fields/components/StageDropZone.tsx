import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StageDropZoneProps {
  stageId: string;
  fields: CustomField[];
  onEditField?: (field: CustomField) => void;
}

export function StageDropZone({ stageId, fields, onEditField }: StageDropZoneProps) {
  return (
    <Droppable droppableId={stageId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[400px] p-4 rounded-lg transition-all duration-200 ${
            snapshot.isDraggingOver 
              ? "bg-primary/10 border-2 border-dashed border-primary shadow-lg" 
              : "bg-muted/5 border-2 border-dashed border-muted hover:border-primary/50"
          }`}
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {fields?.map((field, index) => (
            <div 
              key={field.id} 
              className={`p-3 mb-2 rounded border transition-colors ${
                snapshot.isDraggingOver ? "border-primary" : "border-border"
              } bg-background flex justify-between items-center`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.name}</span>
                  {field.is_required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                {field.description && (
                  <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditField?.(field)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {fields?.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-center">
                Arraste campos aqui para adicionar à estrutura
                <br />
                <span className="text-sm opacity-70">
                  Os campos serão organizados na ordem em que forem adicionados
                </span>
              </p>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}