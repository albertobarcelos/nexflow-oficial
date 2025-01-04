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
}

export interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}