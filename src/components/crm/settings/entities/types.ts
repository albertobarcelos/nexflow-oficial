export interface EntityField {
  id: string;
  entity_id: string;
  client_id: string;
  name: string;
  field_type: string;
  description?: string;
  is_required?: boolean;
  order_index: number;
  options?: any[];
  validation_rules?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  related_entity_id?: string;
  relationship_type?: 'one_to_many' | 'many_to_many';
}

export interface Entity {
  id: string;
  name: string;
  template_name: string | null;
  client_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
  icon_name?: string;
  color?: string;
  fields?: EntityField[];
  entity_fields?: EntityField[]; // Add this to support both naming conventions
}

export interface EntityDiagramProps {
  entities: Entity[];
  relationships: EntityRelationship[];
  onSave?: (relationships: EntityRelationship[]) => void;
  readOnly?: boolean;
}

export interface EntityRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: 'one_to_many' | 'many_to_many';
  name: string;
  client_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface EntityNodeData {
  entity: Entity;
  [key: string]: unknown;
}

export interface CustomNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: EntityNodeData;
  draggable: boolean;
}

export interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  entityToEdit?: Entity | null;
}

export interface EntityListProps {
  entities: Entity[];
  onEdit?: (entity: Entity) => void;
  onDelete?: (entity: Entity) => void;
}

export interface EntityFieldEditorProps {
  fields: EntityField[];
  onChange: (fields: EntityField[]) => void;
  currentEntityId: string;
  entities: Entity[];
}

export type FieldType = 
  | "text" 
  | "number" 
  | "date" 
  | "select" 
  | "checkbox" 
  | "email" 
  | "cnpj" 
  | "cpf" 
  | "celular" 
  | "entity";
