import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityField } from "../types";
import { EntityFieldRow } from "./EntityFieldRow";

interface EntityFieldEditorProps {
  fields: EntityField[];
  onChange: (fields: EntityField[]) => void;
}

export function EntityFieldEditor({ fields, onChange }: EntityFieldEditorProps) {
  const addField = () => {
    onChange([
      ...fields,
      {
        id: `field-${Date.now()}`,
        name: "",
        type: "text",
        required: false,
      },
    ]);
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