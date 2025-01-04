import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash } from "lucide-react";
import { EntityField, EntityFieldType } from "../types";

interface EntityFieldRowProps {
  field: EntityField;
  onChange: (field: EntityField) => void;
  onRemove: () => void;
}

const FIELD_TYPES: { value: EntityFieldType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Lista Suspensa" },
  { value: "checkbox", label: "Checkbox" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "address", label: "Endereço" },
];

export function EntityFieldRow({ field, onChange, onRemove }: EntityFieldRowProps) {
  return (
    <div className="flex items-center space-x-2">
      <Input
        value={field.name}
        onChange={(e) => onChange({ ...field, name: e.target.value })}
        placeholder="Nome do Campo"
        className="flex-1"
      />

      <Select
        value={field.field_type}
        onValueChange={(value) => onChange({ ...field, field_type: value as EntityFieldType })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELD_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        <Switch
          checked={field.is_required}
          onCheckedChange={(checked) => onChange({ ...field, is_required: checked })}
        />
        <span className="text-sm">Obrigatório</span>
      </div>

      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}