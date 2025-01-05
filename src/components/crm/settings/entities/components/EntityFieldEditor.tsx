import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityField, Entity } from "../types";
import { EntityFieldRow } from "./field-editor/EntityFieldRow";

interface EntityFieldEditorProps {
  fields: EntityField[];
  entities: Entity[];
  currentEntityId: string;
  onChange: (fields: EntityField[]) => void;
}

export function EntityFieldEditor({
  fields,
  entities,
  currentEntityId,
  onChange
}: EntityFieldEditorProps) {
  const addField = () => {
    const newField: EntityField = {
      id: crypto.randomUUID(),
      name: "",
      field_type: "text",
      is_required: false,
      order_index: fields.length,
      client_id: "", // Será preenchido no backend
      entity_id: currentEntityId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      validation_rules: {}
    };
    
    onChange([...fields, newField]);
  };

  const updateField = (index: number, field: EntityField) => {
    const newFields = [...fields];
    newFields[index] = field;
    onChange(newFields);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const duplicateField = (index: number) => {
    const fieldToDuplicate = fields[index];
    const duplicatedField: EntityField = {
      ...fieldToDuplicate,
      id: crypto.randomUUID(),
      name: `${fieldToDuplicate.name} (cópia)`,
      order_index: fields.length,
    };
    
    const newFields = [...fields];
    newFields.splice(index + 1, 0, duplicatedField);
    onChange(newFields);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all fields
    const updatedFields = items.map((field, index) => ({
      ...field,
      order_index: index
    }));

    onChange(updatedFields);
  };

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields">
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
                  onChange={(field) => updateField(index, field)}
                  onRemove={() => removeField(index)}
                  onDuplicate={() => duplicateField(index)}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button type="button" variant="outline" onClick={addField}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Campo
      </Button>
    </div>
  );
}