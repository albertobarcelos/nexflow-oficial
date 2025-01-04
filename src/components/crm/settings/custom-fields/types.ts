export interface CustomField {
  id: string;
  client_id: string;
  field_type: FieldType;
  name: string;
  order_index: number;
  stage_id: string;
  pipeline_id: string;
  options: string[];
  history: {
    timestamp: string;
    action: string;
    user_id: string;
  }[];
}

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

export interface PipelineFieldsEditorProps {
  stagedFields: Record<string, CustomField[]>;
  onChange: () => void;
  onEditField: (field: CustomField) => void;
  onDuplicate: (field: CustomField) => void;
  onReorder: (stageId: string, reorderedFields: CustomField[]) => void;
}
