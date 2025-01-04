import { Json } from "@/types/database/json";

export type FieldCategory = "basic" | "contact" | "financial" | "document" | "date" | "other";

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

export interface FieldTypeInfo {
  id: FieldType;
  name: string;
  description: string;
  category: FieldCategory;
  icon: React.ReactNode;
  validation?: (value: any) => boolean | string;
}

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
  history?: FieldHistory[];
}

export interface FieldHistory {
  timestamp: string;
  action: "created" | "updated" | "deleted";
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  user_id: string;
}

export interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Partial<CustomField>[];
}

export interface FieldTypesSidebarProps {
  onFieldAdd?: (fieldType: FieldType) => void;
  searchTerm?: string;
  selectedCategory?: FieldCategory;
}

export interface PipelineFieldsEditorProps {
  stagedFields: Record<string, CustomField[]>;
  onChange: () => void;
  onEditField: (field: CustomField) => void;
  onDuplicate: (field: CustomField) => void;
  onReorder: (stageId: string, fields: CustomField[]) => void;
}