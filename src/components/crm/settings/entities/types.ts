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
}

export interface Entity {
  id: string;
  name: string;
  description?: string;
  fields: EntityField[];
  created_at: string;
  updated_at: string;
  client_id: string;
}

export type RelationType = "one_to_many" | "many_to_many";

export interface EntityRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: RelationType;
  name: string;
  created_at: string;
  updated_at: string;
  client_id: string;
}

export interface EntityDiagramProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}

export interface EntityListProps {
  entities: Entity[];
  onEdit?: (entity: Entity) => void;
  onDelete?: (entity: Entity) => void;
}

export interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface PipelineFieldsEditorProps {
  stagedFields: Record<string, CustomField[]>;
  onChange: () => void;
  onEditField: (field: CustomField) => void;
  onDuplicate: (field: CustomField) => void;
  onReorder: (stageId: string, reorderedFields: CustomField[]) => void;
}

export interface CustomField {
  id: string;
  name: string;
  field_type: string;
  description?: string;
  is_required?: boolean;
  options?: string[];
  stage_id: string;
  pipeline_id: string;
  order_index: number;
  history: FieldHistory[];
}

interface FieldHistory {
  timestamp: string;
  action: string;
  user_id: string;
}