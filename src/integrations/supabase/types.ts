export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      administrators: {
        Row: {
          access_level: Database["public"]["Enums"]["admin_access_level"]
          auth_user_id: string
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["admin_access_level"]
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["admin_access_level"]
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          country: string | null
          created_at: string
          crm_id: string | null
          documents: Json | null
          email: string
          history: Json | null
          id: string
          name: string
          notes: string | null
          partner_portal_id: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          postal_code: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          crm_id?: string | null
          documents?: Json | null
          email: string
          history?: Json | null
          id?: string
          name: string
          notes?: string | null
          partner_portal_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          crm_id?: string | null
          documents?: Json | null
          email?: string
          history?: Json | null
          id?: string
          name?: string
          notes?: string | null
          partner_portal_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaborator_invites: {
        Row: {
          collaborator_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_invites_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          auth_user_id: string
          client_id: string
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          license_id: string
          name: string
          permissions: Json
          role: Database["public"]["Enums"]["collaborator_role"]
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          client_id: string
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          license_id: string
          name: string
          permissions?: Json
          role?: Database["public"]["Enums"]["collaborator_role"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          license_id?: string
          name?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["collaborator_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborators_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          is_required: boolean | null
          name: string
          options: Json | null
          order_index: number
          pipeline_id: string
          stage_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          field_type: Database["public"]["Enums"]["field_type"]
          id?: string
          is_required?: boolean | null
          name: string
          options?: Json | null
          order_index: number
          pipeline_id: string
          stage_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_required?: boolean | null
          name?: string
          options?: Json | null
          order_index?: number
          pipeline_id?: string
          stage_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_fields_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipeline_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_fields_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_naming_preferences: {
        Row: {
          client_id: string
          created_at: string
          entity_type: string
          id: string
          plural_name: string
          singular_name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          entity_type: string
          id?: string
          plural_name: string
          singular_name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          entity_type?: string
          id?: string
          plural_name?: string
          singular_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_naming_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          client_id: string
          company: string | null
          converted_at: string | null
          converted_by: string | null
          created_at: string
          email: string | null
          history: Json
          id: string
          metadata: Json
          name: string
          notes: string | null
          partner_portal_id: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          company?: string | null
          converted_at?: string | null
          converted_by?: string | null
          created_at?: string
          email?: string | null
          history?: Json
          id?: string
          metadata?: Json
          name: string
          notes?: string | null
          partner_portal_id?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          company?: string | null
          converted_at?: string | null
          converted_by?: string | null
          created_at?: string
          email?: string | null
          history?: Json
          id?: string
          metadata?: Json
          name?: string
          notes?: string | null
          partner_portal_id?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partner_portal_id_fkey"
            columns: ["partner_portal_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          client_id: string
          created_at: string
          currency: string | null
          expiration_date: string
          id: string
          last_payment_date: string | null
          next_payment_date: string | null
          payment_status: string | null
          price: number | null
          start_date: string
          status: Database["public"]["Enums"]["license_status"]
          subscription_id: string | null
          type: Database["public"]["Enums"]["plan_type"]
          updated_at: string
          user_limit: number
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          client_id: string
          created_at?: string
          currency?: string | null
          expiration_date: string
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_status?: string | null
          price?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["license_status"]
          subscription_id?: string | null
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
          user_limit?: number
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          client_id?: string
          created_at?: string
          currency?: string | null
          expiration_date?: string
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_status?: string | null
          price?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["license_status"]
          subscription_id?: string | null
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
          user_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "licenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          client_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          expected_close_date: string | null
          history: Json
          id: string
          lead_id: string | null
          metadata: Json
          notes: string | null
          pipeline_id: string | null
          probability: number | null
          stage_id: string | null
          status: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          client_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          expected_close_date?: string | null
          history?: Json
          id?: string
          lead_id?: string | null
          metadata?: Json
          notes?: string | null
          pipeline_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          expected_close_date?: string | null
          history?: Json
          id?: string
          lead_id?: string | null
          metadata?: Json
          notes?: string | null
          pipeline_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "opportunity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipeline_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_categories: {
        Row: {
          client_id: string
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_configs: {
        Row: {
          allowed_roles:
            | Database["public"]["Enums"]["collaborator_role"][]
            | null
          client_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          allowed_roles?:
            | Database["public"]["Enums"]["collaborator_role"][]
            | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          allowed_roles?:
            | Database["public"]["Enums"]["collaborator_role"][]
            | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          pipeline_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index: number
          pipeline_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          pipeline_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipeline_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          client_id: string
          content: Json
          created_at: string
          description: string | null
          download_count: number | null
          downloaded_at: string | null
          file_url: string | null
          format: string | null
          generated_at: string
          id: string
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["report_type"]
          updated_at: string
        }
        Insert: {
          client_id: string
          content?: Json
          created_at?: string
          description?: string | null
          download_count?: number | null
          downloaded_at?: string | null
          file_url?: string | null
          format?: string | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          title?: string
          type: Database["public"]["Enums"]["report_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: Json
          created_at?: string
          description?: string | null
          download_count?: number | null
          downloaded_at?: string | null
          file_url?: string | null
          format?: string | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["report_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      admin_access_level: "general" | "limited"
      client_status: "active" | "inactive"
      collaborator_role:
        | "administrator"
        | "closer"
        | "partnership_director"
        | "partner"
      field_type:
        | "short_text"
        | "long_text"
        | "dynamic_content"
        | "attachment"
        | "checkbox"
        | "responsible"
        | "date"
        | "datetime"
        | "due_date"
        | "tags"
        | "email"
        | "phone"
        | "list"
        | "single_select"
        | "time"
        | "numeric"
        | "currency"
        | "documents"
        | "id"
      lead_source: "partner_portal" | "manual"
      lead_status: "new" | "in_progress" | "closed"
      license_status: "active" | "suspended" | "expired"
      plan_type: "free" | "premium"
      report_type: "usage" | "financial"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "doing" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
