import { Json } from "@/types/database/json";

export interface OpportunityFormData {
  title: string;
  value: string;
  customFields: Record<string, any>;
}

export interface CustomFieldValue {
  id: string;
  value: any;
}

export interface OpportunityField {
  id: string;
  name: string;
  type: string;
  value?: any;
  required?: boolean;
}