export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // =====================================================
      // CORE TABLES (Sistema Base)
      // =====================================================

      core_clients: {
        Row: {
          id: string;
          name: string;
          company_name: string;
          email: string;
          phone: string | null;
          cpf_cnpj: string;
          contact_name: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          notes: string | null;
          documents: Json | null;
          history: Json | null;
          status: "active" | "inactive";
          license_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company_name: string;
          email: string;
          phone?: string | null;
          cpf_cnpj: string;
          contact_name?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          notes?: string | null;
          documents?: Json | null;
          history?: Json | null;
          status?: "active" | "inactive";
          license_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          company_name?: string;
          email?: string;
          phone?: string | null;
          cpf_cnpj?: string;
          contact_name?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          notes?: string | null;
          documents?: Json | null;
          history?: Json | null;
          status?: "active" | "inactive";
          license_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "core_clients_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "core_licenses";
            referencedColumns: ["id"];
          }
        ];
      };

      core_client_users: {
        Row: {
          id: string;
          client_id: string;
          email: string;
          role: "administrator" | "closer" | "partnership_director" | "partner";
          name: string | null;
          surname: string | null;
          phone: string | null;
          avatar_url: string | null;
          avatar_type: string | null;
          avatar_seed: string | null;
          custom_avatar_url: string | null;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          email: string;
          role?:
            | "administrator"
            | "closer"
            | "partnership_director"
            | "partner";
          name?: string | null;
          surname?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          avatar_type?: string | null;
          avatar_seed?: string | null;
          custom_avatar_url?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          email?: string;
          role?:
            | "administrator"
            | "closer"
            | "partnership_director"
            | "partner";
          name?: string | null;
          surname?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          avatar_type?: string | null;
          avatar_seed?: string | null;
          custom_avatar_url?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "core_client_users_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "core_client_users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      core_licenses: {
        Row: {
          id: string;
          name: string;
          user_quantity: number;
          can_use_automations: boolean | null;
          can_use_integrations: boolean | null;
          can_create_flows: boolean | null;
          can_export_data: boolean | null;
          can_use_nexflow: boolean | null;
          storage_limit_mb: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          user_quantity: number;
          can_use_automations?: boolean | null;
          can_use_integrations?: boolean | null;
          can_create_flows?: boolean | null;
          can_export_data?: boolean | null;
          can_use_nexflow?: boolean | null;
          storage_limit_mb?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          user_quantity?: number;
          can_use_automations?: boolean | null;
          can_use_integrations?: boolean | null;
          can_create_flows?: boolean | null;
          can_export_data?: boolean | null;
          can_use_nexflow?: boolean | null;
          storage_limit_mb?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      core_franchises: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          code: string | null;
          description: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          code?: string | null;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          code?: string | null;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "core_franchises_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };

      core_client_license: {
        Row: {
          id: string;
          client_id: string;
          license_id: string | null;
          type: "free" | "premium";
          start_date: string;
          expiration_date: string;
          status: "active" | "suspended" | "expired";
          subscription_id: string | null;
          payment_status: string | null;
          last_payment_date: string | null;
          next_payment_date: string | null;
          price: number | null;
          currency: string | null;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          user_limit: number;
          can_use_nexhunters: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          license_id?: string | null;
          type?: "free" | "premium";
          start_date?: string;
          expiration_date: string;
          status?: "active" | "suspended" | "expired";
          subscription_id?: string | null;
          payment_status?: string | null;
          last_payment_date?: string | null;
          next_payment_date?: string | null;
          price?: number | null;
          currency?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          user_limit?: number;
          can_use_nexhunters?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          license_id?: string | null;
          type?: "free" | "premium";
          start_date?: string;
          expiration_date?: string;
          status?: "active" | "suspended" | "expired";
          subscription_id?: string | null;
          payment_status?: string | null;
          last_payment_date?: string | null;
          next_payment_date?: string | null;
          price?: number | null;
          currency?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          user_limit?: number;
          can_use_nexhunters?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "core_client_license_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "core_client_license_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "core_licenses";
            referencedColumns: ["id"];
          }
        ];
      };

      core_indications: {
        Row: {
          id: string;
          client_id: string;
          hunter_id: string;
          related_card_ids: string[] | null;
          status: "pending" | "processed" | "converted" | "rejected" | null;
          created_at: string | null;
          updated_at: string | null;
          responsible: string | null;
          indication_name: string | null;
          cnpj_cpf: string | null;
          phone: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          hunter_id: string;
          related_card_ids?: string[] | null;
          status?: "pending" | "processed" | "converted" | "rejected" | null;
          created_at?: string | null;
          updated_at?: string | null;
          responsible?: string | null;
          indication_name?: string | null;
          cnpj_cpf?: string | null;
          phone?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          hunter_id?: string;
          related_card_ids?: string[] | null;
          status?: "pending" | "processed" | "converted" | "rejected" | null;
          created_at?: string | null;
          updated_at?: string | null;
          responsible?: string | null;
          indication_name?: string | null;
          cnpj_cpf?: string | null;
          phone?: string | null;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "core_indications_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };

      // =====================================================
      // WEB TABLES (Módulo CRM)
      // =====================================================

      web_companies: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          cnpj: string | null;
          razao_social: string | null;
          description: string | null;
          segment: string | null;
          size: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          telefone: string | null;
          celular: string | null;
          website: string | null;
          company_type: string;
          logo_url: string | null;
          categoria: string | null;
          origem: string | null;
          creator_id: string | null;
          setor: string | null;
          cep: string | null;
          pais: string | null;
          bairro: string | null;
          rua: string | null;
          numero: string | null;
          complemento: string | null;
          facebook: string | null;
          twitter: string | null;
          linkedin: string | null;
          instagram: string | null;
          skype: string | null;
          privacidade: string | null;
          partner_id: string | null;
          city_id: string | null;
          state_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          cnpj?: string | null;
          razao_social?: string | null;
          description?: string | null;
          segment?: string | null;
          size?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          telefone?: string | null;
          celular?: string | null;
          website?: string | null;
          company_type?: string;
          logo_url?: string | null;
          categoria?: string | null;
          origem?: string | null;
          creator_id?: string | null;
          setor?: string | null;
          cep?: string | null;
          pais?: string | null;
          bairro?: string | null;
          rua?: string | null;
          numero?: string | null;
          complemento?: string | null;
          facebook?: string | null;
          twitter?: string | null;
          linkedin?: string | null;
          instagram?: string | null;
          skype?: string | null;
          privacidade?: string | null;
          partner_id?: string | null;
          city_id?: string | null;
          state_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          cnpj?: string | null;
          razao_social?: string | null;
          description?: string | null;
          segment?: string | null;
          size?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          telefone?: string | null;
          celular?: string | null;
          website?: string | null;
          company_type?: string;
          logo_url?: string | null;
          categoria?: string | null;
          origem?: string | null;
          creator_id?: string | null;
          setor?: string | null;
          cep?: string | null;
          pais?: string | null;
          bairro?: string | null;
          rua?: string | null;
          numero?: string | null;
          complemento?: string | null;
          facebook?: string | null;
          twitter?: string | null;
          linkedin?: string | null;
          instagram?: string | null;
          skype?: string | null;
          privacidade?: string | null;
          partner_id?: string | null;
          city_id?: string | null;
          state_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_companies_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_companies_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "core_client_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_companies_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "web_cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_companies_state_id_fkey";
            columns: ["state_id"];
            isOneToOne: false;
            referencedRelation: "web_states";
            referencedColumns: ["id"];
          }
        ];
      };

      web_people: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          description: string | null;
          avatar_type: string | null;
          avatar_seed: string | null;
          custom_avatar_url: string | null;
          birth_date: string | null;
          people_type:
            | "Contato Principal"
            | "Contato Secundário"
            | "Contador"
            | "Consultor"
            | "Parceiro"
            | null;
          status: string | null;
          company_id: string | null;
          role: string | null;
          linkedin: string | null;
          instagram: string | null;
          region_id: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          description?: string | null;
          avatar_type?: string | null;
          avatar_seed?: string | null;
          custom_avatar_url?: string | null;
          birth_date?: string | null;
          people_type?:
            | "Contato Principal"
            | "Contato Secundário"
            | "Contador"
            | "Consultor"
            | "Parceiro"
            | null;
          status?: string | null;
          company_id?: string | null;
          role?: string | null;
          linkedin?: string | null;
          instagram?: string | null;
          region_id?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          description?: string | null;
          avatar_type?: string | null;
          avatar_seed?: string | null;
          custom_avatar_url?: string | null;
          birth_date?: string | null;
          people_type?:
            | "Contato Principal"
            | "Contato Secundário"
            | "Contador"
            | "Consultor"
            | "Parceiro"
            | null;
          status?: string | null;
          company_id?: string | null;
          role?: string | null;
          linkedin?: string | null;
          instagram?: string | null;
          region_id?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_people_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_people_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "web_companies";
            referencedColumns: ["id"];
          }
        ];
      };

      web_deals: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          value: number | null;
          description: string | null;
          expected_close_date: string | null;
          company_id: string | null;
          person_id: string | null;
          stage_id: string | null;
          funnel_id: string | null;
          position: number;
          entity_type: "company" | "person" | "partner" | null;
          category_id: string | null;
          origin_id: string | null;
          origin_name: string | null;
          temperature: "hot" | "warm" | "cold" | null;
          tags: string[] | null;
          responsible_id: string | null;
          probability: number | null;
          notes: string | null;
          last_activity: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          value?: number | null;
          description?: string | null;
          expected_close_date?: string | null;
          company_id?: string | null;
          person_id?: string | null;
          stage_id?: string | null;
          funnel_id?: string | null;
          position?: number;
          entity_type?: "company" | "person" | "partner" | null;
          category_id?: string | null;
          origin_id?: string | null;
          origin_name?: string | null;
          temperature?: "hot" | "warm" | "cold" | null;
          tags?: string[] | null;
          responsible_id?: string | null;
          probability?: number | null;
          notes?: string | null;
          last_activity?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          value?: number | null;
          description?: string | null;
          expected_close_date?: string | null;
          company_id?: string | null;
          person_id?: string | null;
          stage_id?: string | null;
          funnel_id?: string | null;
          position?: number;
          entity_type?: "company" | "person" | "partner" | null;
          category_id?: string | null;
          origin_id?: string | null;
          origin_name?: string | null;
          temperature?: "hot" | "warm" | "cold" | null;
          tags?: string[] | null;
          responsible_id?: string | null;
          probability?: number | null;
          notes?: string | null;
          last_activity?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_deals_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "web_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_deals_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "web_people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_deals_responsible_id_fkey";
            columns: ["responsible_id"];
            isOneToOne: false;
            referencedRelation: "core_client_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_deals_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "web_funnel_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_deals_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "web_funnels";
            referencedColumns: ["id"];
          }
        ];
      };

      web_items: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          price: number | null;
          item_code: string | null;
          item_type: "product" | "service";
          billing_type: "one_time" | "recurring";
          metadata: Json;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          item_code?: string | null;
          item_type: "product" | "service";
          billing_type: "one_time" | "recurring";
          metadata?: Json;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          item_code?: string | null;
          item_type?: "product" | "service";
          billing_type?: "one_time" | "recurring";
          metadata?: Json;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_items_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };

      core_team_levels: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          level_order: number;
          commission_percentage: number;
          commission_implantation_percentage: number | null;
          commission_recurring_percentage: number | null;
          commission_one_time_percentage: number | null;
          description: string | null;
          is_active: boolean | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          level_order: number;
          commission_percentage: number;
          commission_implantation_percentage?: number | null;
          commission_recurring_percentage?: number | null;
          commission_one_time_percentage?: number | null;
          description?: string | null;
          is_active?: boolean | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          level_order?: number;
          commission_percentage?: number;
          commission_implantation_percentage?: number | null;
          commission_recurring_percentage?: number | null;
          commission_one_time_percentage?: number | null;
          description?: string | null;
          is_active?: boolean | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      core_team_member_levels: {
        Row: {
          id: string;
          team_member_id: string;
          team_level_id: string;
          effective_from: string;
          effective_to: string | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_member_id: string;
          team_level_id: string;
          effective_from?: string;
          effective_to?: string | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_member_id?: string;
          team_level_id?: string;
          effective_from?: string;
          effective_to?: string | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      core_team_commissions: {
        Row: {
          id: string;
          team_id: string;
          item_id: string | null;
          item_code: string | null;
          commission_type: "percentage" | "fixed";
          commission_value: number;
          distribution_type: "team_based" | "individual" | null;
          distribution_config: Json;
          recurring_max_months: number | null;
          recurring_until_cancellation: boolean | null;
          description: string | null;
          is_active: boolean | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          item_id?: string | null;
          item_code?: string | null;
          commission_type: "percentage" | "fixed";
          commission_value: number;
          distribution_type?: "team_based" | "individual" | null;
          distribution_config?: Json;
          recurring_max_months?: number | null;
          recurring_until_cancellation?: boolean | null;
          description?: string | null;
          is_active?: boolean | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          item_id?: string | null;
          item_code?: string | null;
          commission_type?: "percentage" | "fixed";
          commission_value?: number;
          distribution_type?: "team_based" | "individual" | null;
          distribution_config?: Json;
          recurring_max_months?: number | null;
          recurring_until_cancellation?: boolean | null;
          description?: string | null;
          is_active?: boolean | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      core_commission_calculations: {
        Row: {
          id: string;
          card_id: string;
          card_item_id: string | null;
          payment_id: string | null;
          payment_amount: number | null;
          payment_date: string | null;
          team_id: string;
          item_code: string | null;
          team_commission_type: string;
          team_commission_value: number;
          team_commission_amount: number;
          total_distributed_percentage: number;
          total_distributed_amount: number;
          status: "pending" | "approved" | "paid" | "cancelled";
          approved_by: string | null;
          approved_at: string | null;
          paid_at: string | null;
          notes: string | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          card_item_id?: string | null;
          payment_id?: string | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          team_id: string;
          item_code?: string | null;
          team_commission_type: string;
          team_commission_value: number;
          team_commission_amount: number;
          total_distributed_percentage?: number;
          total_distributed_amount?: number;
          status?: "pending" | "approved" | "paid" | "cancelled";
          approved_by?: string | null;
          approved_at?: string | null;
          paid_at?: string | null;
          notes?: string | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          card_item_id?: string | null;
          payment_id?: string | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          team_id?: string;
          item_code?: string | null;
          team_commission_type?: string;
          team_commission_value?: number;
          team_commission_amount?: number;
          total_distributed_percentage?: number;
          total_distributed_amount?: number;
          status?: "pending" | "approved" | "paid" | "cancelled";
          approved_by?: string | null;
          approved_at?: string | null;
          paid_at?: string | null;
          notes?: string | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      core_commission_distributions: {
        Row: {
          id: string;
          calculation_id: string;
          user_id: string;
          level_id: string | null;
          member_role: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep" | null;
          item_type: "implantation" | "recurring" | null;
          recurring_month_number: number | null;
          is_recurring_while_active: boolean | null;
          distribution_percentage: number;
          distribution_amount: number;
          status: "pending" | "approved" | "paid" | "cancelled";
          paid_at: string | null;
          notes: string | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          calculation_id: string;
          user_id: string;
          level_id?: string | null;
          member_role?: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep" | null;
          item_type?: "implantation" | "recurring" | null;
          recurring_month_number?: number | null;
          is_recurring_while_active?: boolean | null;
          distribution_percentage: number;
          distribution_amount: number;
          status?: "pending" | "approved" | "paid" | "cancelled";
          paid_at?: string | null;
          notes?: string | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          calculation_id?: string;
          user_id?: string;
          level_id?: string | null;
          member_role?: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep" | null;
          item_type?: "implantation" | "recurring" | null;
          recurring_month_number?: number | null;
          is_recurring_while_active?: boolean | null;
          distribution_percentage?: number;
          distribution_amount?: number;
          status?: "pending" | "approved" | "paid" | "cancelled";
          paid_at?: string | null;
          notes?: string | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      web_payments: {
        Row: {
          id: string;
          card_id: string;
          payment_reference: string | null;
          payment_date: string;
          payment_amount: number;
          payment_method: string | null;
          payment_status: "pending" | "confirmed" | "cancelled" | "refunded";
          revalya_payment_id: string | null;
          revalya_sync_at: string | null;
          revalya_sync_status: "pending" | "synced" | "error";
          revalya_metadata: Json;
          confirmed_at: string | null;
          confirmed_by: string | null;
          notes: string | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          payment_reference?: string | null;
          payment_date: string;
          payment_amount: number;
          payment_method?: string | null;
          payment_status?: "pending" | "confirmed" | "cancelled" | "refunded";
          revalya_payment_id?: string | null;
          revalya_sync_at?: string | null;
          revalya_sync_status?: "pending" | "synced" | "error";
          revalya_metadata?: Json;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          notes?: string | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          payment_reference?: string | null;
          payment_date?: string;
          payment_amount?: number;
          payment_method?: string | null;
          payment_status?: "pending" | "confirmed" | "cancelled" | "refunded";
          revalya_payment_id?: string | null;
          revalya_sync_at?: string | null;
          revalya_sync_status?: "pending" | "synced" | "error";
          revalya_metadata?: Json;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          notes?: string | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      revalya_integration_log: {
        Row: {
          id: string;
          sync_type: string;
          revalya_payment_id: string;
          card_id: string | null;
          payment_id: string | null;
          status: "success" | "error" | "pending";
          error_message: string | null;
          revalya_data: Json;
          client_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sync_type: string;
          revalya_payment_id: string;
          card_id?: string | null;
          payment_id?: string | null;
          status: "success" | "error" | "pending";
          error_message?: string | null;
          revalya_data?: Json;
          client_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sync_type?: string;
          revalya_payment_id?: string;
          card_id?: string | null;
          payment_id?: string | null;
          status?: "success" | "error" | "pending";
          error_message?: string | null;
          revalya_data?: Json;
          client_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      core_team_role_commissions: {
        Row: {
          id: string;
          team_id: string;
          role: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep";
          recurring_commission_type: "percentage" | "fixed" | "team_percentage";
          recurring_commission_value: number | null;
          recurring_duration_months: number | null;
          recurring_while_active: boolean | null;
          implantation_commission_type: "percentage" | "fixed" | "team_percentage" | null;
          implantation_commission_value: number | null;
          description: string | null;
          is_active: boolean | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          role: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep";
          recurring_commission_type: "percentage" | "fixed" | "team_percentage";
          recurring_commission_value?: number | null;
          recurring_duration_months?: number | null;
          recurring_while_active?: boolean | null;
          implantation_commission_type?: "percentage" | "fixed" | "team_percentage" | null;
          implantation_commission_value?: number | null;
          description?: string | null;
          is_active?: boolean | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          role?: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep";
          recurring_commission_type?: "percentage" | "fixed" | "team_percentage";
          recurring_commission_value?: number | null;
          recurring_duration_months?: number | null;
          recurring_while_active?: boolean | null;
          implantation_commission_type?: "percentage" | "fixed" | "team_percentage" | null;
          implantation_commission_value?: number | null;
          description?: string | null;
          is_active?: boolean | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      core_team_client_portfolio: {
        Row: {
          id: string;
          team_id: string;
          card_id: string;
          client_status: "active" | "canceled" | "suspended";
          closed_at: string;
          activated_at: string | null;
          canceled_at: string | null;
          total_implantation_value: number | null;
          monthly_recurring_value: number | null;
          notes: string | null;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          card_id: string;
          client_status?: "active" | "canceled" | "suspended";
          closed_at: string;
          activated_at?: string | null;
          canceled_at?: string | null;
          total_implantation_value?: number | null;
          monthly_recurring_value?: number | null;
          notes?: string | null;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          card_id?: string;
          client_status?: "active" | "canceled" | "suspended";
          closed_at?: string;
          activated_at?: string | null;
          canceled_at?: string | null;
          total_implantation_value?: number | null;
          monthly_recurring_value?: number | null;
          notes?: string | null;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      web_tasks: {
        Row: {
          id: string;
          client_id: string | null;
          title: string;
          description: string | null;
          due_date: string;
          completed: boolean | null;
          deal_id: string | null;
          assigned_to: string | null;
          type_id: string;
          created_by: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          title: string;
          description?: string | null;
          due_date: string;
          completed?: boolean | null;
          deal_id?: string | null;
          assigned_to?: string | null;
          type_id?: string;
          created_by: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string;
          completed?: boolean | null;
          deal_id?: string | null;
          assigned_to?: string | null;
          type_id?: string;
          created_by?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "web_tasks_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_tasks_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "web_deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "web_people";
            referencedColumns: ["id"];
          }
        ];
      };

      web_funnels: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          is_default: boolean | null;
          allowed_entities: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean | null;
          allowed_entities?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean | null;
          allowed_entities?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "web_funnels_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };

      web_funnel_stages: {
        Row: {
          id: string;
          client_id: string;
          funnel_id: string | null;
          name: string;
          description: string | null;
          color: string | null;
          order_index: number;
          position: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          funnel_id?: string | null;
          name: string;
          description?: string | null;
          color?: string | null;
          order_index: number;
          position?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          funnel_id?: string | null;
          name?: string;
          description?: string | null;
          color?: string | null;
          order_index?: number;
          position?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "web_funnel_stages_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_funnel_stages_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "web_funnels";
            referencedColumns: ["id"];
          }
        ];
      };

      // =====================================================
      // AUXILIARY TABLES
      // =====================================================

      web_cities: {
        Row: {
          id: string;
          name: string;
          state_id: string | null;
          ibge_code: number | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          state_id?: string | null;
          ibge_code?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          state_id?: string | null;
          ibge_code?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "web_cities_state_id_fkey";
            columns: ["state_id"];
            isOneToOne: false;
            referencedRelation: "web_states";
            referencedColumns: ["id"];
          }
        ];
      };

      web_states: {
        Row: {
          id: string;
          name: string;
          uf: string;
          ibge_code: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          uf: string;
          ibge_code?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          uf?: string;
          ibge_code?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      flows: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: "finance" | "onboarding" | "generic" | null;
          is_active: boolean | null;
          created_at: string | null;
          owner_id: string | null;
          client_id: string | null;
          visibility_type: string;
          flow_identifier: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: "finance" | "onboarding" | "generic" | null;
          is_active?: boolean | null;
          created_at?: string | null;
          owner_id?: string | null;
          client_id?: string | null;
          visibility_type?: string;
          flow_identifier?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: "finance" | "onboarding" | "generic" | null;
          is_active?: boolean | null;
          created_at?: string | null;
          owner_id?: string | null;
          client_id?: string | null;
          visibility_type?: string;
          flow_identifier?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "flows_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flows_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      cards: {
        Row: {
          id: string;
          client_id: string;
          flow_id: string;
          step_id: string;
          title: string;
          field_values: Json | null;
          checklist_progress: Json | null;
          position: number | null;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
          parent_card_id: string | null;
          movement_history: Json | null;
          status: "canceled" | "completed" | "inprogress" | null;
          agents: string[] | null;
          assigned_team_id: string | null;
          lead: string | null;
          product: string | null;
          value: number | null;
          card_type: "finance" | "onboarding" | null;
          action_execution_data: Json | null;
          contact_id: string | null;
          indication_id: string | null;
          indicated_by: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          flow_id: string;
          step_id: string;
          title: string;
          field_values?: Json | null;
          checklist_progress?: Json | null;
          position?: number | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          parent_card_id?: string | null;
          movement_history?: Json | null;
          status?: "canceled" | "completed" | "inprogress" | null;
          agents?: string[] | null;
          assigned_team_id?: string | null;
          lead?: string | null;
          product?: string | null;
          value?: number | null;
          card_type?: "finance" | "onboarding" | null;
          action_execution_data?: Json | null;
          contact_id?: string | null;
          indication_id?: string | null;
          indicated_by?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          flow_id?: string;
          step_id?: string;
          title?: string;
          field_values?: Json | null;
          checklist_progress?: Json | null;
          position?: number | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          parent_card_id?: string | null;
          movement_history?: Json | null;
          status?: "canceled" | "completed" | "inprogress" | null;
          agents?: string[] | null;
          assigned_team_id?: string | null;
          lead?: string | null;
          product?: string | null;
          value?: number | null;
          card_type?: "finance" | "onboarding" | null;
          action_execution_data?: Json | null;
          contact_id?: string | null;
          indication_id?: string | null;
          indicated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cards_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_indication_id_fkey";
            columns: ["indication_id"];
            isOneToOne: false;
            referencedRelation: "core_indications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_assigned_team_id_fkey";
            columns: ["assigned_team_id"];
            isOneToOne: false;
            referencedRelation: "core_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_parent_card_id_fkey";
            columns: ["parent_card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          }
        ];
      };

      step_actions: {
        Row: {
          id: string;
          step_id: string;
          day_offset: number | null;
          position: number | null;
          title: string;
          action_type: "phone_call" | "email" | "linkedin_message" | "whatsapp" | "meeting" | "task";
          description: string | null;
          script_template: string | null;
          checklist_items: string[] | null;
          is_required: boolean | null;
          settings: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          step_id: string;
          day_offset?: number | null;
          position?: number | null;
          title: string;
          action_type: "phone_call" | "email" | "linkedin_message" | "whatsapp" | "meeting" | "task";
          description?: string | null;
          script_template?: string | null;
          checklist_items?: string[] | null;
          is_required?: boolean | null;
          settings?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          step_id?: string;
          day_offset?: number | null;
          position?: number | null;
          title?: string;
          action_type?: "phone_call" | "email" | "linkedin_message" | "whatsapp" | "meeting" | "task";
          description?: string | null;
          script_template?: string | null;
          checklist_items?: string[] | null;
          is_required?: boolean | null;
          settings?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "step_actions_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "steps";
            referencedColumns: ["id"];
          }
        ];
      };

      card_step_actions: {
        Row: {
          id: string;
          card_id: string;
          step_action_id: string;
          step_id: string;
          status: "pending" | "in_progress" | "completed" | "skipped";
          scheduled_date: string | null;
          completed_at: string | null;
          completed_by: string | null;
          notes: string | null;
          execution_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          step_action_id: string;
          step_id: string;
          status?: "pending" | "in_progress" | "completed" | "skipped";
          scheduled_date?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          notes?: string | null;
          execution_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          step_action_id?: string;
          step_id?: string;
          status?: "pending" | "in_progress" | "completed" | "skipped";
          scheduled_date?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          notes?: string | null;
          execution_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "card_step_actions_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "card_step_actions_step_action_id_fkey";
            columns: ["step_action_id"];
            isOneToOne: false;
            referencedRelation: "step_actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "card_step_actions_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "steps";
            referencedColumns: ["id"];
          }
        ];
      };

      web_flows: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_flows_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_flows_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "core_client_users";
            referencedColumns: ["id"];
          }
        ];
      };

      web_flow_stages: {
        Row: {
          id: string;
          client_id: string;
          flow_id: string;
          name: string;
          description: string | null;
          color: string | null;
          order_index: number;
          is_final_stage: boolean;
          stage_type: "active" | "won" | "lost" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          flow_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          order_index: number;
          is_final_stage?: boolean;
          stage_type?: "active" | "won" | "lost" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          flow_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          order_index?: number;
          is_final_stage?: boolean;
          stage_type?: "active" | "won" | "lost" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_flow_stages_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_flow_stages_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "web_flows";
            referencedColumns: ["id"];
          }
        ];
      };

      web_form_fields: {
        Row: {
          id: string;
          flow_id: string;
          field_type: string;
          label: string;
          placeholder: string | null;
          description: string | null;
          help_text: string | null;
          required: boolean;
          editable_in_other_stages: boolean;
          unique_value: boolean;
          compact_view: boolean;
          order_index: number;
          form_type: string;
          stage_id: string | null;
          validation_rules: Json | null;
          field_options: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flow_id: string;
          field_type: string;
          label: string;
          placeholder?: string | null;
          description?: string | null;
          help_text?: string | null;
          required?: boolean;
          editable_in_other_stages?: boolean;
          unique_value?: boolean;
          compact_view?: boolean;
          order_index?: number;
          form_type: string;
          stage_id?: string | null;
          validation_rules?: Json | null;
          field_options?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          flow_id?: string;
          field_type?: string;
          label?: string;
          placeholder?: string | null;
          description?: string | null;
          help_text?: string | null;
          required?: boolean;
          editable_in_other_stages?: boolean;
          unique_value?: boolean;
          compact_view?: boolean;
          order_index?: number;
          form_type?: string;
          stage_id?: string | null;
          validation_rules?: Json | null;
          field_options?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_form_fields_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "web_flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_form_fields_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "web_flow_stages";
            referencedColumns: ["id"];
          }
        ];
      };

      // =====================================================
      // SISTEMA MODULAR DE FLOWS E VISUALIZAÇÕES DUPLICADAS
      // =====================================================

      web_deal_flow_views: {
        Row: {
          id: string;
          client_id: string;
          deal_id: string;
          flow_id: string;
          stage_id: string;
          is_primary: boolean;
          is_duplicate: boolean;
          visible_to_roles: string[];
          auto_sync: boolean;
          sync_fields: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          deal_id: string;
          flow_id: string;
          stage_id: string;
          is_primary?: boolean;
          is_duplicate?: boolean;
          visible_to_roles?: string[];
          auto_sync?: boolean;
          sync_fields?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          deal_id?: string;
          flow_id?: string;
          stage_id?: string;
          is_primary?: boolean;
          is_duplicate?: boolean;
          visible_to_roles?: string[];
          auto_sync?: boolean;
          sync_fields?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_deal_flow_views_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_deal_flow_views_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "web_flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_deal_flow_views_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "web_flow_stages";
            referencedColumns: ["id"];
          }
        ];
      };

      web_flow_automations: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          source_flow_id: string;
          source_stage_id: string;
          target_flow_id: string;
          target_stage_id: string;
          automation_type: "duplicate" | "move" | "copy";
          trigger_condition: "stage_change" | "field_update" | "time_based";
          conditions: Json;
          actions: Json;
          visible_to_roles: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          source_flow_id: string;
          source_stage_id: string;
          target_flow_id: string;
          target_stage_id: string;
          automation_type?: "duplicate" | "move" | "copy";
          trigger_condition?: "stage_change" | "field_update" | "time_based";
          conditions?: Json;
          actions?: Json;
          visible_to_roles?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          source_flow_id?: string;
          source_stage_id?: string;
          target_flow_id?: string;
          target_stage_id?: string;
          automation_type?: "duplicate" | "move" | "copy";
          trigger_condition?: "stage_change" | "field_update" | "time_based";
          conditions?: Json;
          actions?: Json;
          visible_to_roles?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_flow_automations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_flow_automations_source_flow_id_fkey";
            columns: ["source_flow_id"];
            isOneToOne: false;
            referencedRelation: "web_flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_flow_automations_source_stage_id_fkey";
            columns: ["source_stage_id"];
            isOneToOne: false;
            referencedRelation: "web_flow_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_flow_automations_target_flow_id_fkey";
            columns: ["target_flow_id"];
            isOneToOne: false;
            referencedRelation: "web_flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_flow_automations_target_stage_id_fkey";
            columns: ["target_stage_id"];
            isOneToOne: false;
            referencedRelation: "web_flow_stages";
            referencedColumns: ["id"];
          }
        ];
      };

      web_flow_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          is_system_template: boolean;
          template_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string;
          is_system_template?: boolean;
          template_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          is_system_template?: boolean;
          template_data?: Json;
          created_at?: string;
        };
        Relationships: [];
      };

      web_flow_role_configs: {
        Row: {
          id: string;
          client_id: string;
          flow_id: string;
          user_role: string;
          can_view_all_stages: boolean;
          visible_stages: string[];
          can_edit_deals: boolean;
          can_move_deals: boolean;
          can_create_deals: boolean;
          auto_duplicate_to_flows: string[];
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          flow_id: string;
          user_role: string;
          can_view_all_stages?: boolean;
          visible_stages?: string[];
          can_edit_deals?: boolean;
          can_move_deals?: boolean;
          can_create_deals?: boolean;
          auto_duplicate_to_flows?: string[];
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          flow_id?: string;
          user_role?: string;
          can_view_all_stages?: boolean;
          visible_stages?: string[];
          can_edit_deals?: boolean;
          can_move_deals?: boolean;
          can_create_deals?: boolean;
          auto_duplicate_to_flows?: string[];
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "web_flow_role_configs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "web_flow_role_configs_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "web_flows";
            referencedColumns: ["id"];
          }
        ];
      };

      // AIDEV-NOTE: Sistema modular implementado - usuário pode criar flows personalizados
      // com automações de duplicação configuráveis entre etapas

      // =====================================================
      // CONTACTS TABLE
      // =====================================================

      contacts: {
        Row: {
          id: string;
          client_id: string;
          client_name: string | null;
          main_contact: string | null;
          phone_numbers: string[] | null;
          company_names: string[] | null;
          tax_ids: string[] | null;
          assigned_team_id: string | null;
          avatar_type: string | null;
          avatar_seed: string | null;
          created_at: string;
          updated_at: string;
          indicated_by: string | null;
          contact_type: "cliente" | "parceiro" | "outro" | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_name?: string | null;
          main_contact?: string | null;
          phone_numbers?: string[] | null;
          company_names?: string[] | null;
          tax_ids?: string[] | null;
          assigned_team_id?: string | null;
          avatar_type?: string | null;
          avatar_seed?: string | null;
          created_at?: string;
          updated_at?: string;
          indicated_by?: string | null;
          contact_type?: "cliente" | "parceiro" | "outro" | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_name?: string | null;
          main_contact?: string | null;
          phone_numbers?: string[] | null;
          company_names?: string[] | null;
          tax_ids?: string[] | null;
          assigned_team_id?: string | null;
          avatar_type?: string | null;
          avatar_seed?: string | null;
          created_at?: string;
          updated_at?: string;
          indicated_by?: string | null;
          contact_type?: "cliente" | "parceiro" | "outro" | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };

      // =====================================================
      // CONTACT RELATIONSHIPS (ETAPA C)
      // =====================================================

      contact_companies: {
        Row: {
          id: string;
          contact_id: string;
          company_id: string;
          role: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
          client_id: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          company_id: string;
          role?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
          client_id: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          company_id?: string;
          role?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
          client_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_companies_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_companies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "web_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_companies_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };

      contact_indications: {
        Row: {
          id: string;
          contact_id: string;
          indicated_by_contact_id: string;
          card_id: string | null;
          commission_amount: number | null;
          commission_percentage: number | null;
          indication_date: string;
          notes: string | null;
          status: "pending" | "confirmed" | "paid" | "cancelled";
          created_at: string;
          updated_at: string;
          client_id: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          indicated_by_contact_id: string;
          card_id?: string | null;
          commission_amount?: number | null;
          commission_percentage?: number | null;
          indication_date?: string;
          notes?: string | null;
          status?: "pending" | "confirmed" | "paid" | "cancelled";
          created_at?: string;
          updated_at?: string;
          client_id: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          indicated_by_contact_id?: string;
          card_id?: string | null;
          commission_amount?: number | null;
          commission_percentage?: number | null;
          indication_date?: string;
          notes?: string | null;
          status?: "pending" | "confirmed" | "paid" | "cancelled";
          created_at?: string;
          updated_at?: string;
          client_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_indications_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_indications_indicated_by_contact_id_fkey";
            columns: ["indicated_by_contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_indications_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_indications_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };

      card_history: {
        Row: {
          id: string;
          card_id: string;
          client_id: string;
          from_step_id: string | null;
          to_step_id: string | null;
          created_by: string | null;
          created_at: string;
          action_type: string | null;
          details: Json | null;
          movement_direction: "forward" | "backward" | "same" | null;
          from_step_position: number | null;
          to_step_position: number | null;
        };
        Insert: {
          id?: string;
          card_id: string;
          client_id: string;
          from_step_id?: string | null;
          to_step_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          action_type?: string | null;
          details?: Json | null;
          movement_direction?: "forward" | "backward" | "same" | null;
          from_step_position?: number | null;
          to_step_position?: number | null;
        };
        Update: {
          id?: string;
          card_id?: string;
          client_id?: string;
          from_step_id?: string | null;
          to_step_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          action_type?: string | null;
          details?: Json | null;
          movement_direction?: "forward" | "backward" | "same" | null;
          from_step_position?: number | null;
          to_step_position?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "card_history_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "card_history_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "core_clients";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // AIDEV-NOTE: Funções de entidades dinâmicas removidas - sistema simplificado
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
