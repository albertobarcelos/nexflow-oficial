import { EntityField } from "../../types";

export const defaultEntityFields: EntityField[] = [
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