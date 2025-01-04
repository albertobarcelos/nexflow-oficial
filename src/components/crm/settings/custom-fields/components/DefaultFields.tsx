import { CustomField } from "../types";

export const defaultFields: CustomField[] = [
  {
    id: "title",
    client_id: "", // Será preenchido dinamicamente
    pipeline_id: "", // Será preenchido dinamicamente
    stage_id: "", // Será preenchido dinamicamente
    name: "Título",
    field_type: "short_text",
    description: "Título da oportunidade",
    is_required: true,
    order_index: 0,
    options: [],
    history: [{
      timestamp: new Date().toISOString(),
      action: "created",
      user_id: "system",
    }]
  },
  {
    id: "value",
    client_id: "", // Será preenchido dinamicamente
    pipeline_id: "", // Será preenchido dinamicamente
    stage_id: "", // Será preenchido dinamicamente
    name: "Valor",
    field_type: "currency",
    description: "Valor da oportunidade",
    is_required: false,
    order_index: 1,
    options: [],
    history: [{
      timestamp: new Date().toISOString(),
      action: "created",
      user_id: "system",
    }]
  }
];