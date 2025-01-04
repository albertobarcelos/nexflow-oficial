import { Json } from "@/types/database/json";

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

export interface EntityFieldEditorProps {
  fields: EntityField[];
  onChange: (fields: EntityField[]) => void;
}