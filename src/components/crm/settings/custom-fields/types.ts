import { Json } from "@/types/database/json";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

export interface LayoutConfig {
  width?: 'full' | 'half' | 'third';
  column?: number;
}

export interface BaseField {
  id: string;
  name: string;
  description?: string;
  field_type: FieldType;
  is_required: boolean;
  options?: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
  layout_config?: LayoutConfig;
}

// AIDEV-NOTE: EntityField removido - sistema simplificado para deals apenas

export interface CustomField extends BaseField {
  pipeline_id: string;
  stage_id: string;
}

export interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  // AIDEV-NOTE: Removido EntityField - sistema simplificado para focar apenas em deals
  fields: Partial<CustomField>[];
}