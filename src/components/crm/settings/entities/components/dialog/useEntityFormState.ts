import { useState, useEffect } from "react";
import { EntityFormState } from "./types";
import { Entity } from "../../types";

const defaultFields = [
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

export function useEntityFormState(entityToEdit: Entity | null) {
  const [formState, setFormState] = useState<EntityFormState>({
    singularName: "",
    pluralName: "",
    description: "",
    fields: [],
    selectedIcon: "database",
    selectedColor: "#4A90E2"
  });

  useEffect(() => {
    if (entityToEdit) {
      setFormState({
        singularName: entityToEdit.name,
        pluralName: entityToEdit.name + 's',
        description: entityToEdit.description || "",
        selectedIcon: entityToEdit.icon_name || "database",
        selectedColor: entityToEdit.color || "#4A90E2",
        fields: entityToEdit.fields || []
      });
    } else {
      setFormState({
        singularName: "",
        pluralName: "",
        description: "",
        fields: defaultFields,
        selectedIcon: "database",
        selectedColor: "#4A90E2"
      });
    }
  }, [entityToEdit]);

  return {
    formState,
    setFormState
  };
}