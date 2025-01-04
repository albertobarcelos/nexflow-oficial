import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash } from "lucide-react";
import { EntityField, Entity } from "../types";

interface EntityFieldRowProps {
  field: EntityField;
  entities: Entity[];
  currentEntityId: string;
  onChange: (field: EntityField) => void;
  onRemove: () => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Lista Suspensa" },
  { value: "checkbox", label: "Checkbox" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "address", label: "Endereço" },
  { value: "entity", label: "Entidade" },
];

const RELATIONSHIP_TYPES = [
  { value: "one_to_many", label: "Um para Muitos" },
  { value: "many_to_many", label: "Muitos para Muitos" },
] as const;

export function EntityFieldRow({ field, entities, currentEntityId, onChange, onRemove }: EntityFieldRowProps) {
  const isEntityField = field.field_type === "entity";
  const availableEntities = entities.filter(entity => entity.id !== currentEntityId);

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
        onValueChange={(value) => onChange({ 
          ...field, 
          field_type: value,
          related_entity_id: value === "entity" ? field.related_entity_id : undefined,
          relationship_type: value === "entity" ? field.relationship_type : undefined
        })}
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

      {isEntityField && (
        <>
          <Select
            value={field.related_entity_id}
            onValueChange={(value) => onChange({ ...field, related_entity_id: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a entidade" />
            </SelectTrigger>
            <SelectContent>
              {availableEntities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={field.relationship_type as "one_to_many" | "many_to_many"}
            onValueChange={(value: "one_to_many" | "many_to_many") => onChange({ ...field, relationship_type: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de relacionamento" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

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