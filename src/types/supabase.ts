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
      administrators: {
        Row: {
          id: string
          auth_user_id: string
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      collaborators: {
        Row: {
          id: string
          auth_user_id: string
          client_id: string
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          client_id: string
          name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          client_id?: string
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          razao_social: string | null
          cnpj: string | null
          description: string | null
          categoria: string | null
          origem: string | null
          logo_url: string | null
          email: string | null
          telefone: string | null
          celular: string | null
          whatsapp: string | null
          website: string | null
          cep: string | null
          pais: string
          state_id: string | null
          city_id: string | null
          bairro: string | null
          rua: string | null
          numero: string | null
          complemento: string | null
          created_at: string
          updated_at: string
          client_id: string
          city?: {
            name: string
          } | null
          state?: {
            name: string
          } | null
        }
        Insert: {
          id?: string
          name: string
          razao_social?: string | null
          cnpj?: string | null
          description?: string | null
          categoria?: string | null
          origem?: string | null
          logo_url?: string | null
          email?: string | null
          telefone?: string | null
          celular?: string | null
          whatsapp?: string | null
          website?: string | null
          cep?: string | null
          pais?: string
          state_id?: string | null
          city_id?: string | null
          bairro?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          created_at?: string
          updated_at?: string
          client_id: string
        }
        Update: {
          id?: string
          name?: string
          razao_social?: string | null
          cnpj?: string | null
          description?: string | null
          categoria?: string | null
          origem?: string | null
          logo_url?: string | null
          email?: string | null
          telefone?: string | null
          celular?: string | null
          whatsapp?: string | null
          website?: string | null
          cep?: string | null
          pais?: string
          state_id?: string | null
          city_id?: string | null
          bairro?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          created_at?: string
          updated_at?: string
          client_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          }
        ]
      }
      company_people: {
        Row: {
          id: string
          company_id: string
          person_id: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          person_id: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          person_id?: string
          created_at?: string
        }
      }
      people: {
        Row: {
          id: string
          client_id: string
          name: string
          email: string | null
          whatsapp: string | null
          telefone: string | null
          celular: string | null
          cargo: string | null
          cpf: string | null
          categoria: string | null
          description: string | null
          aniversario: string | null
          cep: string | null
          pais: string | null
          estado: string | null
          cidade: string | null
          bairro: string | null
          rua: string | null
          numero: string | null
          complemento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          email?: string | null
          whatsapp?: string | null
          telefone?: string | null
          celular?: string | null
          cargo?: string | null
          cpf?: string | null
          categoria?: string | null
          description?: string | null
          aniversario?: string | null
          cep?: string | null
          pais?: string | null
          estado?: string | null
          cidade?: string | null
          bairro?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          email?: string | null
          whatsapp?: string | null
          telefone?: string | null
          celular?: string | null
          cargo?: string | null
          cpf?: string | null
          categoria?: string | null
          description?: string | null
          aniversario?: string | null
          cep?: string | null
          pais?: string | null
          estado?: string | null
          cidade?: string | null
          bairro?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          title: string
          description: string | null
          company_id: string | null
          stage_id: string | null
          responsible_id: string | null
          value: number | null
          expected_close_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          company_id?: string | null
          stage_id?: string | null
          responsible_id?: string | null
          value?: number | null
          expected_close_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          company_id?: string | null
          stage_id?: string | null
          responsible_id?: string | null
          value?: number | null
          expected_close_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      funnels: {
        Row: {
          id: string
          name: string
          description: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      funnel_stages: {
        Row: {
          id: string
          funnel_id: string
          name: string
          description: string | null
          color: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          funnel_id: string
          name: string
          description?: string | null
          color?: string | null
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          funnel_id?: string
          name?: string
          description?: string | null
          color?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
