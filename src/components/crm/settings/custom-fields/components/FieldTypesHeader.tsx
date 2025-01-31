import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { FieldTypeCard } from "./FieldTypeCard";
import { fieldTypes } from "../data/fieldTypes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateEntityDialog } from "../../entities/components/CreateEntityDialog";

export function FieldTypesHeader() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filtrar apenas os tipos essenciais para o MVP
  const essentialFieldTypes = fieldTypes.filter(type => 
    ["short_text", "long_text", "numeric", "date", "checkbox", "single_select", "entity"].includes(type.id)
  );

  return (
    <Card className="p-3 border-primary/10">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-medium text-primary/90">Tipos de Campo Disponíveis</h2>
            <p className="text-xs text-muted-foreground">
              Arraste os tipos de campo abaixo para adicionar à estrutura da entidade
            </p>
          </div>
          <CreateEntityDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          >
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Nova Entidade
            </Button>
          </CreateEntityDialog>
        </div>

        <Droppable droppableId="field-types" type="FIELD" direction="horizontal">
          {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex flex-wrap gap-1.5"
            >
              {essentialFieldTypes.map((fieldType, index) => (
                <Draggable 
                  key={fieldType.id} 
                  draggableId={fieldType.id} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <FieldTypeCard
                        fieldType={fieldType}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </Card>
  );
}
