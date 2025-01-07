import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { FieldTypeCard } from "./FieldTypeCard";
import { fieldTypes } from "../data/fieldTypes";

export function FieldTypesHeader() {
  // Filtrar apenas os tipos essenciais para o MVP
  const essentialFieldTypes = fieldTypes.filter(type => 
    ["short_text", "long_text", "numeric", "date", "checkbox", "single_select", "entity"].includes(type.id)
  );

  return (
    <Card className="p-4 border-primary/10">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-primary/90">Tipos de Campo Disponíveis</h2>
          <p className="text-sm text-muted-foreground">
            Arraste os tipos de campo abaixo para adicionar à estrutura da entidade
          </p>
        </div>

        <Droppable droppableId="field-types" type="FIELD" direction="horizontal">
          {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex flex-wrap gap-4"
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