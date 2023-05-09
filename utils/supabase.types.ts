export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      steam_subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          disabled_at: string | null
          game_id: string
          id: number
          server_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          disabled_at?: string | null
          game_id: string
          id?: number
          server_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          disabled_at?: string | null
          game_id?: string
          id?: number
          server_id?: string
          updated_at?: string
        }
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

