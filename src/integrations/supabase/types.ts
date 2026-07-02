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
          society_id: string
          status: string
          timestamp: string
          vehicle_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          logged_by?: string | null
          society_id: string
          status?: string
          timestamp?: string
          vehicle_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          logged_by?: string | null
          society_id?: string
          status?: string
          timestamp?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      barrier_devices: {
        Row: {
          created_at: string
          device_token: string
          direction: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          location: string | null
          name: string
          society_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_token: string
          direction: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          location?: string | null
          name: string
          society_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_token?: string
          direction?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          location?: string | null
          name?: string
          society_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barrier_devices_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      barrier_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          decision: string
          device_id: string | null
          entry_log_id: string | null
          id: string
          qr_payload: string | null
          reason: string | null
          society_id: string
          vehicle_number: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          decision: string
          device_id?: string | null
          entry_log_id?: string | null
          id?: string
          qr_payload?: string | null
          reason?: string | null
          society_id: string
          vehicle_number?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          decision?: string
          device_id?: string | null
          entry_log_id?: string | null
          id?: string
          qr_payload?: string | null
          reason?: string | null
          society_id?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barrier_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "barrier_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barrier_events_entry_log_id_fkey"
            columns: ["entry_log_id"]
            isOneToOne: false
            referencedRelation: "entry_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barrier_events_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
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
          society_id: string
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
          society_id: string
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
          society_id?: string
          vehicle_number?: string
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_logs_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          child_type: string | null
          created_at: string
          display_name: string | null
          flat_number: string | null
          id: string
          parent_user_id: string | null
          phone: string | null
          society_id: string | null
          updated_at: string
          user_id: string
          wing: string | null
        }
        Insert: {
          child_type?: string | null
          created_at?: string
          display_name?: string | null
          flat_number?: string | null
          id?: string
          parent_user_id?: string | null
          phone?: string | null
          society_id?: string | null
          updated_at?: string
          user_id: string
          wing?: string | null
        }
        Update: {
          child_type?: string | null
          created_at?: string
          display_name?: string | null
          flat_number?: string | null
          id?: string
          parent_user_id?: string | null
          phone?: string | null
          society_id?: string | null
          updated_at?: string
          user_id?: string
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          created_at: string
          display_name: string
          email: string
          flat_number: string | null
          id: string
          password: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          society_id: string
          status: string
          wing: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          flat_number?: string | null
          id?: string
          password?: string | null
          requested_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          society_id: string
          status?: string
          wing?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          flat_number?: string | null
          id?: string
          password?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          society_id?: string
          status?: string
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_requests_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_flats: {
        Row: {
          created_at: string
          flat_number: string
          id: string
          is_primary: boolean
          society_id: string
          user_id: string
          wing: string
        }
        Insert: {
          created_at?: string
          flat_number: string
          id?: string
          is_primary?: boolean
          society_id: string
          user_id: string
          wing: string
        }
        Update: {
          created_at?: string
          flat_number?: string
          id?: string
          is_primary?: boolean
          society_id?: string
          user_id?: string
          wing?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_flats_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      societies: {
        Row: {
          address_line: string
          city: string
          country: string
          created_at: string
          id: string
          landmark: string | null
          name: string
          pin_code: string
          slug: string | null
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          address_line: string
          city: string
          country?: string
          created_at?: string
          id?: string
          landmark?: string | null
          name: string
          pin_code: string
          slug?: string | null
          state: string
          status?: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          landmark?: string | null
          name?: string
          pin_code?: string
          slug?: string | null
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      society_registration_requests: {
        Row: {
          address_line: string
          admin_display_name: string
          admin_email: string
          admin_password: string
          admin_phone: string | null
          city: string
          country: string
          created_at: string
          created_society_id: string | null
          id: string
          landmark: string | null
          pin_code: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          society_name: string
          society_structure: Json
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          address_line: string
          admin_display_name: string
          admin_email: string
          admin_password: string
          admin_phone?: string | null
          city: string
          country?: string
          created_at?: string
          created_society_id?: string | null
          id?: string
          landmark?: string | null
          pin_code: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          society_name: string
          society_structure?: Json
          state: string
          status?: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          admin_display_name?: string
          admin_email?: string
          admin_password?: string
          admin_phone?: string | null
          city?: string
          country?: string
          created_at?: string
          created_society_id?: string | null
          id?: string
          landmark?: string | null
          pin_code?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          society_name?: string
          society_structure?: Json
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_registration_requests_created_society_id_fkey"
            columns: ["created_society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_structure: {
        Row: {
          created_at: string
          id: string
          locked: boolean
          society_id: string
          structure: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          locked?: boolean
          society_id: string
          structure?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          locked?: boolean
          society_id?: string
          structure?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_structure_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: true
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_visits: {
        Row: {
          agent_name: string | null
          approved_by: string | null
          created_at: string
          delivery_type: string
          entry_time: string
          exit_time: string | null
          expires_at: string
          flat_number: string
          guard_id: string | null
          id: string
          mobile: string
          photo_base64: string | null
          rejection_note: string | null
          society_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
          wing: string
        }
        Insert: {
          agent_name?: string | null
          approved_by?: string | null
          created_at?: string
          delivery_type: string
          entry_time?: string
          exit_time?: string | null
          expires_at?: string
          flat_number: string
          guard_id?: string | null
          id?: string
          mobile: string
          photo_base64?: string | null
          rejection_note?: string | null
          society_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          wing: string
        }
        Update: {
          agent_name?: string | null
          approved_by?: string | null
          created_at?: string
          delivery_type?: string
          entry_time?: string
          exit_time?: string | null
          expires_at?: string
          flat_number?: string
          guard_id?: string | null
          id?: string
          mobile?: string
          photo_base64?: string | null
          rejection_note?: string | null
          society_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          wing?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_visits_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      house_help_flats: {
        Row: {
          created_at: string
          flat_number: string
          house_help_id: string
          id: string
          resident_id: string
          wing: string
        }
        Insert: {
          created_at?: string
          flat_number: string
          house_help_id: string
          id?: string
          resident_id: string
          wing: string
        }
        Update: {
          created_at?: string
          flat_number?: string
          house_help_id?: string
          id?: string
          resident_id?: string
          wing?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_help_flats_house_help_id_fkey"
            columns: ["house_help_id"]
            isOneToOne: false
            referencedRelation: "house_helps"
            referencedColumns: ["id"]
          },
        ]
      }
      house_helps: {
        Row: {
          created_at: string
          help_type: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          photo_base64: string | null
          qr_code: string
          society_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          help_type: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          photo_base64?: string | null
          qr_code: string
          society_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          help_type?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          photo_base64?: string | null
          qr_code?: string
          society_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_helps_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_logs: {
        Row: {
          action_type: string
          category: Database["public"]["Enums"]["staff_category"]
          created_at: string
          id: string
          logged_by: string | null
          society_id: string
          staff_id: string
          timestamp: string
        }
        Insert: {
          action_type: string
          category: Database["public"]["Enums"]["staff_category"]
          created_at?: string
          id?: string
          logged_by?: string | null
          society_id: string
          staff_id: string
          timestamp?: string
        }
        Update: {
          action_type?: string
          category?: Database["public"]["Enums"]["staff_category"]
          created_at?: string
          id?: string
          logged_by?: string | null
          society_id?: string
          staff_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_logs_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          photo_base64: string | null
          qr_code: string
          registered_by: string | null
          society_id: string
          staff_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          photo_base64?: string | null
          qr_code: string
          registered_by?: string | null
          society_id: string
          staff_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          photo_base64?: string | null
          qr_code?: string
          registered_by?: string | null
          society_id?: string
          staff_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          society_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          society_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          society_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
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
          society_id: string
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
          society_id: string
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
          society_id?: string
          status?: string
          target_vehicle_id?: string | null
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string
          wing?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_change_requests_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          flat_number: string
          id: string
          owner_name: string
          qr_code: string
          society_id: string
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
          society_id: string
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
          society_id?: string
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string
          wing?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_requests: {
        Row: {
          created_at: string
          flat_number: string
          id: string
          phone: string
          purpose: string | null
          society_id: string
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
          society_id: string
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
          society_id?: string
          status?: string
          vehicle_number?: string
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_requests_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
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
      expire_delivery_visits: { Args: { p_society_id: string }; Returns: number }
      get_parent_user_id: { Args: { _user_id: string }; Returns: string }
      get_user_society_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_primary_resident: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      set_primary_flat: { Args: { _flat_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "guard" | "resident" | "admin" | "visitor" | "super_admin"
      delivery_status: "pending_approval" | "approved" | "rejected" | "completed" | "expired"
      staff_category: "society_staff" | "house_help"
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
      app_role: ["guard", "resident", "admin", "visitor", "super_admin"],
      delivery_status: ["pending_approval", "approved", "rejected", "completed", "expired"],
      staff_category: ["society_staff", "house_help"],
    },
  },
} as const
