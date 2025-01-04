import { useState } from "react";
import type { Entity, EntityField } from "../../types";

const defaultFields: EntityField[] = [
  {
    id: crypto.randomUUID(),
    name: "CNPJ",
    field_type: "text",
    is_required: true,
    order_index: 0,
    client_id: "",
    entity_id: "",
    validation_rules: {
      pattern: "\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}",
      mask: "99.999.999/9999-99"
    }
  },
  {
    id: crypto.randomUUID(),
    name: "CPF",
    field_type: "text",
    is_required: true,
    order_index: 1,
    client_id: "",
    entity_id: "",
    validation_rules: {
      pattern: "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}",
      mask: "999.999.999-99"
    }
  },
  {
    id: crypto.randomUUID(),
    name: "Celular",
    field_type: "text",
    is_required: true,
    order_index: 2,
    client_id: "",
    entity_id: "",
    validation_rules: {
      pattern: "\\(\\d{2}\\) \\d{5}-\\d{4}",
      mask: "(99) 99999-9999"
    }
  }
];

export function useEntityFields(entityToEdit: Entity | null | undefined) {
  const [singularName, setSingularName] = useState("");
  const [pluralName, setPluralName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<EntityField[]>(defaultFields);
  const [selectedIcon, setSelectedIcon] = useState("database");
  const [selectedColor, setSelectedColor] = useState("#4A90E2");

  const resetForm = () => {
    setSingularName("");
    setPluralName("");
    setDescription("");
    setSelectedIcon("database");
    setSelectedColor("#4A90E2");
    setFields(defaultFields);
  };

  const initializeForm = (entity: Entity) => {
    setSingularName(entity.name);
    setPluralName(entity.name + 's');
    setDescription(entity.description || "");
    setSelectedIcon(entity.icon_name || "database");
    setSelectedColor(entity.color || "#4A90E2");
    setFields(entity.fields || defaultFields);
  };

  return {
    singularName,
    pluralName,
    description,
    fields,
    selectedIcon,
    selectedColor,
    setSingularName,
    setPluralName,
    setDescription,
    setFields,
    setSelectedIcon,
    setSelectedColor,
    resetForm,
    initializeForm
  };
}