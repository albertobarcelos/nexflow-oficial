export interface FieldDefinition {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  type: "text" | "textarea" | "number" | "date" | "url";
  target_type: "company" | "person" | "partner";
  created_at: string;
  updated_at: string;
}

export interface FieldValue {
  id: string;
  client_id: string;
  field_id: string;
  target_id: string;
  value: string;
  created_at: string;
  updated_at: string;
  field: FieldDefinition;
}

export interface AddFieldDefinitionInput {
  name: string;
  description?: string | null;
  type: FieldDefinition["type"];
  target_type: FieldDefinition["target_type"];
}

export interface UpdateFieldDefinitionInput extends Partial<AddFieldDefinitionInput> {} 
