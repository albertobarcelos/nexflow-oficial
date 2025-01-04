import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityField, EntityFieldEditorProps } from "../types";
import { EntityFieldRow } from "./EntityFieldRow";

export function EntityFieldEditor({ fields, onChange, currentEntityId, entities }: EntityFieldEditorProps) {
  const addField = () => {
    const newField: EntityField = {
      id: `field-${Date.now()}`,
      name: "",
      field_type: "text",
      is_required: false,
      order_index: fields.length,
      client_id: "", // Será preenchido no backend
      entity_id: "", // Será preenchido no backend
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