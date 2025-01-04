import { CustomEntity } from "@/types/database/entity";

export interface Entity extends CustomEntity {
  fields: EntityField[];
}

export interface EntityField {
  id: string;
  name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  order_index: number;
  options?: string[];
  validation_rules?: Record<string, any>;
}

export interface EntityRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: "one_to_many" | "many_to_many";
  name: string;
}

export interface EntityDiagramProps {
  entities: Entity[];
  relationships: EntityRelationship[];
}