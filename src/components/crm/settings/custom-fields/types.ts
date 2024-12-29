import { Json } from "@/types/database/json";

export interface CustomField {
  id: string;
  client_id?: string;
  pipeline_id?: string;
  stage_id?: string;
  name: string;
  field_type: string;
  description?: string | null;
  is_required?: boolean;
  order_index: number;
  options: any[];
  created_at?: string;
  updated_at?: string;
}