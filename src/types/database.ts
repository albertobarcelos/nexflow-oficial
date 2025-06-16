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
      // =====================================================
      // CORE TABLES (Sistema Base)
      // =====================================================
      
      core_clients: {
        Row: {
          id: string
          name: string
          company_name: string
          email: string
          phone: string | null
          cpf_cnpj: string
          contact_name: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          notes: string | null
          documents: Json | null
          history: Json | null
          status: 'active' | 'inactive'
          license_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company_name: string
          email: string
          phone?: string | null
          cpf_cnpj: string
          contact_name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          notes?: string | null
          documents?: Json | null
          history?: Json | null
          status?: 'active' | 'inactive'
          license_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company_name?: string
          email?: string
          phone?: string | null
          cpf_cnpj?: string
          contact_name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          notes?: string | null
          documents?: Json | null
          history?: Json | null
          status?: 'active' | 'inactive'
          license_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_clients_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "core_licenses"
            referencedColumns: ["id"]
          }
        ]
      }

      core_client_users: {
        Row: {
          id: string
          client_id: string
          email: string
          role: 'administrator' | 'closer' | 'partnership_director' | 'partner'
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          email: string
          role?: 'administrator' | 'closer' | 'partnership_director' | 'partner'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          email?: string
          role?: 'administrator' | 'closer' | 'partnership_director' | 'partner'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_client_users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      core_licenses: {
        Row: {
          id: string
          name: string
          user_quantity: number
          can_use_automations: boolean | null
          can_use_integrations: boolean | null
          can_create_flows: boolean | null
          can_export_data: boolean | null
          can_use_nexflow: boolean | null
          storage_limit_mb: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          user_quantity: number
          can_use_automations?: boolean | null
          can_use_integrations?: boolean | null
          can_create_flows?: boolean | null
          can_export_data?: boolean | null
          can_use_nexflow?: boolean | null
          storage_limit_mb?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          user_quantity?: number
          can_use_automations?: boolean | null
          can_use_integrations?: boolean | null
          can_create_flows?: boolean | null
          can_export_data?: boolean | null
          can_use_nexflow?: boolean | null
          storage_limit_mb?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      core_client_license: {
        Row: {
          id: string
          client_id: string
          license_id: string | null
          type: 'free' | 'premium'
          start_date: string
          expiration_date: string
          status: 'active' | 'suspended' | 'expired'
          subscription_id: string | null
          payment_status: string | null
          last_payment_date: string | null
          next_payment_date: string | null
          price: number | null
          currency: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          user_limit: number
          can_use_nexhunters: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          license_id?: string | null
          type?: 'free' | 'premium'
          start_date?: string
          expiration_date: string
          status?: 'active' | 'suspended' | 'expired'
          subscription_id?: string | null
          payment_status?: string | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          price?: number | null
          currency?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          user_limit?: number
          can_use_nexhunters?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          license_id?: string | null
          type?: 'free' | 'premium'
          start_date?: string
          expiration_date?: string
          status?: 'active' | 'suspended' | 'expired'
          subscription_id?: string | null
          payment_status?: string | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          price?: number | null
          currency?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          user_limit?: number
          can_use_nexhunters?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_client_license_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_client_license_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "core_licenses"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // WEB TABLES (Módulo CRM)
      // =====================================================

      web_companies: {
        Row: {
          id: string
          client_id: string
          name: string
          cnpj: string | null
          razao_social: string | null
          description: string | null
          segment: string | null
          size: string | null
          email: string | null
          phone: string | null
          whatsapp: string | null
          telefone: string | null
          celular: string | null
          website: string | null
          company_type: string
          logo_url: string | null
          categoria: string | null
          origem: string | null
          creator_id: string | null
          setor: string | null
          cep: string | null
          pais: string | null
          bairro: string | null
          rua: string | null
          numero: string | null
          complemento: string | null
          facebook: string | null
          twitter: string | null
          linkedin: string | null
          instagram: string | null
          skype: string | null
          privacidade: string | null
          partner_id: string | null
          city_id: string | null
          state_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          cnpj?: string | null
          razao_social?: string | null
          description?: string | null
          segment?: string | null
          size?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          telefone?: string | null
          celular?: string | null
          website?: string | null
          company_type?: string
          logo_url?: string | null
          categoria?: string | null
          origem?: string | null
          creator_id?: string | null
          setor?: string | null
          cep?: string | null
          pais?: string | null
          bairro?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          facebook?: string | null
          twitter?: string | null
          linkedin?: string | null
          instagram?: string | null
          skype?: string | null
          privacidade?: string | null
          partner_id?: string | null
          city_id?: string | null
          state_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          cnpj?: string | null
          razao_social?: string | null
          description?: string | null
          segment?: string | null
          size?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          telefone?: string | null
          celular?: string | null
          website?: string | null
          company_type?: string
          logo_url?: string | null
          categoria?: string | null
          origem?: string | null
          creator_id?: string | null
          setor?: string | null
          cep?: string | null
          pais?: string | null
          bairro?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          facebook?: string | null
          twitter?: string | null
          linkedin?: string | null
          instagram?: string | null
          skype?: string | null
          privacidade?: string | null
          partner_id?: string | null
          city_id?: string | null
          state_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_companies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_companies_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_companies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "web_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_companies_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "web_states"
            referencedColumns: ["id"]
          }
        ]
      }

      web_people: {
        Row: {
          id: string
          client_id: string
          name: string
          email: string | null
          phone: string | null
          whatsapp: string | null
          description: string | null
          avatar_type: string | null
          avatar_seed: string | null
          custom_avatar_url: string | null
          birth_date: string | null
          people_type: 'Contato Principal' | 'Contato Secundário' | 'Contador' | 'Consultor' | 'Parceiro' | null
          status: string | null
          company_id: string | null
          role: string | null
          linkedin: string | null
          instagram: string | null
          region_id: string | null
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          description?: string | null
          avatar_type?: string | null
          avatar_seed?: string | null
          custom_avatar_url?: string | null
          birth_date?: string | null
          people_type?: 'Contato Principal' | 'Contato Secundário' | 'Contador' | 'Consultor' | 'Parceiro' | null
          status?: string | null
          company_id?: string | null
          role?: string | null
          linkedin?: string | null
          instagram?: string | null
          region_id?: string | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          description?: string | null
          avatar_type?: string | null
          avatar_seed?: string | null
          custom_avatar_url?: string | null
          birth_date?: string | null
          people_type?: 'Contato Principal' | 'Contato Secundário' | 'Contador' | 'Consultor' | 'Parceiro' | null
          status?: string | null
          company_id?: string | null
          role?: string | null
          linkedin?: string | null
          instagram?: string | null
          region_id?: string | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_people_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_people_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          }
        ]
      }

      web_deals: {
        Row: {
          id: string
          client_id: string
          title: string
          value: number | null
          description: string | null
          expected_close_date: string | null
          company_id: string | null
          stage_id: string | null
          funnel_id: string | null
          position: number
          entity_type: 'company' | 'person' | 'partner' | null
          category_id: string | null
          origin_id: string | null
          origin_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          value?: number | null
          description?: string | null
          expected_close_date?: string | null
          company_id?: string | null
          stage_id?: string | null
          funnel_id?: string | null
          position?: number
          entity_type?: 'company' | 'person' | 'partner' | null
          category_id?: string | null
          origin_id?: string | null
          origin_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          value?: number | null
          description?: string | null
          expected_close_date?: string | null
          company_id?: string | null
          stage_id?: string | null
          funnel_id?: string | null
          position?: number
          entity_type?: 'company' | 'person' | 'partner' | null
          category_id?: string | null
          origin_id?: string | null
          origin_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "web_funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deals_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "web_funnels"
            referencedColumns: ["id"]
          }
        ]
      }

      web_tasks: {
        Row: {
          id: string
          client_id: string | null
          title: string
          description: string | null
          due_date: string
          completed: boolean | null
          deal_id: string | null
          assigned_to: string | null
          type_id: string
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id?: string | null
          title: string
          description?: string | null
          due_date: string
          completed?: boolean | null
          deal_id?: string | null
          assigned_to?: string | null
          type_id?: string
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string | null
          title?: string
          description?: string | null
          due_date?: string
          completed?: boolean | null
          deal_id?: string | null
          assigned_to?: string | null
          type_id?: string
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          }
        ]
      }

      web_funnels: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          is_default: boolean | null
          allowed_entities: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          is_default?: boolean | null
          allowed_entities?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          is_default?: boolean | null
          allowed_entities?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_funnels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          }
        ]
      }

      web_funnel_stages: {
        Row: {
          id: string
          client_id: string
          funnel_id: string | null
          name: string
          description: string | null
          color: string | null
          order_index: number
          position: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          funnel_id?: string | null
          name: string
          description?: string | null
          color?: string | null
          order_index: number
          position?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          funnel_id?: string | null
          name?: string
          description?: string | null
          color?: string | null
          order_index?: number
          position?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_funnel_stages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "web_funnels"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // AUXILIARY TABLES
      // =====================================================

      web_cities: {
        Row: {
          id: string
          name: string
          state_id: string | null
          ibge_code: number | null
          latitude: number | null
          longitude: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          state_id?: string | null
          ibge_code?: number | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          state_id?: string | null
          ibge_code?: number | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "web_states"
            referencedColumns: ["id"]
          }
        ]
      }

      web_states: {
        Row: {
          id: string
          name: string
          uf: string
          ibge_code: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          uf: string
          ibge_code?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          uf?: string
          ibge_code?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 