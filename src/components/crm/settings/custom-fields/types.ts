export type FieldType = 
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "currency"
  | "numeric"
  | "documents"
  | "attachment"
  | "date"
  | "datetime"
  | "checkbox"
  | "list";

export interface FieldTypeInfo {
  id: FieldType;
  name: string;
  description: string;
  icon: JSX.Element;
  category: FieldCategory;
  validation?: (value: any) => boolean;
}

export type FieldCategory = "basic" | "contact" | "financial" | "document" | "date" | "other";

export interface CustomField {
  id: string;
  client_id: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  field_type: string;
  description?: string;
  is_required?: boolean;
  order_index: number;
  options?: any[];
  history: FieldHistory[];
}

export interface FieldHistory {
  timestamp: string;
  action: string;
  user_id: string;
}

export interface EntityField {
  id: string;
  entity_id: string;
  client_id: string;
  name: string;
  field_type: string;
  description?: string;
  is_required?: boolean;
  order_index: number;
  options?: any[];
  validation_rules?: Record<string, any>;
}

export interface EntityFieldValue {
  id: string;
  entity_id: string;
  field_id: string;
  record_id: string;
  value: any;
}