import { Json } from "@/types/database/json";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

export interface EntityField {
  id: string;
  name: string;
  description?: string;
  field_type: FieldType;
  is_required: boolean;
  options?: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
  layout_config: LayoutConfig;
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