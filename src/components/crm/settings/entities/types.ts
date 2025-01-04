export type EntityFieldType = 
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "email"
  | "phone"
  | "address";

export interface EntityField {
  id: string;
  name: string;
  type: EntityFieldType;
  required: boolean;
  options?: string[];
  description?: string;
  order_index: number;
  field_type: string;
  client_id: string;
  entity_id: string;
  is_required: boolean;
  validation_rules?: Json;
  created_at: string;
  updated_at: string;
}

export interface Entity {
  id: string;
  name: string;
  description?: string;
  fields: EntityField[];
  created_at: string;
  updated_at: string;
  client_id: string;
  is_default?: boolean;
  template_name?: string;
}
