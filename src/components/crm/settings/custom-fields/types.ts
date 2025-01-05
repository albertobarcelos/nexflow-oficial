import { Json } from "@/types/database/json";

export type FieldType = 
  | "short_text"
  | "long_text"
  | "email"
  | "celular"
  | "currency"
  | "numeric"
  | "documents"
  | "attachment"
  | "date"
  | "datetime"
  | "checkbox"
  | "list"
  | "single_select"
  | "cpf"
  | "cnpj"
  | "time"
  | "user";

export type FieldCategory = "basic" | "contact" | "financial" | "document" | "date" | "other";

export interface FieldTypeInfo {
  id: FieldType;
  name: string;
  description: string;
  icon: JSX.Element;
  category: FieldCategory;
  validation?: (value: any) => boolean;
  mask?: string;
}

export interface FieldHistory {
  timestamp: string;
  action: string;
  user_id: string;
  details?: {
    field: string;
    oldValue?: any;
    newValue: any;
  }[];
}

export interface CustomField {
  id: string;
  client_id: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  field_type: FieldType;
  description?: string;
  is_required?: boolean;
  order_index: number;
  options?: Json[];
  history?: FieldHistory[];
  created_at: string;
  updated_at: string;
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
  options?: Json[];
  validation_rules?: Json;
  created_at: string;
  updated_at: string;
}

export interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Partial<CustomField>[];
}