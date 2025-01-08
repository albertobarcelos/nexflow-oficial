import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { FieldCard } from "./FieldCard";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomFieldDropZoneProps {
  stageId: string;
  fields: CustomField[];
  onEditField: (field: CustomField) => void;
  onSave?: () => void;
  hasChanges?: boolean;
}

export function CustomFieldDropZone({ 
  stageId, 
  fields, 
  onEditField,
  onSave,
  hasChanges 
}: CustomFieldDropZoneProps) {
  console.log(`🎯 CustomFieldDropZone render for ${stageId}:`, {
    fields,
    fieldsLength: fields.length,
    firstField: fields[0]
  });
  
  return (
    <Card className="flex flex-col h-full">
      <div className="py-2.5 px-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium leading-none mb-1">Estrutura da Entidade</h3>
          <p className="text-xs text-muted-foreground">
            Arraste os campos para organizar a estrutura do formulário
          </p>
        </div>
        {hasChanges && onSave && (
          <Button 
            onClick={onSave}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <Droppable droppableId={stageId} type="FIELD">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "p-4 min-h-[200px] max-h-[calc(100vh-14rem)]",
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
      </ScrollArea>
    </Card>
  );
}