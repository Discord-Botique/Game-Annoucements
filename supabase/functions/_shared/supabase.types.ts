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
      birthdays: {
        Row: {
          birthday: string
          channel_id: string
          created_at: string
          has_year: boolean
          id: number
          server_id: string
          user_id: string
        }
        Insert: {
          birthday: string
          channel_id: string
          created_at?: string
          has_year?: boolean
          id?: number
          server_id: string
          user_id: string
        }
        Update: {
          birthday?: string
          channel_id?: string
          created_at?: string
          has_year?: boolean
          id?: number
          server_id?: string
          user_id?: string
        }
        Relationships: []
      }
      steam_games: {
        Row: {
          created_at: string
          id: number
          last_announcement_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: number
          last_announcement_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          last_announcement_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      steam_subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          disabled_at: string | null
          game_id: number
          id: number
          role_id: string | null
          server_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          disabled_at?: string | null
          game_id: number
          id?: number
          role_id?: string | null
          server_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          disabled_at?: string | null
          game_id?: number
          id?: number
          role_id?: string | null
          server_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "steam_subscriptions_game_id_fkey"
            columns: ["game_id"]
            referencedRelation: "steam_games"
            referencedColumns: ["id"]
          }
        ]
      }
      twitch_subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          id: number
          role_id: string | null
          server_id: string
          subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: number
          role_id?: string | null
          server_id: string
          subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: number
          role_id?: string | null
          server_id?: string
          subscription_id?: string
          updated_at?: string
          user_id?: string
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

