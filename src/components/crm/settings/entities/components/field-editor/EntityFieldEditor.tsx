import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { EntityField, Entity } from "../../types";
import { EntityFieldRow } from "./EntityFieldRow";

interface EntityFieldEditorProps {
  fields: EntityField[];
  entities: Entity[];
  currentEntityId: string;
  onChange: (fields: EntityField[]) => void;
}

export function EntityFieldEditor({ fields, entities, currentEntityId, onChange }: EntityFieldEditorProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Se o drag veio da lista de tipos de campo (field-types)
    if (result.source.droppableId === 'field-types') {
      // Criar novo campo baseado no tipo arrastado
      const newField: EntityField = {
        id: crypto.randomUUID(),
        name: "",
        field_type: result.draggableId,
        is_required: false,
        order_index: fields.length,
        client_id: "", // Será preenchido no backend
        entity_id: currentEntityId,
        options: [],
        validation_rules: {}
      };
      
      onChange([...fields, newField]);
      return;
    }

    // Reordenação normal dos campos existentes
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedFields = items.map((field, index) => ({
      ...field,
      order_index: index
    }));

    onChange(updatedFields);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="entity-fields">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {fields.map((field, index) => (
              <EntityFieldRow
                key={field.id}
                field={field}
                index={index}
                entities={entities}
                currentEntityId={currentEntityId}
                onChange={(updatedField) => {
                  const newFields = [...fields];
                  newFields[index] = updatedField;
                  onChange(newFields);
                }}
                onRemove={() => {
                  onChange(fields.filter((_, i) => i !== index));
                }}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}