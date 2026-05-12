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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          logged_by: string | null
          status: string
          timestamp: string
          vehicle_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          logged_by?: string | null
          status?: string
          timestamp?: string
          vehicle_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          logged_by?: string | null
          status?: string
          timestamp?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_logs: {
        Row: {
          entry_time: string
          entry_type: string
          exit_time: string | null
          flat_number: string
          id: string
          logged_by: string | null
          owner_name: string
          vehicle_number: string
          wing: string | null
        }
        Insert: {
          entry_time?: string
          entry_type?: string
          exit_time?: string | null
          flat_number: string
          id?: string
          logged_by?: string | null
          owner_name: string
          vehicle_number: string
          wing?: string | null
        }
        Update: {
          entry_time?: string
          entry_type?: string
          exit_time?: string | null
          flat_number?: string
          id?: string
          logged_by?: string | null
          owner_name?: string
          vehicle_number?: string
          wing?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          flat_number: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          wing: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          flat_number?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          wing?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          flat_number?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          wing?: string | null
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          created_at: string
          display_name: string
          email: string
          flat_number: string | null
          id: string
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          wing: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          flat_number?: string | null
          id?: string
          requested_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          wing?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          flat_number?: string | null
          id?: string
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          wing?: string | null
        }
        Relationships: []
      }
      resident_flats: {
        Row: {
          created_at: string
          flat_number: string
          id: string
          is_primary: boolean
          user_id: string
          wing: string
        }
        Insert: {
          created_at?: string
          flat_number: string
          id?: string
          is_primary?: boolean
          user_id: string
          wing: string
        }
        Update: {
          created_at?: string
          flat_number?: string
          id?: string
          is_primary?: boolean
          user_id?: string
          wing?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_change_requests: {
        Row: {
          created_at: string
          flat_number: string
          id: string
          notes: string | null
          owner_name: string
          request_type: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_vehicle_id: string | null
          updated_at: string
          vehicle_number: string
          vehicle_type: string
          wing: string
        }
        Insert: {
          created_at?: string
          flat_number: string
          id?: string
          notes?: string | null
          owner_name: string
          request_type: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_vehicle_id?: string | null
          updated_at?: string
          vehicle_number: string
          vehicle_type?: string
          wing: string
        }
        Update: {
          created_at?: string
          flat_number?: string
          id?: string
          notes?: string | null
          owner_name?: string
          request_type?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_vehicle_id?: string | null
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string
          wing?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          flat_number: string
          id: string
          owner_name: string
          qr_code: string
          updated_at: string
          vehicle_number: string
          vehicle_type: string
          wing: string
        }
        Insert: {
          created_at?: string
          flat_number: string
          id?: string
          owner_name: string
          qr_code: string
          updated_at?: string
          vehicle_number: string
          vehicle_type?: string
          wing: string
        }
        Update: {
          created_at?: string
          flat_number?: string
          id?: string
          owner_name?: string
          qr_code?: string
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string
          wing?: string
        }
        Relationships: []
      }
      visitor_requests: {
        Row: {
          created_at: string
          flat_number: string
          id: string
          phone: string
          purpose: string | null
          status: string
          vehicle_number: string
          visitor_name: string
        }
        Insert: {
          created_at?: string
          flat_number: string
          id?: string
          phone: string
          purpose?: string | null
          status?: string
          vehicle_number: string
          visitor_name: string
        }
        Update: {
          created_at?: string
          flat_number?: string
          id?: string
          phone?: string
          purpose?: string | null
          status?: string
          vehicle_number?: string
          visitor_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email_has_role: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "guard" | "resident" | "admin" | "visitor"
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
      app_role: ["guard", "resident", "admin", "visitor"],
    },
  },
} as const
