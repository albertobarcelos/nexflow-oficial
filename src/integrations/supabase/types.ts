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
          email: string
          id: string
          name: string
          notes: string | null
          partner_portal_id: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          postal_code: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
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
          email: string
          id?: string
          name: string
          notes?: string | null
          partner_portal_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
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
          email?: string
          id?: string
          name?: string
          notes?: string | null
          partner_portal_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: []
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
      license_status: "active" | "suspended" | "expired"
      plan_type: "free" | "premium"
      report_type: "usage" | "financial"
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
