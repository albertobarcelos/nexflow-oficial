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
  is_staged?: boolean;
  staging_batch?: string;
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
  entity_fields?: EntityField[];
}

export interface CustomEntity {
  id: string;
  name: string;
  template_name: string | null;
  client_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}