import { CustomField } from "../types";

export const defaultFields: Partial<CustomField>[] = [
  {
    id: "title",
    name: "Título",
    field_type: "short_text",
    description: "Título da oportunidade",
    is_required: true,
    order_index: 0,
    options: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "value",
    name: "Valor",
    field_type: "currency",
    description: "Valor da oportunidade",
    is_required: false,
    order_index: 1,
    options: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
