export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      steam_games: {
        Row: {
          created_at: string;
          id: number;
          last_announcement_id: string | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: number;
          last_announcement_id?: string | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          last_announcement_id?: string | null;
          name?: string;
          updated_at?: string;
        };
      };
      steam_subscriptions: {
        Row: {
          channel_id: string;
          created_at: string;
          disabled_at: string | null;
          game_id: number;
          id: number;
          role_id: string | null;
          server_id: string;
          updated_at: string;
        };
        Insert: {
          channel_id: string;
          created_at?: string;
          disabled_at?: string | null;
          game_id: number;
          id?: number;
          role_id?: string | null;
          server_id: string;
          updated_at?: string;
        };
        Update: {
          channel_id?: string;
          created_at?: string;
          disabled_at?: string | null;
          game_id?: number;
          id?: number;
          role_id?: string | null;
          server_id?: string;
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
