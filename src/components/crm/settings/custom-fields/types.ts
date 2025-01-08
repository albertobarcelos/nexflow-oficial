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
  | "user"
  | "entity";

export type FieldCategory = "basic" | "contact" | "financial" | "document" | "date" | "relationship" | "other";

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

export interface LayoutConfig {
  width: 'full' | 'half' | 'third';
}

interface BaseField {
  id: string;
  client_id: string;
  name: string;
  field_type: FieldType;
  description?: string;
  is_required?: boolean;
  order_index: number;
  options?: Json[];
  created_at: string;
  updated_at: string;
  layout_config?: LayoutConfig;
}

export interface EntityField extends BaseField {
  entity_id: string;
  validation_rules?: Json;
  related_entity_id?: string;
  relationship_type?: string;
  is_staged?: boolean;
  staging_batch?: string;
}

export interface CustomField extends BaseField {
  pipeline_id: string;
  stage_id: string;
}

export interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Partial<EntityField>[];
}