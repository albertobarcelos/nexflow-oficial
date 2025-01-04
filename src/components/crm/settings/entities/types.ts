import { CustomEntity } from "@/types/database/entity";

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
  field_type: EntityFieldType;
  type?: EntityFieldType; // Para compatibilidade com o código existente
  is_required: boolean;
  required?: boolean; // Para compatibilidade com o código existente
  description?: string;
  order_index: number;
  options?: string[];
  validation_rules?: Record<string, any>;
  client_id?: string;
  entity_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Entity extends CustomEntity {
  fields: EntityField[];
  icon_name: string;
  color: string;
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

export interface EntityDiagramProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}

export interface EntityRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: "one_to_many" | "many_to_many";
  name: string;
}

export interface EntityNodeProps {
  data: Entity;
}