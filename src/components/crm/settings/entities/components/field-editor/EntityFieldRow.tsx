import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Grip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityField, Entity } from "../../types";

interface EntityFieldRowProps {
  field: EntityField;
  index: number;
  entities: Entity[];
  currentEntityId: string;
  onChange: (field: EntityField) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
}

export function EntityFieldRow({ 
  field, 
  index,
  entities, 
  currentEntityId, 
  onChange, 
  onRemove,
  onDuplicate 
}: EntityFieldRowProps) {
  const isEntityField = field.field_type === "entity";
  const availableEntities = entities.filter(entity => entity.id !== currentEntityId);

  return (
    <Draggable draggableId={field.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex flex-col md:flex-row items-start md:items-center gap-2 p-4 rounded-lg bg-background border group hover:border-primary/50 transition-colors"
        >
          <div
            {...provided.dragHandleProps}
            className="flex items-center cursor-grab active:cursor-grabbing"
          >
            <Grip className="h-5 w-5 text-muted-foreground" />
          </div>

          <Input
            value={field.name}
            onChange={(e) => onChange({ ...field, name: e.target.value })}
            placeholder="Nome do Campo"
            className="flex-1 min-w-[200px]"
          />

          {isEntityField && (
            <>
              <Select
                value={field.related_entity_id}
                onValueChange={(entityId) => {
                  const selectedEntity = entities.find(e => e.id === entityId);
                  if (selectedEntity) {
                    onChange({
                      ...field,
                      related_entity_id: entityId,
                      name: `${selectedEntity.name} Relacionado`,
                    });
                  }
                }}
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
                value={field.relationship_type}
                onValueChange={(value: "one_to_many" | "many_to_many") => onChange({
                  ...field,
                  relationship_type: value
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de relacionamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_to_many">Um para Muitos</SelectItem>
                  <SelectItem value="many_to_many">Muitos para Muitos</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <div className="flex items-center gap-2 min-w-[140px]">
            <Switch
              checked={field.is_required}
              onCheckedChange={(checked) => onChange({ ...field, is_required: checked })}
            />
            <span className="text-sm">Obrigatório</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}