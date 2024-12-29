import { Json } from "@/types/database/json";

export type FieldType =
  | "short_text"
  | "long_text"
  | "dynamic_content"
  | "attachment"
  | "checkbox"
  | "responsible"
  | "date"
  | "datetime"
  | "due_date"
  | "tags"
  | "email"
  | "phone"
  | "list"
  | "single_select"
  | "time"
  | "numeric"
  | "currency"
  | "documents"
  | "id";

export interface CustomField {
  id: string;
  client_id: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  field_type: FieldType;
  description?: string | null;
  is_required?: boolean;
  order_index: number;
  options: any[];
  created_at?: string;
  updated_at?: string;
}

export interface FieldTypesSidebarProps {
  onFieldAdd?: (fieldType: FieldType) => void;
}

export interface PipelineFieldsEditorProps {
  stagedFields: Record<string, CustomField[]>;
  onChange: () => void;
  onEditField?: (field: CustomField) => void;
}