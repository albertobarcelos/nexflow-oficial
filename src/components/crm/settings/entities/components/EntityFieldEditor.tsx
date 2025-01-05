import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityField, Entity } from "../types";
import { EntityFieldRow } from "./field-editor/EntityFieldRow";

export function EntityFieldEditor({ fields, onChange, currentEntityId, entities }: {
  fields: EntityField[];
  onChange: (fields: EntityField[]) => void;
  currentEntityId: string;
  entities: Entity[];
}) {
  const addField = () => {
    const newField: EntityField = {
      id: crypto.randomUUID(), // Usando UUID válido em vez de string temporária
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {fields.map((field, index) => (
          <EntityFieldRow
            key={field.id}
            field={field}
            entities={entities}
            currentEntityId={currentEntityId}
            onChange={(field) => updateField(index, field)}
            onRemove={() => removeField(index)}
          />
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addField}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Campo
      </Button>
    </div>
  );
}