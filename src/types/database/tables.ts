export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      collaborators: {
        Row: {
          id: string;
          auth_user_id: string;
          client_id: string;
          name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          client_id: string;
          name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          client_id?: string;
          name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          cnpj: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          cnpj?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          cnpj?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          cpf: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          cpf?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          cpf?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      partners: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          cnpj: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          cnpj?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          cnpj?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_fields: {
        Row: {
          id: string;
          client_id: string;
          entity_type: string;
          name: string;
          field_type: string;
          description: string | null;
          is_required: boolean;
          validation_rules: Json | null;
          options: string[] | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          entity_type: string;
          name: string;
          field_type: string;
          description?: string | null;
          is_required?: boolean;
          validation_rules?: Json | null;
          options?: string[] | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          entity_type?: string;
          name?: string;
          field_type?: string;
          description?: string | null;
          is_required?: boolean;
          validation_rules?: Json | null;
          options?: string[] | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_field_values: {
        Row: {
          id: string;
          client_id: string;
          entity_type: string;
          entity_id: string;
          field_id: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          entity_type: string;
          entity_id: string;
          field_id: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          entity_type?: string;
          entity_id?: string;
          field_id?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      opportunity_entity_relationships: {
        Row: {
          id: string;
          client_id: string;
          opportunity_id: string;
          entity_type: string;
          entity_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          opportunity_id: string;
          entity_type: string;
          entity_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          opportunity_id?: string;
          entity_type?: string;
          entity_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 
