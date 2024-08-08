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
      KYBpermissions: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_tax_id: string | null
          created_at: string
          first_name: string | null
          id: string
          is_verified: boolean | null
          kyb_mode: string | null
          last_name: string | null
          wallet_address: string | null
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_tax_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          kyb_mode?: string | null
          last_name?: string | null
          wallet_address?: string | null
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_tax_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          kyb_mode?: string | null
          last_name?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      KYCpermissions: {
        Row: {
          claim_status: string | null
          created_at: string
          id: string
          jwt: string | null
          kyc_mode: string | null
          kyc_status: string | null
          nationality: string | null
          wallet_address: string | null
        }
        Insert: {
          claim_status?: string | null
          created_at?: string
          id?: string
          jwt?: string | null
          kyc_mode?: string | null
          kyc_status?: string | null
          nationality?: string | null
          wallet_address?: string | null
        }
        Update: {
          claim_status?: string | null
          created_at?: string
          id?: string
          jwt?: string | null
          kyc_mode?: string | null
          kyc_status?: string | null
          nationality?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          created_at: string
          id: string
          name: string | null
          points: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          points?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          points?: number | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          body: string | null
          created_at: string
          id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      pools: {
        Row: {
          apr: number | null
          created_at: string
          from_token: string | null
          id: number
          to_token: string | null
          total_liquidity: number | null
          US: boolean | null
        }
        Insert: {
          apr?: number | null
          created_at?: string
          from_token?: string | null
          id?: number
          to_token?: string | null
          total_liquidity?: number | null
          US?: boolean | null
        }
        Update: {
          apr?: number | null
          created_at?: string
          from_token?: string | null
          id?: number
          to_token?: string | null
          total_liquidity?: number | null
          US?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pools_from_token_fkey"
            columns: ["from_token"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pools_to_token_fkey"
            columns: ["to_token"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          }
        ]
      }
      risk: {
        Row: {
          address: string | null
          created_at: string
          id: string
          info: string | null
          score: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          info?: string | null
          score?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          info?: string | null
          score?: string | null
        }
        Relationships: []
      }
      tokens: {
        Row: {
          created_at: string
          day_volume: number | null
          icon: string | null
          id: string
          liquidity: number | null
          price_change: number | null
          symbol: string | null
          usd_price: number | null
        }
        Insert: {
          created_at?: string
          day_volume?: number | null
          icon?: string | null
          id?: string
          liquidity?: number | null
          price_change?: number | null
          symbol?: string | null
          usd_price?: number | null
        }
        Update: {
          created_at?: string
          day_volume?: number | null
          icon?: string | null
          id?: string
          liquidity?: number | null
          price_change?: number | null
          symbol?: string | null
          usd_price?: number | null
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
