import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EntityBasicInfo } from "../form/EntityBasicInfo";
import { EntityVisualConfig } from "../form/EntityVisualConfig";
import { EntityFormFields } from "../form/EntityFormFields";
import { Entity, EntityField } from "../../types";

interface EntityFormContentProps {
  singularName: string;
  pluralName: string;
  description: string;
  selectedIcon: string;
  selectedColor: string;
  fields: EntityField[];
  entities: Entity[];
  entityToEdit: Entity | null;
  onSingularNameChange: (value: string) => void;
  onPluralNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
  setFields: (fields: EntityField[]) => void;
}

export function EntityFormContent({
  singularName,
  pluralName,
  description,
  selectedIcon,
  selectedColor,
  fields,
  entities,
  entityToEdit,
  onSingularNameChange,
  onPluralNameChange,
  onDescriptionChange,
  onIconChange,
  onColorChange,
  setFields,
}: EntityFormContentProps) {
  return (
    <ScrollArea className="flex-1 px-6 overflow-y-auto">
      <div className="pr-4">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <EntityBasicInfo
            singularName={singularName}
            pluralName={pluralName}
            description={description}
            onSingularNameChange={onSingularNameChange}
            onPluralNameChange={onPluralNameChange}
            onDescriptionChange={onDescriptionChange}
          />

          <EntityVisualConfig
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onIconChange={onIconChange}
            onColorChange={onColorChange}
          />

          <EntityFormFields
            fields={fields}
            setFields={setFields}
            currentEntityId={entityToEdit?.id || singularName}
            entities={entities}
          />
        </form>
      </div>
    </ScrollArea>
  );
}