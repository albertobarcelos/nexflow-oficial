export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_agents_nfts: {
        Row: {
          agent_id: string
          client_id: string
          earned_at: string | null
          id: string
          nft_id: string
        }
        Insert: {
          agent_id: string
          client_id: string
          earned_at?: string | null
          id?: string
          nft_id: string
        }
        Update: {
          agent_id?: string
          client_id?: string
          earned_at?: string | null
          id?: string
          nft_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_nfts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "agents_nfts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_nfts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "agents_nfts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_nfts_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "app_partner_nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_itens_compra: {
        Row: {
          categoria_id: string | null
          compra_id: string
          id: string
          preco_pontos_item: number
          produto_id: string
          quantidade: number
        }
        Insert: {
          categoria_id?: string | null
          compra_id: string
          id?: string
          preco_pontos_item: number
          produto_id: string
          quantidade: number
        }
        Update: {
          categoria_id?: string | null
          compra_id?: string
          id?: string
          preco_pontos_item?: number
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_compra_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_partner_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_compra_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "app_partner_shopping"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_compra_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "app_store_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      app_missions: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          frequency: string
          ht_reward: number | null
          id: string
          name: string
          nft_reward_id: string | null
          required_level: string
          target_count: number
          type: string
          xp_reward: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          frequency?: string
          ht_reward?: number | null
          id?: string
          name: string
          nft_reward_id?: string | null
          required_level?: string
          target_count?: number
          type: string
          xp_reward?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          frequency?: string
          ht_reward?: number | null
          id?: string
          name?: string
          nft_reward_id?: string | null
          required_level?: string
          target_count?: number
          type?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_nft_reward_id_fkey"
            columns: ["nft_reward_id"]
            isOneToOne: false
            referencedRelation: "app_partner_nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_movimentacoes_pontos: {
        Row: {
          data: string | null
          descricao: string | null
          id: string
          partner_id: string
          tipo: string
          valor: number
        }
        Insert: {
          data?: string | null
          descricao?: string | null
          id?: string
          partner_id: string
          tipo: string
          valor: number
        }
        Update: {
          data?: string | null
          descricao?: string | null
          id?: string
          partner_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_pontos_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
      app_news_updates: {
        Row: {
          background_image_url: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          link: string | null
          title: string
        }
        Insert: {
          background_image_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          title: string
        }
        Update: {
          background_image_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          title?: string
        }
        Relationships: []
      }
      app_partner_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      app_partner_earned_badges: {
        Row: {
          badge_id: string
          client_id: string
          created_at: string | null
          earned_at: string | null
          id: string
          partner_id: string
          updated_at: string | null
        }
        Insert: {
          badge_id: string
          client_id: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          partner_id: string
          updated_at?: string | null
        }
        Update: {
          badge_id?: string
          client_id?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          partner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_earned_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "partners_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_earned_badges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_earned_badges_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
      app_partner_levels: {
        Row: {
          benefits: string | null
          client_id: string
          color: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          index_level: number | null
          max_xp: number | null
          min_xp: number
          name: string
          updated_at: string | null
        }
        Insert: {
          benefits?: string | null
          client_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          index_level?: number | null
          max_xp?: number | null
          min_xp: number
          name: string
          updated_at?: string | null
        }
        Update: {
          benefits?: string | null
          client_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          index_level?: number | null
          max_xp?: number | null
          min_xp?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_levels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      app_partner_mission_progress: {
        Row: {
          client_id: string | null
          completed: boolean
          id: string
          mission_id: string
          people_id: string
          period_end: string
          period_start: string
          progress_count: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          completed?: boolean
          id?: string
          mission_id: string
          people_id: string
          period_end: string
          period_start: string
          progress_count?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          completed?: boolean
          id?: string
          mission_id?: string
          people_id?: string
          period_end?: string
          period_start?: string
          progress_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_progress_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "app_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_progress_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "mission_progress_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_progress_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      app_partner_nfts: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          effect: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          effect?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          effect?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_nfts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      app_partner_notification: {
        Row: {
          criada_em: string | null
          id: string
          lida: boolean | null
          mensagem: string
          partner_id: string
          tipo: string
        }
        Insert: {
          criada_em?: string | null
          id?: string
          lida?: boolean | null
          mensagem: string
          partner_id: string
          tipo: string
        }
        Update: {
          criada_em?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string
          partner_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
      app_partner_points_history: {
        Row: {
          balance: number
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          partner_id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          balance: number
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          partner_id: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          partner_id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_points_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_points_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
      app_partner_shopping: {
        Row: {
          cep: string
          cidade: string | null
          data_compra: string | null
          estado: string | null
          id: string
          padrao: boolean | null
          people_partner_id: string
          preco_pontos_total: number
          rua: string
          status: string
          telefone: string
        }
        Insert: {
          cep: string
          cidade?: string | null
          data_compra?: string | null
          estado?: string | null
          id?: string
          padrao?: boolean | null
          people_partner_id: string
          preco_pontos_total: number
          rua: string
          status: string
          telefone: string
        }
        Update: {
          cep?: string
          cidade?: string | null
          data_compra?: string | null
          estado?: string | null
          id?: string
          padrao?: boolean | null
          people_partner_id?: string
          preco_pontos_total?: number
          rua?: string
          status?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_cidade_fkey"
            columns: ["cidade"]
            isOneToOne: false
            referencedRelation: "web_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_estado_fkey"
            columns: ["estado"]
            isOneToOne: false
            referencedRelation: "web_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_shopping_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_shopping_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_shopping_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      app_partners: {
        Row: {
          cliente_id: string
          completed_missions: number | null
          created_at: string | null
          current_level: number | null
          ht: number | null
          id: string
          lifetime_xp: number | null
          people_id: string
          season_xp: number | null
        }
        Insert: {
          cliente_id: string
          completed_missions?: number | null
          created_at?: string | null
          current_level?: number | null
          ht?: number | null
          id?: string
          lifetime_xp?: number | null
          people_id: string
          season_xp?: number | null
        }
        Update: {
          cliente_id?: string
          completed_missions?: number | null
          created_at?: string | null
          current_level?: number | null
          ht?: number | null
          id?: string
          lifetime_xp?: number | null
          people_id?: string
          season_xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "people_partners_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_partners_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
      app_public_partner_profiles: {
        Row: {
          badges: string[] | null
          city: string | null
          completed_missions: number | null
          general_ranking_position: number | null
          instagram: string | null
          level: number
          linkedin: string | null
          name: string
          partner_id: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          badges?: string[] | null
          city?: string | null
          completed_missions?: number | null
          general_ranking_position?: number | null
          instagram?: string | null
          level: number
          linkedin?: string | null
          name: string
          partner_id: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          badges?: string[] | null
          city?: string | null
          completed_missions?: number | null
          general_ranking_position?: number | null
          instagram?: string | null
          level?: number
          linkedin?: string | null
          name?: string
          partner_id?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_partner_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "public_partner_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_partner_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      app_purchases_history: {
        Row: {
          client_id: string
          id: string
          people_partner_id: string
          purchased_at: string | null
          quantity: number
          store_item_id: string
          total_spent_ht: number
        }
        Insert: {
          client_id: string
          id?: string
          people_partner_id: string
          purchased_at?: string | null
          quantity?: number
          store_item_id: string
          total_spent_ht: number
        }
        Update: {
          client_id?: string
          id?: string
          people_partner_id?: string
          purchased_at?: string | null
          quantity?: number
          store_item_id?: string
          total_spent_ht?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_purchases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_purchases_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "store_purchases_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_purchases_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      app_season_progress: {
        Row: {
          agent_id: string
          client_id: string
          created_at: string | null
          id: string
          participation: number | null
          season_name: string
        }
        Insert: {
          agent_id: string
          client_id: string
          created_at?: string | null
          id?: string
          participation?: number | null
          season_name: string
        }
        Update: {
          agent_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          participation?: number | null
          season_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_progress_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "season_progress_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_progress_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "season_progress_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      app_store_itens: {
        Row: {
          categoria_id: string | null
          client_id: string | null
          description_product: string | null
          id: string
          imagem_url: string | null
          price_ht: number
          product_name: string
          product_stock: number | null
        }
        Insert: {
          categoria_id?: string | null
          client_id?: string | null
          description_product?: string | null
          id?: string
          imagem_url?: string | null
          price_ht: number
          product_name: string
          product_stock?: number | null
        }
        Update: {
          categoria_id?: string | null
          client_id?: string | null
          description_product?: string | null
          id?: string
          imagem_url?: string | null
          price_ht?: number
          product_name?: string
          product_stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_partner_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_itens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      app_training_video_views: {
        Row: {
          id: number
          people_partner_id: string
          video_id: number
          watched_at: string | null
        }
        Insert: {
          id?: number
          people_partner_id: string
          video_id: number
          watched_at?: string | null
        }
        Update: {
          id?: number
          people_partner_id?: string
          video_id?: number
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_video_views_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "training_video_views_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_video_views_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "training_video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "app_training_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      app_training_videos: {
        Row: {
          category: Database["public"]["Enums"]["video_category"]
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: number
          length_seconds: number
          subcategory: Database["public"]["Enums"]["video_subcategory"]
          title: string
          updated_at: string | null
          video_content: string | null
          video_url: string | null
          xp_reward: number
        }
        Insert: {
          category: Database["public"]["Enums"]["video_category"]
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          length_seconds: number
          subcategory: Database["public"]["Enums"]["video_subcategory"]
          title: string
          updated_at?: string | null
          video_content?: string | null
          video_url?: string | null
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["video_category"]
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          length_seconds?: number
          subcategory?: Database["public"]["Enums"]["video_subcategory"]
          title?: string
          updated_at?: string | null
          video_content?: string | null
          video_url?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      card_activities: {
        Row: {
          activity_type_id: string
          assignee_id: string | null
          card_id: string
          client_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          creator_id: string
          description: string | null
          end_at: string
          id: string
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          activity_type_id: string
          assignee_id?: string | null
          card_id: string
          client_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          end_at: string
          id?: string
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          activity_type_id?: string
          assignee_id?: string | null
          card_id?: string
          client_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          end_at?: string
          id?: string
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_activities_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "flow_activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_activities_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_activities_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "card_activities_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_activities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_activities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      card_attachments: {
        Row: {
          card_id: string
          client_id: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          card_id: string
          client_id: string
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string
          client_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_attachments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      card_contacts: {
        Row: {
          card_id: string
          client_id: string
          contact_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          card_id: string
          client_id: string
          contact_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          card_id?: string
          client_id?: string
          contact_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_contacts_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      card_history: {
        Row: {
          action_type: string
          activity_id: string | null
          card_id: string
          client_id: string
          created_at: string | null
          created_by: string | null
          details: Json | null
          duration_seconds: number | null
          event_type: string | null
          field_id: string | null
          from_step_id: string | null
          from_step_position: number | null
          id: string
          movement_direction: string | null
          new_value: Json | null
          previous_value: Json | null
          step_id: string | null
          to_step_id: string | null
          to_step_position: number | null
        }
        Insert: {
          action_type?: string
          activity_id?: string | null
          card_id: string
          client_id: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          duration_seconds?: number | null
          event_type?: string | null
          field_id?: string | null
          from_step_id?: string | null
          from_step_position?: number | null
          id?: string
          movement_direction?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          step_id?: string | null
          to_step_id?: string | null
          to_step_position?: number | null
        }
        Update: {
          action_type?: string
          activity_id?: string | null
          card_id?: string
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          duration_seconds?: number | null
          event_type?: string | null
          field_id?: string | null
          from_step_id?: string | null
          from_step_position?: number | null
          id?: string
          movement_direction?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          step_id?: string | null
          to_step_id?: string | null
          to_step_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_history_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "card_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_history_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "step_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_history_from_step_id_fkey"
            columns: ["from_step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_history_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_history_to_step_id_fkey"
            columns: ["to_step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      card_items: {
        Row: {
          card_id: string
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          installment_number: number | null
          item_code: string | null
          item_id: string | null
          item_name: string
          quantity: number | null
          total_installments: number | null
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          card_id: string
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          installment_number?: number | null
          item_code?: string | null
          item_id?: string | null
          item_name: string
          quantity?: number | null
          total_installments?: number | null
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          installment_number?: number | null
          item_code?: string | null
          item_id?: string | null
          item_name?: string
          quantity?: number | null
          total_installments?: number | null
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "web_items"
            referencedColumns: ["id"]
          },
        ]
      }
      card_message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "card_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      card_messages: {
        Row: {
          card_id: string
          client_id: string
          content: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          mentions: string[] | null
          message_type: string
          reply_to_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          client_id: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          mentions?: string[] | null
          message_type: string
          reply_to_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          client_id?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          mentions?: string[] | null
          message_type?: string
          reply_to_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_messages_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "card_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      card_step_actions: {
        Row: {
          card_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          execution_data: Json | null
          id: string
          notes: string | null
          scheduled_date: string | null
          status: string
          step_action_id: string
          step_id: string
          updated_at: string
        }
        Insert: {
          card_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          execution_data?: Json | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          step_action_id: string
          step_id: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          execution_data?: Json | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          step_action_id?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_step_actions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_step_actions_step_action_id_fkey"
            columns: ["step_action_id"]
            isOneToOne: false
            referencedRelation: "step_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_step_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      card_step_values: {
        Row: {
          card_id: string
          client_id: string
          created_at: string
          field_values: Json
          id: string
          step_id: string
          updated_at: string
        }
        Insert: {
          card_id: string
          client_id: string
          created_at?: string
          field_values?: Json
          id?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          client_id?: string
          created_at?: string
          field_values?: Json
          id?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_step_values_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_step_values_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_step_values_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      card_tags: {
        Row: {
          assigned_at: string | null
          card_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string | null
          card_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string | null
          card_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_tags_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "flow_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          action_execution_data: Json | null
          agents: string[] | null
          assigned_team_id: string | null
          assigned_to: string | null
          card_type: Database["public"]["Enums"]["card_type_enum"] | null
          checklist_progress: Json | null
          client_id: string
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          field_values: Json | null
          flow_id: string
          id: string
          indicated_by: string | null
          indication_id: string | null
          lead: string | null
          movement_history: Json | null
          parent_card_id: string | null
          position: number | null
          product: string | null
          status: Database["public"]["Enums"]["card_stats"] | null
          step_id: string
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          action_execution_data?: Json | null
          agents?: string[] | null
          assigned_team_id?: string | null
          assigned_to?: string | null
          card_type?: Database["public"]["Enums"]["card_type_enum"] | null
          checklist_progress?: Json | null
          client_id: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          field_values?: Json | null
          flow_id: string
          id?: string
          indicated_by?: string | null
          indication_id?: string | null
          lead?: string | null
          movement_history?: Json | null
          parent_card_id?: string | null
          position?: number | null
          product?: string | null
          status?: Database["public"]["Enums"]["card_stats"] | null
          step_id: string
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          action_execution_data?: Json | null
          agents?: string[] | null
          assigned_team_id?: string | null
          assigned_to?: string | null
          card_type?: Database["public"]["Enums"]["card_type_enum"] | null
          checklist_progress?: Json | null
          client_id?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          field_values?: Json | null
          flow_id?: string
          id?: string
          indicated_by?: string | null
          indication_id?: string | null
          lead?: string | null
          movement_history?: Json | null
          parent_card_id?: string | null
          position?: number | null
          product?: string | null
          status?: Database["public"]["Enums"]["card_stats"] | null
          step_id?: string
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_indicated_by_fkey"
            columns: ["indicated_by"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_indication_id_fkey"
            columns: ["indication_id"]
            isOneToOne: false
            referencedRelation: "core_indications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_parent_card_id_fkey"
            columns: ["parent_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_automations: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          target_flow_id: string
          target_step_id: string
          trigger_conditions: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          target_flow_id: string
          target_step_id: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          target_flow_id?: string
          target_step_id?: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_automations_target_flow_id_fkey"
            columns: ["target_flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_automations_target_step_id_fkey"
            columns: ["target_step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_companies: {
        Row: {
          client_id: string
          company_id: string
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          company_id: string
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          company_id?: string
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_companies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_companies_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_indications: {
        Row: {
          card_id: string | null
          client_id: string
          commission_amount: number | null
          commission_percentage: number | null
          contact_id: string
          created_at: string | null
          id: string
          indicated_by_contact_id: string
          indication_date: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          card_id?: string | null
          client_id: string
          commission_amount?: number | null
          commission_percentage?: number | null
          contact_id: string
          created_at?: string | null
          id?: string
          indicated_by_contact_id: string
          indication_date?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          card_id?: string | null
          client_id?: string
          commission_amount?: number | null
          commission_percentage?: number | null
          contact_id?: string
          created_at?: string | null
          id?: string
          indicated_by_contact_id?: string
          indication_date?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_indications_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_indications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_indications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_indications_indicated_by_contact_id_fkey"
            columns: ["indicated_by_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_team_id: string | null
          avatar_seed: string | null
          avatar_type: string | null
          client_id: string
          client_name: string
          company_names: string[] | null
          contact_type: string[] | null
          created_at: string | null
          id: string
          indicated_by: string | null
          main_contact: string
          phone_numbers: string[] | null
          related_card_ids: string[] | null
          tax_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_team_id?: string | null
          avatar_seed?: string | null
          avatar_type?: string | null
          client_id: string
          client_name: string
          company_names?: string[] | null
          contact_type?: string[] | null
          created_at?: string | null
          id?: string
          indicated_by?: string | null
          main_contact: string
          phone_numbers?: string[] | null
          related_card_ids?: string[] | null
          tax_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_team_id?: string | null
          avatar_seed?: string | null
          avatar_type?: string | null
          client_id?: string
          client_name?: string
          company_names?: string[] | null
          contact_type?: string[] | null
          created_at?: string | null
          id?: string
          indicated_by?: string | null
          main_contact?: string
          phone_numbers?: string[] | null
          related_card_ids?: string[] | null
          tax_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_indicated_by_fkey"
            columns: ["indicated_by"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      core_client_license: {
        Row: {
          can_use_nexhunters: boolean | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          client_id: string
          created_at: string
          currency: string | null
          expiration_date: string
          id: string
          last_payment_date: string | null
          license_id: string | null
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
          can_use_nexhunters?: boolean | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          client_id: string
          created_at?: string
          currency?: string | null
          expiration_date: string
          id?: string
          last_payment_date?: string | null
          license_id?: string | null
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
          can_use_nexhunters?: boolean | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          client_id?: string
          created_at?: string
          currency?: string | null
          expiration_date?: string
          id?: string
          last_payment_date?: string | null
          license_id?: string | null
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
            foreignKeyName: "core_client_license_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "core_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      core_client_user_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used_at: string | null
          user_profile_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used_at?: string | null
          user_profile_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used_at?: string | null
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexflow_user_invites_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexflow_user_invites_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      core_client_users: {
        Row: {
          avatar_seed: string | null
          avatar_type: string | null
          avatar_url: string | null
          birth_date: string | null
          client_id: string
          company_id: string | null
          created_at: string
          custom_avatar_url: string | null
          description: string | null
          display_name: string | null
          email: string
          id: string
          instagram: string | null
          is_active: boolean
          last_login_at: string | null
          linkedin: string | null
          name: string | null
          people_type: Database["public"]["Enums"]["people_tag_type"] | null
          phone: string | null
          region_id: string | null
          role: Database["public"]["Enums"]["collaborator_role"] | null
          status: string | null
          surname: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_seed?: string | null
          avatar_type?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          client_id: string
          company_id?: string | null
          created_at?: string
          custom_avatar_url?: string | null
          description?: string | null
          display_name?: string | null
          email: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          last_login_at?: string | null
          linkedin?: string | null
          name?: string | null
          people_type?: Database["public"]["Enums"]["people_tag_type"] | null
          phone?: string | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["collaborator_role"] | null
          status?: string | null
          surname?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_seed?: string | null
          avatar_type?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          client_id?: string
          company_id?: string | null
          created_at?: string
          custom_avatar_url?: string | null
          description?: string | null
          display_name?: string | null
          email?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          last_login_at?: string | null
          linkedin?: string | null
          name?: string | null
          people_type?: Database["public"]["Enums"]["people_tag_type"] | null
          phone?: string | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["collaborator_role"] | null
          status?: string | null
          surname?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      core_clients: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          country: string | null
          cpf_cnpj: string
          created_at: string
          documents: Json | null
          email: string
          history: Json | null
          id: string
          isHunting: boolean | null
          license_id: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          reseller_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_name?: string | null
          country?: string | null
          cpf_cnpj: string
          created_at?: string
          documents?: Json | null
          email: string
          history?: Json | null
          id?: string
          isHunting?: boolean | null
          license_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          reseller_id?: string | null
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
          cpf_cnpj?: string
          created_at?: string
          documents?: Json | null
          email?: string
          history?: Json | null
          id?: string
          isHunting?: boolean | null
          license_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          reseller_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_clients_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "core_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_clients_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "core_resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      core_commission_calculations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          card_id: string
          card_item_id: string | null
          client_id: string
          created_at: string | null
          id: string
          item_code: string | null
          notes: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_date: string | null
          payment_id: string | null
          status: string | null
          team_commission_amount: number
          team_commission_type: string
          team_commission_value: number
          team_id: string
          total_distributed_amount: number
          total_distributed_percentage: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          card_id: string
          card_item_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          item_code?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_id?: string | null
          status?: string | null
          team_commission_amount: number
          team_commission_type: string
          team_commission_value: number
          team_id: string
          total_distributed_amount?: number
          total_distributed_percentage?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          card_id?: string
          card_item_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          item_code?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_id?: string | null
          status?: string | null
          team_commission_amount?: number
          team_commission_type?: string
          team_commission_value?: number
          team_id?: string
          total_distributed_amount?: number
          total_distributed_percentage?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_commission_calculations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_calculations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "core_commission_calculations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_calculations_card_item_id_fkey"
            columns: ["card_item_id"]
            isOneToOne: false
            referencedRelation: "card_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_calculations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_calculations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "web_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_calculations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      core_commission_distributions: {
        Row: {
          calculation_id: string
          client_id: string
          created_at: string | null
          distribution_amount: number
          distribution_percentage: number
          id: string
          is_recurring_while_active: boolean | null
          item_type: string | null
          level_id: string | null
          member_role: Database["public"]["Enums"]["team_role_type"] | null
          notes: string | null
          paid_at: string | null
          recurring_month_number: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calculation_id: string
          client_id: string
          created_at?: string | null
          distribution_amount: number
          distribution_percentage: number
          id?: string
          is_recurring_while_active?: boolean | null
          item_type?: string | null
          level_id?: string | null
          member_role?: Database["public"]["Enums"]["team_role_type"] | null
          notes?: string | null
          paid_at?: string | null
          recurring_month_number?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calculation_id?: string
          client_id?: string
          created_at?: string | null
          distribution_amount?: number
          distribution_percentage?: number
          id?: string
          is_recurring_while_active?: boolean | null
          item_type?: string | null
          level_id?: string | null
          member_role?: Database["public"]["Enums"]["team_role_type"] | null
          notes?: string | null
          paid_at?: string | null
          recurring_month_number?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_commission_distributions_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "core_commission_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_distributions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_distributions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "core_team_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_distributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_commission_distributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      core_forms: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          fields_config: Json
          id: string
          is_active: boolean | null
          settings: Json | null
          slug: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields_config?: Json
          id?: string
          is_active?: boolean | null
          settings?: Json | null
          slug?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields_config?: Json
          id?: string
          is_active?: boolean | null
          settings?: Json | null
          slug?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_forms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      core_franchises: {
        Row: {
          client_id: string
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_franchises_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      core_indications: {
        Row: {
          client_id: string
          cnpj_cpf: string | null
          created_at: string | null
          description: string | null
          hunter_id: string
          id: string
          indication_name: string | null
          phone: string | null
          related_card_ids: string[] | null
          responsible: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          cnpj_cpf?: string | null
          created_at?: string | null
          description?: string | null
          hunter_id: string
          id?: string
          indication_name?: string | null
          phone?: string | null
          related_card_ids?: string[] | null
          responsible?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          cnpj_cpf?: string | null
          created_at?: string | null
          description?: string | null
          hunter_id?: string
          id?: string
          indication_name?: string | null
          phone?: string | null
          related_card_ids?: string[] | null
          responsible?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_indications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      core_licenses: {
        Row: {
          can_create_flows: boolean | null
          can_export_data: boolean | null
          can_use_automations: boolean | null
          can_use_integrations: boolean | null
          can_use_nexflow: boolean | null
          created_at: string | null
          id: string
          name: string
          storage_limit_mb: number | null
          updated_at: string | null
          user_quantity: number
        }
        Insert: {
          can_create_flows?: boolean | null
          can_export_data?: boolean | null
          can_use_automations?: boolean | null
          can_use_integrations?: boolean | null
          can_use_nexflow?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          storage_limit_mb?: number | null
          updated_at?: string | null
          user_quantity: number
        }
        Update: {
          can_create_flows?: boolean | null
          can_export_data?: boolean | null
          can_use_automations?: boolean | null
          can_use_integrations?: boolean | null
          can_use_nexflow?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          storage_limit_mb?: number | null
          updated_at?: string | null
          user_quantity?: number
        }
        Relationships: []
      }
      core_reseller_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          reseller_id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          reseller_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          reseller_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_reseller_users_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "core_resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      core_resellers: {
        Row: {
          address: string | null
          city: string | null
          commission_percentage: number | null
          company_name: string
          country: string | null
          cpf_cnpj: string
          created_at: string
          documents: Json | null
          email: string
          id: string
          last_login_at: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          commission_percentage?: number | null
          company_name: string
          country?: string | null
          cpf_cnpj: string
          created_at?: string
          documents?: Json | null
          email: string
          id?: string
          last_login_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          commission_percentage?: number | null
          company_name?: string
          country?: string | null
          cpf_cnpj?: string
          created_at?: string
          documents?: Json | null
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      core_team_client_portfolio: {
        Row: {
          activated_at: string | null
          canceled_at: string | null
          card_id: string
          client_id: string
          client_status: string
          closed_at: string
          created_at: string | null
          id: string
          monthly_recurring_value: number | null
          notes: string | null
          team_id: string
          total_implantation_value: number | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          canceled_at?: string | null
          card_id: string
          client_id: string
          client_status?: string
          closed_at: string
          created_at?: string | null
          id?: string
          monthly_recurring_value?: number | null
          notes?: string | null
          team_id: string
          total_implantation_value?: number | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          canceled_at?: string | null
          card_id?: string
          client_id?: string
          client_status?: string
          closed_at?: string
          created_at?: string | null
          id?: string
          monthly_recurring_value?: number | null
          notes?: string | null
          team_id?: string
          total_implantation_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_team_client_portfolio_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_team_client_portfolio_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_team_client_portfolio_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      core_team_commissions: {
        Row: {
          client_id: string
          commission_type: string
          commission_value: number
          created_at: string | null
          description: string | null
          distribution_config: Json | null
          distribution_type: string | null
          id: string
          is_active: boolean | null
          item_code: string | null
          item_id: string | null
          recurring_max_months: number | null
          recurring_until_cancellation: boolean | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          commission_type: string
          commission_value: number
          created_at?: string | null
          description?: string | null
          distribution_config?: Json | null
          distribution_type?: string | null
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_id?: string | null
          recurring_max_months?: number | null
          recurring_until_cancellation?: boolean | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          description?: string | null
          distribution_config?: Json | null
          distribution_type?: string | null
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_id?: string | null
          recurring_max_months?: number | null
          recurring_until_cancellation?: boolean | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_team_commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_team_commissions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "web_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_team_commissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      core_team_levels: {
        Row: {
          client_id: string
          commission_implantation_percentage: number | null
          commission_one_time_percentage: number | null
          commission_percentage: number
          commission_recurring_percentage: number | null
          created_at: string | null
          demotion_criteria: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          level_order: number
          name: string
          promotion_criteria: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          commission_implantation_percentage?: number | null
          commission_one_time_percentage?: number | null
          commission_percentage: number
          commission_recurring_percentage?: number | null
          created_at?: string | null
          demotion_criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_order: number
          name: string
          promotion_criteria?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          commission_implantation_percentage?: number | null
          commission_one_time_percentage?: number | null
          commission_percentage?: number
          commission_recurring_percentage?: number | null
          created_at?: string | null
          demotion_criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_order?: number
          name?: string
          promotion_criteria?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_team_levels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      core_team_member_levels: {
        Row: {
          client_id: string
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          team_level_id: string
          team_member_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          team_level_id: string
          team_member_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          team_level_id?: string
          team_member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_team_member_levels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_team_member_levels_team_level_id_fkey"
            columns: ["team_level_id"]
            isOneToOne: false
            referencedRelation: "core_team_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_team_member_levels_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "core_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      core_team_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          division_percentage: number | null
          id: string
          role: Database["public"]["Enums"]["team_role_type"]
          team_id: string
          user_profile_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          division_percentage?: number | null
          id?: string
          role?: Database["public"]["Enums"]["team_role_type"]
          team_id: string
          user_profile_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          division_percentage?: number | null
          id?: string
          role?: Database["public"]["Enums"]["team_role_type"]
          team_id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_final_user_link"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_final_user_link"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      core_team_role_commissions: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          implantation_commission_type: string | null
          implantation_commission_value: number | null
          is_active: boolean | null
          recurring_commission_type: string
          recurring_commission_value: number | null
          recurring_duration_months: number | null
          recurring_while_active: boolean | null
          role: Database["public"]["Enums"]["team_role_type"]
          team_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          implantation_commission_type?: string | null
          implantation_commission_value?: number | null
          is_active?: boolean | null
          recurring_commission_type: string
          recurring_commission_value?: number | null
          recurring_duration_months?: number | null
          recurring_while_active?: boolean | null
          role: Database["public"]["Enums"]["team_role_type"]
          team_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          implantation_commission_type?: string | null
          implantation_commission_value?: number | null
          is_active?: boolean | null
          recurring_commission_type?: string
          recurring_commission_value?: number | null
          recurring_duration_months?: number | null
          recurring_while_active?: boolean | null
          role?: Database["public"]["Enums"]["team_role_type"]
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_team_role_commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_team_role_commissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      core_teams: {
        Row: {
          client_id: string
          created_at: string | null
          current_level_id: string | null
          default_commission_type: string | null
          default_commission_value: number | null
          description: string | null
          franchise_id: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          current_level_id?: string | null
          default_commission_type?: string | null
          default_commission_value?: number | null
          description?: string | null
          franchise_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          current_level_id?: string | null
          default_commission_type?: string | null
          default_commission_value?: number | null
          description?: string | null
          franchise_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_teams_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_teams_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "core_team_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_teams_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "core_franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_access: {
        Row: {
          flow_id: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          flow_id: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          flow_id?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_access_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_access_control: {
        Row: {
          created_at: string | null
          flow_id: string
          id: string
          permission_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flow_id: string
          id?: string
          permission_level: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          flow_id?: string
          id?: string
          permission_level?: string
          user_id?: string
        }
        Relationships: []
      }
      flow_activity_types: {
        Row: {
          active: boolean
          client_id: string
          color: string | null
          created_at: string
          flow_id: string
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_id: string
          color?: string | null
          created_at?: string
          flow_id: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_id?: string
          color?: string | null
          created_at?: string
          flow_id?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_activity_types_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_step_visibility: {
        Row: {
          created_at: string | null
          flow_id: string
          id: string
          is_visible: boolean | null
          step_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flow_id: string
          id?: string
          is_visible?: boolean | null
          step_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          flow_id?: string
          id?: string
          is_visible?: boolean | null
          step_id?: string
          user_id?: string
        }
        Relationships: []
      }
      flow_tags: {
        Row: {
          color: string
          created_at: string | null
          flow_id: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          flow_id: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          flow_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_tags_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_team_access: {
        Row: {
          created_at: string | null
          flow_id: string
          id: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          flow_id: string
          id?: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          flow_id?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_team_access_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_team_access_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_user_exclusions: {
        Row: {
          created_at: string | null
          flow_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flow_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          flow_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_user_exclusions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_user_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_user_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      flows: {
        Row: {
          category: Database["public"]["Enums"]["flow_category_enum"] | null
          client_id: string | null
          created_at: string | null
          description: string | null
          flow_identifier: string | null
          id: string
          is_active: boolean | null
          name: string
          owner_id: string | null
          visibility_type: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["flow_category_enum"] | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          flow_identifier?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_id?: string | null
          visibility_type?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["flow_category_enum"] | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          flow_identifier?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_id?: string | null
          visibility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      flows_legacy: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flows_client_id_fkey_legacy"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flows_created_by_fkey_legacy"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flows_created_by_fkey_legacy"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          card_id: string | null
          client_id: string
          created_at: string
          id: string
          message: string
          message_id: string | null
          metadata: Json | null
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          card_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          message: string
          message_id?: string | null
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          card_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          message?: string
          message_id?: string | null
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "card_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      partners_badges: {
        Row: {
          badge_type: string
          client_id: string
          color: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          people_partner_id: string | null
          points: number
          requirements: string | null
          updated_at: string | null
        }
        Insert: {
          badge_type: string
          client_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          people_partner_id?: string | null
          points?: number
          requirements?: string | null
          updated_at?: string | null
        }
        Update: {
          badge_type?: string
          client_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          people_partner_id?: string | null
          points?: number
          requirements?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_badges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_badges_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_global_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_badges_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "app_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_badges_people_partner_id_fkey"
            columns: ["people_partner_id"]
            isOneToOne: false
            referencedRelation: "web_level_ranking"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      public_opportunity_forms: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          fields_config: Json
          form_type: string | null
          id: string
          is_active: boolean | null
          requires_auth: boolean | null
          settings: Json | null
          slug: string
          title: string
          token: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields_config?: Json
          form_type?: string | null
          id?: string
          is_active?: boolean | null
          requires_auth?: boolean | null
          settings?: Json | null
          slug: string
          title: string
          token: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields_config?: Json
          form_type?: string | null
          id?: string
          is_active?: boolean | null
          requires_auth?: boolean | null
          settings?: Json | null
          slug?: string
          title?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_opportunity_forms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_opportunity_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_opportunity_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      revalya_integration_log: {
        Row: {
          card_id: string | null
          client_id: string
          created_at: string | null
          error_message: string | null
          id: string
          payment_id: string | null
          revalya_data: Json | null
          revalya_payment_id: string
          status: string
          sync_type: string
        }
        Insert: {
          card_id?: string | null
          client_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          payment_id?: string | null
          revalya_data?: Json | null
          revalya_payment_id: string
          status: string
          sync_type: string
        }
        Update: {
          card_id?: string | null
          client_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          payment_id?: string | null
          revalya_data?: Json | null
          revalya_payment_id?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "revalya_integration_log_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revalya_integration_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revalya_integration_log_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "web_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      step_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type_enum"]
          checklist_items: string[] | null
          created_at: string | null
          day_offset: number | null
          description: string | null
          id: string
          is_required: boolean | null
          position: number | null
          script_template: string | null
          settings: Json | null
          step_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type_enum"]
          checklist_items?: string[] | null
          created_at?: string | null
          day_offset?: number | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          position?: number | null
          script_template?: string | null
          settings?: Json | null
          step_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type_enum"]
          checklist_items?: string[] | null
          created_at?: string | null
          day_offset?: number | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          position?: number | null
          script_template?: string | null
          settings?: Json | null
          step_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "step_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      step_checklists: {
        Row: {
          content: string
          created_at: string | null
          id: string
          position: number | null
          step_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          position?: number | null
          step_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          position?: number | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_checklists_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      step_child_card_automations: {
        Row: {
          client_id: string
          copy_assignment: boolean | null
          copy_field_values: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          step_id: string
          target_flow_id: string
          target_step_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          copy_assignment?: boolean | null
          copy_field_values?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          step_id: string
          target_flow_id: string
          target_step_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          copy_assignment?: boolean | null
          copy_field_values?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          step_id?: string
          target_flow_id?: string
          target_step_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "step_child_card_automations_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_child_card_automations_target_flow_id_fkey"
            columns: ["target_flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_child_card_automations_target_step_id_fkey"
            columns: ["target_step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      step_fields: {
        Row: {
          configuration: Json | null
          created_at: string | null
          field_type: string
          id: string
          is_required: boolean | null
          label: string
          position: number | null
          slug: string | null
          step_id: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          field_type: string
          id?: string
          is_required?: boolean | null
          label: string
          position?: number | null
          slug?: string | null
          step_id: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          label?: string
          position?: number | null
          slug?: string | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_fields_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      step_team_access: {
        Row: {
          created_at: string | null
          id: string
          step_id: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          step_id: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          step_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_team_access_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_team_access_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      step_user_exclusions: {
        Row: {
          created_at: string | null
          id: string
          step_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          step_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_user_exclusions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_user_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_user_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      step_visibility: {
        Row: {
          can_edit_fields: boolean | null
          can_view: boolean | null
          id: string
          step_id: string
          user_id: string
        }
        Insert: {
          can_edit_fields?: boolean | null
          can_view?: boolean | null
          id?: string
          step_id: string
          user_id: string
        }
        Update: {
          can_edit_fields?: boolean | null
          can_view?: boolean | null
          id?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_visibility_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      steps: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type_enum"] | null
          color: string | null
          content_template: string | null
          created_at: string | null
          day_offset: number | null
          flow_id: string
          id: string
          is_completion_step: boolean | null
          position: number
          responsible_team_id: string | null
          responsible_user_id: string | null
          scheduled_time: string | null
          settings: Json | null
          step_type: Database["public"]["Enums"]["step_type_enum"]
          title: string
          visibility_type: string
        }
        Insert: {
          action_type?: Database["public"]["Enums"]["action_type_enum"] | null
          color?: string | null
          content_template?: string | null
          created_at?: string | null
          day_offset?: number | null
          flow_id: string
          id?: string
          is_completion_step?: boolean | null
          position?: number
          responsible_team_id?: string | null
          responsible_user_id?: string | null
          scheduled_time?: string | null
          settings?: Json | null
          step_type?: Database["public"]["Enums"]["step_type_enum"]
          title: string
          visibility_type?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type_enum"] | null
          color?: string | null
          content_template?: string | null
          created_at?: string | null
          day_offset?: number | null
          flow_id?: string
          id?: string
          is_completion_step?: boolean | null
          position?: number
          responsible_team_id?: string | null
          responsible_user_id?: string | null
          scheduled_time?: string | null
          settings?: Json | null
          step_type?: Database["public"]["Enums"]["step_type_enum"]
          title?: string
          visibility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "steps_responsible_team_id_fkey"
            columns: ["responsible_team_id"]
            isOneToOne: false
            referencedRelation: "core_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          client_id: string
          created_at: string
          email_notifications_enabled: boolean
          id: string
          notify_card_assigned: boolean
          notify_mentions: boolean
          notify_new_cards_in_stages: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          notify_card_assigned?: boolean
          notify_mentions?: boolean
          notify_new_cards_in_stages?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          notify_card_assigned?: boolean
          notify_mentions?: boolean
          notify_new_cards_in_stages?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_activity_types: {
        Row: {
          client_id: string
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_activity_types_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      web_audit_history: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      web_audit_log: {
        Row: {
          changed_fields: string[] | null
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          session_info: Json | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          session_info?: Json | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          session_info?: Json | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      web_cities: {
        Row: {
          created_at: string | null
          ibge_code: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ibge_code?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ibge_code?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "web_states"
            referencedColumns: ["id"]
          },
        ]
      }
      web_companies: {
        Row: {
          bairro: string | null
          categoria: string | null
          celular: string | null
          cep: string | null
          city_id: string | null
          client_id: string
          cnpj: string | null
          company_type: string
          complemento: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          logo_url: string | null
          name: string
          numero: string | null
          origem: string | null
          pais: string | null
          partner_id: string | null
          phone: string | null
          privacidade: string | null
          razao_social: string | null
          rua: string | null
          segment: string | null
          setor: string | null
          size: string | null
          skype: string | null
          state_id: string | null
          telefone: string | null
          twitter: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          bairro?: string | null
          categoria?: string | null
          celular?: string | null
          cep?: string | null
          city_id?: string | null
          client_id: string
          cnpj?: string | null
          company_type?: string
          complemento?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          name: string
          numero?: string | null
          origem?: string | null
          pais?: string | null
          partner_id?: string | null
          phone?: string | null
          privacidade?: string | null
          razao_social?: string | null
          rua?: string | null
          segment?: string | null
          setor?: string | null
          size?: string | null
          skype?: string | null
          state_id?: string | null
          telefone?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          bairro?: string | null
          categoria?: string | null
          celular?: string | null
          cep?: string | null
          city_id?: string | null
          client_id?: string
          cnpj?: string | null
          company_type?: string
          complemento?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          name?: string
          numero?: string | null
          origem?: string | null
          pais?: string | null
          partner_id?: string | null
          phone?: string | null
          privacidade?: string | null
          razao_social?: string | null
          rua?: string | null
          segment?: string | null
          setor?: string | null
          size?: string | null
          skype?: string | null
          state_id?: string | null
          telefone?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "web_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "companies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "web_states"
            referencedColumns: ["id"]
          },
        ]
      }
      web_company_people: {
        Row: {
          client_id: string
          company_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          person_id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          company_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          person_id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          person_id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_company_people_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_company_people_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_company_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
      web_deal_activities: {
        Row: {
          activity_type_id: string
          assigned_to: string | null
          attempts: number | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          deal_id: string
          description: string | null
          duration_minutes: number | null
          id: string
          metadata: Json | null
          notes: string | null
          scheduled_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          activity_type_id: string
          assigned_to?: string | null
          attempts?: number | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          deal_id: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          activity_type_id?: string
          assigned_to?: string | null
          attempts?: number | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          deal_id?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_deal_activities_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "web_activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_activities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_activities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web_deal_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web_deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      web_deal_custom_fields: {
        Row: {
          created_at: string | null
          deal_id: string
          field_slug: string
          field_value: Json | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          field_slug: string
          field_value?: Json | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          field_slug?: string
          field_value?: Json | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_deal_custom_fields_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      web_deal_flow_views: {
        Row: {
          auto_sync: boolean | null
          client_id: string
          created_at: string | null
          deal_id: string
          flow_id: string
          id: string
          is_primary: boolean | null
          stage_id: string
          updated_at: string | null
          visible_to_roles: string[] | null
        }
        Insert: {
          auto_sync?: boolean | null
          client_id: string
          created_at?: string | null
          deal_id: string
          flow_id: string
          id?: string
          is_primary?: boolean | null
          stage_id: string
          updated_at?: string | null
          visible_to_roles?: string[] | null
        }
        Update: {
          auto_sync?: boolean | null
          client_id?: string
          created_at?: string | null
          deal_id?: string
          flow_id?: string
          id?: string
          is_primary?: boolean | null
          stage_id?: string
          updated_at?: string | null
          visible_to_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "web_deal_flow_views_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_flow_views_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_flow_views_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "web_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_flow_views_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "web_flow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      web_deal_history: {
        Row: {
          client_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string
          details: Json | null
          id: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description: string
          details?: Json | null
          id?: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string
          details?: Json | null
          id?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      web_deal_participants: {
        Row: {
          client_id: string | null
          created_at: string | null
          deal_id: string
          id: string
          participant_role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deal_id: string
          id?: string
          participant_role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deal_id?: string
          id?: string
          participant_role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_deal_participants_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deal_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_deal_tags: {
        Row: {
          client_id: string
          created_at: string
          deal_id: string
          id: string
          tag_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deal_id: string
          id?: string
          tag_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deal_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_tags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tags_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "web_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      web_deals: {
        Row: {
          category_id: string | null
          client_id: string
          company_id: string | null
          created_at: string
          description: string | null
          entity_type: string | null
          expected_close_date: string | null
          flow_id: string | null
          id: string
          last_activity: string | null
          notes: string | null
          origin_id: string | null
          origin_name: string | null
          person_id: string | null
          position: number
          probability: number | null
          responsible_id: string | null
          responsible_name: string | null
          stage_id: string | null
          tags: string[] | null
          temperature: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          category_id?: string | null
          client_id: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_type?: string | null
          expected_close_date?: string | null
          flow_id?: string | null
          id?: string
          last_activity?: string | null
          notes?: string | null
          origin_id?: string | null
          origin_name?: string | null
          person_id?: string | null
          position?: number
          probability?: number | null
          responsible_id?: string | null
          responsible_name?: string | null
          stage_id?: string | null
          tags?: string[] | null
          temperature?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          category_id?: string | null
          client_id?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_type?: string | null
          expected_close_date?: string | null
          flow_id?: string | null
          id?: string
          last_activity?: string | null
          notes?: string | null
          origin_id?: string | null
          origin_name?: string | null
          person_id?: string | null
          position?: number
          probability?: number | null
          responsible_id?: string | null
          responsible_name?: string | null
          stage_id?: string | null
          tags?: string[] | null
          temperature?: string | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_web_deals_flow_id"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "web_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_web_deals_stage_id"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "web_flow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deals_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deals_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_deals_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_deals_people: {
        Row: {
          client_id: string | null
          created_at: string | null
          deal_id: string
          deal_people_type:
            | Database["public"]["Enums"]["people_tag_type"]
            | null
          id: string
          people_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deal_id: string
          deal_people_type?:
            | Database["public"]["Enums"]["people_tag_type"]
            | null
          id?: string
          people_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deal_id?: string
          deal_people_type?:
            | Database["public"]["Enums"]["people_tag_type"]
            | null
          id?: string
          people_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_people_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_people_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_people_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
      web_flow_automations: {
        Row: {
          action_type: string
          client_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notification_settings: Json | null
          preserve_original: boolean | null
          source_flow_id: string
          source_stage_id: string | null
          sync_changes: boolean | null
          target_flow_id: string
          target_stage_id: string
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string | null
          visible_to_roles: string[] | null
        }
        Insert: {
          action_type: string
          client_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_settings?: Json | null
          preserve_original?: boolean | null
          source_flow_id: string
          source_stage_id?: string | null
          sync_changes?: boolean | null
          target_flow_id: string
          target_stage_id: string
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string | null
          visible_to_roles?: string[] | null
        }
        Update: {
          action_type?: string
          client_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_settings?: Json | null
          preserve_original?: boolean | null
          source_flow_id?: string
          source_stage_id?: string | null
          sync_changes?: boolean | null
          target_flow_id?: string
          target_stage_id?: string
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string | null
          visible_to_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "web_flow_automations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flow_automations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flow_automations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web_flow_automations_source_flow_id_fkey"
            columns: ["source_flow_id"]
            isOneToOne: false
            referencedRelation: "web_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flow_automations_source_stage_id_fkey"
            columns: ["source_stage_id"]
            isOneToOne: false
            referencedRelation: "web_flow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flow_automations_target_flow_id_fkey"
            columns: ["target_flow_id"]
            isOneToOne: false
            referencedRelation: "web_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flow_automations_target_stage_id_fkey"
            columns: ["target_stage_id"]
            isOneToOne: false
            referencedRelation: "web_flow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      web_flow_stages: {
        Row: {
          client_id: string
          color: string | null
          created_at: string | null
          description: string | null
          flow_id: string
          id: string
          name: string
          order_index: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          flow_id: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          flow_id?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_flow_stages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flow_stages_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "web_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      web_flows: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_flows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_form_fields: {
        Row: {
          compact_view: boolean | null
          created_at: string | null
          description: string | null
          editable_in_other_stages: boolean | null
          field_options: Json | null
          field_type: string
          flow_id: string
          form_type: string
          help_text: string | null
          id: string
          label: string
          order_index: number
          placeholder: string | null
          required: boolean | null
          stage_id: string | null
          unique_value: boolean | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          compact_view?: boolean | null
          created_at?: string | null
          description?: string | null
          editable_in_other_stages?: boolean | null
          field_options?: Json | null
          field_type: string
          flow_id: string
          form_type: string
          help_text?: string | null
          id?: string
          label: string
          order_index?: number
          placeholder?: string | null
          required?: boolean | null
          stage_id?: string | null
          unique_value?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          compact_view?: boolean | null
          created_at?: string | null
          description?: string | null
          editable_in_other_stages?: boolean | null
          field_options?: Json | null
          field_type?: string
          flow_id?: string
          form_type?: string
          help_text?: string | null
          id?: string
          label?: string
          order_index?: number
          placeholder?: string | null
          required?: boolean | null
          stage_id?: string | null
          unique_value?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "web_form_fields_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "web_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_form_fields_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "web_flow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      web_items: {
        Row: {
          billing_type: string
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          item_code: string | null
          item_type: string
          metadata: Json | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          billing_type: string
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_type: string
          metadata?: Json | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_type?: string
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_type?: string
          metadata?: Json | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      web_notes: {
        Row: {
          client_id: string
          company_id: string | null
          content: string
          created_at: string
          creator_id: string | null
          id: string
          people_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          company_id?: string | null
          content: string
          created_at?: string
          creator_id?: string | null
          id?: string
          people_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          company_id?: string | null
          content?: string
          created_at?: string
          creator_id?: string | null
          id?: string
          people_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_company_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_company_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_company_notes_people_id_fkey"
            columns: ["people_id"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_company_notes_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_company_notes_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_payments: {
        Row: {
          card_id: string
          client_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          revalya_metadata: Json | null
          revalya_payment_id: string | null
          revalya_sync_at: string | null
          revalya_sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          card_id: string
          client_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          revalya_metadata?: Json | null
          revalya_payment_id?: string | null
          revalya_sync_at?: string | null
          revalya_sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          client_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          revalya_metadata?: Json | null
          revalya_payment_id?: string | null
          revalya_sync_at?: string | null
          revalya_sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_payments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_people: {
        Row: {
          assigned_user_id: string | null
          avatar_seed: string | null
          avatar_type: string | null
          birth_date: string | null
          client_id: string
          company_id: string | null
          created_at: string
          custom_avatar_url: string | null
          description: string | null
          display_name: string | null
          email: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          name: string
          people_type: Database["public"]["Enums"]["people_tag_type"] | null
          phone: string | null
          region_id: string | null
          role: string | null
          status: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          avatar_seed?: string | null
          avatar_type?: string | null
          birth_date?: string | null
          client_id?: string
          company_id?: string | null
          created_at?: string
          custom_avatar_url?: string | null
          description?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name: string
          people_type?: Database["public"]["Enums"]["people_tag_type"] | null
          phone?: string | null
          region_id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          avatar_seed?: string | null
          avatar_type?: string | null
          birth_date?: string | null
          client_id?: string
          company_id?: string | null
          created_at?: string
          custom_avatar_url?: string | null
          description?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name?: string
          people_type?: Database["public"]["Enums"]["people_tag_type"] | null
          phone?: string | null
          region_id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "web_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "v_regions_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "web_region"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_people_creator_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_people_creator_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_region: {
        Row: {
          bairro: string
          cep: string
          client_id: string | null
          created_at: string | null
          display_name: string | null
          id: string
          id_city: string | null
          id_state: string | null
          is_active: boolean | null
          nome: string
          responsible_user_id: string | null
          rua: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          bairro: string
          cep: string
          client_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          id_city?: string | null
          id_state?: string | null
          is_active?: boolean | null
          nome: string
          responsible_user_id?: string | null
          rua: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string
          cep?: string
          client_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          id_city?: string | null
          id_state?: string | null
          is_active?: boolean | null
          nome?: string
          responsible_user_id?: string | null
          rua?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_id_city_fkey"
            columns: ["id_city"]
            isOneToOne: false
            referencedRelation: "web_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "region_id_state_fkey"
            columns: ["id_state"]
            isOneToOne: false
            referencedRelation: "web_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_region_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_region_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_region_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_states: {
        Row: {
          created_at: string | null
          ibge_code: number | null
          id: string
          name: string
          uf: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ibge_code?: number | null
          id?: string
          name: string
          uf: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ibge_code?: number | null
          id?: string
          name?: string
          uf?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      web_tags: {
        Row: {
          client_id: string | null
          color: string
          created_at: string
          description: string | null
          funnel_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          funnel_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          funnel_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      web_task_types: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      web_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed: boolean | null
          created_at: string | null
          created_by: string
          deal_id: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          status: string | null
          title: string
          type_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by: string
          deal_id?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          type_id?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "web_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "web_task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "web_people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      app_global_ranking: {
        Row: {
          current_level: number | null
          custom_avatar_url: string | null
          instagram: string | null
          lifetime_xp: number | null
          linkedin: string | null
          partner_id: string | null
          person_name: string | null
          position: number | null
          season_xp: number | null
        }
        Relationships: []
      }
      partner_levels: {
        Row: {
          benefits: string | null
          client_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string | null
          index_level: number | null
          max_xp: number | null
          min_xp: number | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string | null
          index_level?: number | null
          max_xp?: number | null
          min_xp?: number | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string | null
          index_level?: number | null
          max_xp?: number | null
          min_xp?: number | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_levels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      v_regions_complete: {
        Row: {
          bairro: string | null
          cep: string | null
          city_name: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          id_city: string | null
          id_state: string | null
          is_active: boolean | null
          nome: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_user_id: string | null
          rua: string | null
          state_name: string | null
          state_uf: string | null
          total_points: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_id_city_fkey"
            columns: ["id_city"]
            isOneToOne: false
            referencedRelation: "web_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "region_id_state_fkey"
            columns: ["id_state"]
            isOneToOne: false
            referencedRelation: "web_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_region_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_region_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "core_client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_region_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "view_crm_user_data"
            referencedColumns: ["user_id"]
          },
        ]
      }
      view_crm_user_data: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          client_id: string | null
          client_license_id: string | null
          client_license_name: string | null
          client_name: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["collaborator_role"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "core_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_clients_license_id_fkey"
            columns: ["client_license_id"]
            isOneToOne: false
            referencedRelation: "core_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      web_deal_timeline: {
        Row: {
          client_id: string | null
          color: string | null
          completed_at: string | null
          content: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          icon: string | null
          id: string | null
          scheduled_at: string | null
          status: string | null
          timeline_date: string | null
          title: string | null
          type: string | null
          type_display: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      web_level_ranking: {
        Row: {
          current_level: number | null
          custom_avatar_url: string | null
          instagram: string | null
          lifetime_xp: number | null
          linkedin: string | null
          partner_id: string | null
          person_name: string | null
          position: number | null
          season_xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_user_register_in_region: {
        Args: { p_client_id: string; p_region_id: string; p_user_id: string }
        Returns: boolean
      }
      can_view_audit_logs: {
        Args: { record_id: string; table_name: string }
        Returns: boolean
      }
      check_admin_access: { Args: never; Returns: Json }
      cleanup_old_audit_logs: { Args: { p_days?: number }; Returns: number }
      convert_season_xp_to_ht: {
        Args: { people_uuid: string }
        Returns: undefined
      }
      create_audit_trigger: { Args: { table_name: string }; Returns: undefined }
      get_audit_statistics: {
        Args: { p_days?: number; p_table_name?: string }
        Returns: {
          deletes: number
          inserts: number
          last_activity: string
          table_name: string
          total_operations: number
          unique_users: number
          updates: number
        }[]
      }
      get_available_regions_for_city: {
        Args: { p_city_id: string; p_client_id: string }
        Returns: {
          bairro: string
          display_name: string
          id: string
          is_available: boolean
          nome: string
          responsible_name: string
          responsible_user_id: string
        }[]
      }
      get_card_timeline: {
        Args: { p_card_id: string; p_client_id: string }
        Returns: Json
      }
      get_contact_history: {
        Args: { p_client_id: string; p_contact_id: string }
        Returns: Json
      }
      get_deal_activity_stats: {
        Args: { p_deal_id: string }
        Returns: {
          avg_call_duration: number
          calls_count: number
          emails_count: number
          last_activity_date: string
          meetings_count: number
          notes_count: number
          total_activities: number
          whatsapp_count: number
        }[]
      }
      get_deal_timeline: {
        Args: { p_deal_id: string }
        Returns: {
          color: string
          completed_at: string
          content: string
          created_at: string
          description: string
          duration_minutes: number
          icon: string
          id: string
          scheduled_at: string
          status: string
          timeline_date: string
          title: string
          type: string
          type_display: string
          user_name: string
        }[]
      }
      get_entity_audit_history: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_operation?: string
          p_record_id: string
          p_search?: string
          p_table_name: string
          p_user_id?: string
        }
        Returns: {
          changed_fields: string[]
          created_at: string
          id: string
          new_values: Json
          old_values: Json
          operation: string
          session_info: Json
          user_email: string
          user_id: string
        }[]
      }
      get_entity_history: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          action: string
          changed_fields: string[]
          created_at: string
          id: string
          metadata: Json
          new_values: Json
          old_values: Json
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_first_step_of_flow: { Args: { p_flow_id: string }; Returns: string }
      get_flow_by_identifier: {
        Args: { p_client_id: string; p_flow_identifier: string }
        Returns: {
          description: string
          id: string
          name: string
        }[]
      }
      get_my_client_id_safe: { Args: never; Returns: string }
      get_my_role_safe: { Args: never; Returns: string }
      get_opportunities: {
        Args: { p_client_id: string }
        Returns: {
          assigned_team_id: string
          avatar_seed: string
          avatar_type: string
          client_id: string
          client_name: string
          company_names: string[]
          created_at: string
          id: string
          main_contact: string
          phone_numbers: string[]
          related_card_ids: string[]
          tax_ids: string[]
          updated_at: string
        }[]
      }
      get_partners_within_radius: {
        Args: { center_lat: number; center_lng: number; radius_km: number }
        Returns: {
          address: string
          city_name: string
          company_name: string
          distance_km: number
          partner_id: string
          partner_name: string
          state_uf: string
        }[]
      }
      get_stage_fields: {
        Args: { p_card_id: string; p_step_id: string; p_timestamp?: string }
        Returns: Json
      }
      get_team_commission: {
        Args: { p_item_code?: string; p_item_id?: string; p_team_id: string }
        Returns: {
          commission_type: string
          commission_value: number
        }[]
      }
      get_user_client_id: { Args: never; Returns: string }
      get_user_data: { Args: { user_id: string }; Returns: Json }
      get_user_name: { Args: { user_id: string }; Returns: string }
      import_ibge_location: {
        Args: { cities_data: Json; states_data: Json }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_administrator: { Args: never; Returns: boolean }
      is_team_admin: { Args: { check_team_id: string }; Returns: boolean }
      is_user_active: { Args: never; Returns: boolean }
      log_audit_history: {
        Args: {
          p_action: string
          p_changed_fields?: string[]
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: string
      }
      register_deal_activity: {
        Args: {
          p_activity_type: string
          p_completed_at?: string
          p_deal_id: string
          p_description?: string
          p_duration_minutes?: number
          p_notes?: string
          p_scheduled_at?: string
          p_status?: string
          p_title: string
        }
        Returns: string
      }
      reset_season_xp_if_needed: { Args: never; Returns: undefined }
      search_companies_flexible: {
        Args: {
          p_client_id: string
          p_limit?: number
          p_offset?: number
          p_search_term: string
        }
        Returns: {
          bairro: string
          categoria: string
          celular: string
          cep: string
          city_id: string
          client_id: string
          cnpj: string
          company_type: string
          complemento: string
          created_at: string
          creator_id: string
          email: string
          facebook: string
          id: string
          instagram: string
          linkedin: string
          logo_url: string
          name: string
          numero: string
          origem: string
          pais: string
          phone: string
          razao_social: string
          rua: string
          setor: string
          skype: string
          state_id: string
          telefone: string
          total_count: number
          twitter: string
          updated_at: string
          website: string
          whatsapp: string
        }[]
      }
      search_people_flexible: {
        Args: {
          p_client_id: string
          p_limit?: number
          p_offset?: number
          p_search_term?: string
        }
        Returns: {
          avatar_seed: string
          avatar_type: string
          birth_date: string
          client_id: string
          company: Json
          company_id: string
          created_at: string
          custom_avatar_url: string
          description: string
          display_name: string
          email: string
          id: string
          instagram: string
          linkedin: string
          name: string
          people_type: Database["public"]["Enums"]["people_tag_type"]
          phone: string
          region: Json
          region_id: string
          role: string
          status: string
          updated_at: string
          whatsapp: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_commission_distribution: {
        Args: { p_calculation_id: string }
        Returns: boolean
      }
      validate_contact_types: { Args: { types: string[] }; Returns: boolean }
    }
    Enums: {
      action_type_enum:
        | "phone_call"
        | "email"
        | "linkedin_message"
        | "whatsapp"
        | "meeting"
        | "task"
      admin_access_level: "general" | "limited"
      card_stats: "canceled" | "completed" | "inprogress"
      card_type_enum: "finance" | "onboarding"
      client_status: "active" | "inactive"
      collaborator_role:
        | "administrator"
        | "closer"
        | "partnership_director"
        | "partner"
      company_size_enum: "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE"
      company_type_enum: "MATRIZ" | "FILIAL" | "FRANQUIA"
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
        | "user"
        | "address"
        | "state_select"
        | "city_select"
      flow_category_enum: "finance" | "onboarding" | "generic"
      indication_status:
        | "Indicado"
        | "Tentando Contato"
        | "Reunião Agendada"
        | "Reunião Realizada"
        | "Conquistado"
        | "Perdida"
      lead_source: "partner_portal" | "manual"
      lead_status: "new" | "in_progress" | "closed"
      license_status: "active" | "suspended" | "expired"
      partner_status_enum: "PENDENTE" | "ATIVO" | "INATIVO" | "BLOQUEADO"
      partner_type_enum: "AFILIADO" | "AGENTE_STONE" | "CONTADOR"
      people_tag_type:
        | "Contato Principal"
        | "Contato Secundário"
        | "Contador"
        | "Consultor"
        | "Parceiro"
        | "CONTATO_PRINCIPAL"
        | "CONTATO_SECUNDARIO"
        | "CONTADOR"
        | "CONSULTOR"
        | "PARCEIRO"
      plan_type: "free" | "premium"
      relationship_type: "one_to_many" | "many_to_many"
      report_type: "usage" | "financial"
      step_type_enum: "standard" | "finisher" | "fail" | "freezing"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "doing" | "done"
      team_role_type: "admin" | "leader" | "member" | "ec" | "ev" | "sdr" | "ep"
      video_category: "PDVLegal" | "Hiper"
      video_subcategory:
        | "Configuração Inicial"
        | "Cadastro de Produtos"
        | "Processo de Venda"
        | "Fluxo de Caixa"
        | "Integração com Máquina"
        | "Tratamento de Objeções"
        | "Fechamento"
        | "Atualizações"
        | "Dicas de Abordagem"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_type_enum: [
        "phone_call",
        "email",
        "linkedin_message",
        "whatsapp",
        "meeting",
        "task",
      ],
      admin_access_level: ["general", "limited"],
      card_stats: ["canceled", "completed", "inprogress"],
      card_type_enum: ["finance", "onboarding"],
      client_status: ["active", "inactive"],
      collaborator_role: [
        "administrator",
        "closer",
        "partnership_director",
        "partner",
      ],
      company_size_enum: ["MICRO", "PEQUENA", "MEDIA", "GRANDE"],
      company_type_enum: ["MATRIZ", "FILIAL", "FRANQUIA"],
      field_type: [
        "short_text",
        "long_text",
        "dynamic_content",
        "attachment",
        "checkbox",
        "responsible",
        "date",
        "datetime",
        "due_date",
        "tags",
        "email",
        "phone",
        "list",
        "single_select",
        "time",
        "numeric",
        "currency",
        "documents",
        "id",
        "user",
        "address",
        "state_select",
        "city_select",
      ],
      flow_category_enum: ["finance", "onboarding", "generic"],
      indication_status: [
        "Indicado",
        "Tentando Contato",
        "Reunião Agendada",
        "Reunião Realizada",
        "Conquistado",
        "Perdida",
      ],
      lead_source: ["partner_portal", "manual"],
      lead_status: ["new", "in_progress", "closed"],
      license_status: ["active", "suspended", "expired"],
      partner_status_enum: ["PENDENTE", "ATIVO", "INATIVO", "BLOQUEADO"],
      partner_type_enum: ["AFILIADO", "AGENTE_STONE", "CONTADOR"],
      people_tag_type: [
        "Contato Principal",
        "Contato Secundário",
        "Contador",
        "Consultor",
        "Parceiro",
        "CONTATO_PRINCIPAL",
        "CONTATO_SECUNDARIO",
        "CONTADOR",
        "CONSULTOR",
        "PARCEIRO",
      ],
      plan_type: ["free", "premium"],
      relationship_type: ["one_to_many", "many_to_many"],
      report_type: ["usage", "financial"],
      step_type_enum: ["standard", "finisher", "fail", "freezing"],
      task_priority: ["low", "medium", "high"],
      task_status: ["todo", "doing", "done"],
      team_role_type: ["admin", "leader", "member", "ec", "ev", "sdr", "ep"],
      video_category: ["PDVLegal", "Hiper"],
      video_subcategory: [
        "Configuração Inicial",
        "Cadastro de Produtos",
        "Processo de Venda",
        "Fluxo de Caixa",
        "Integração com Máquina",
        "Tratamento de Objeções",
        "Fechamento",
        "Atualizações",
        "Dicas de Abordagem",
      ],
    },
  },
} as const
