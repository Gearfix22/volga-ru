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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          payload: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      booking_status_history: {
        Row: {
          booking_id: string | null
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          booking_id?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          booking_id?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          assigned_driver_id: string | null
          created_at: string | null
          customer_notes: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          requires_verification: boolean | null
          service_details: Json | null
          service_type: string
          status: string | null
          total_price: number | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
          user_info: Json
        }
        Insert: {
          admin_notes?: string | null
          assigned_driver_id?: string | null
          created_at?: string | null
          customer_notes?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          requires_verification?: boolean | null
          service_details?: Json | null
          service_type: string
          status?: string | null
          total_price?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_info: Json
        }
        Update: {
          admin_notes?: string | null
          assigned_driver_id?: string | null
          created_at?: string | null
          customer_notes?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          requires_verification?: boolean | null
          service_details?: Json | null
          service_type?: string
          status?: string | null
          total_price?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_info?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string | null
          submitted_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject?: string | null
          submitted_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      custom_trip_bookings: {
        Row: {
          additional_info: string | null
          booking_id: string | null
          budget_range: string | null
          created_at: string | null
          duration: string
          id: string
          interests: string[] | null
          regions: string
        }
        Insert: {
          additional_info?: string | null
          booking_id?: string | null
          budget_range?: string | null
          created_at?: string | null
          duration: string
          id?: string
          interests?: string[] | null
          regions: string
        }
        Update: {
          additional_info?: string | null
          booking_id?: string | null
          budget_range?: string | null
          created_at?: string | null
          duration?: string
          id?: string
          interests?: string[] | null
          regions?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_trip_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_trip_packages: {
        Row: {
          base_price: number
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_type: string
          id: string
          included_activities: string[] | null
          is_active: boolean | null
          max_participants: number | null
          package_name: string
          price_per_day: number | null
          regions: string[]
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_type: string
          id?: string
          included_activities?: string[] | null
          is_active?: boolean | null
          max_participants?: number | null
          package_name: string
          price_per_day?: number | null
          regions: string[]
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_type?: string
          id?: string
          included_activities?: string[] | null
          is_active?: boolean | null
          max_participants?: number | null
          package_name?: string
          price_per_day?: number | null
          regions?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      draft_bookings: {
        Row: {
          booking_progress: string | null
          created_at: string
          id: string
          service_details: Json | null
          service_type: string
          total_price: number | null
          updated_at: string
          user_id: string | null
          user_info: Json | null
        }
        Insert: {
          booking_progress?: string | null
          created_at?: string
          id?: string
          service_details?: Json | null
          service_type: string
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
          user_info?: Json | null
        }
        Update: {
          booking_progress?: string | null
          created_at?: string
          id?: string
          service_details?: Json | null
          service_type?: string
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
          user_info?: Json | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          event_date: string
          event_location: string
          event_name: string
          id: string
          ticket_type: string | null
          tickets_quantity: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          event_date: string
          event_location: string
          event_name: string
          id?: string
          ticket_type?: string | null
          tickets_quantity: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          event_date?: string
          event_location?: string
          event_name?: string
          id?: string
          ticket_type?: string | null
          tickets_quantity?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      event_services: {
        Row: {
          available_tickets: number | null
          city: string
          created_at: string | null
          description: string | null
          event_date: string
          event_name: string
          event_time: string | null
          event_type: string
          id: string
          is_active: boolean | null
          ticket_types: Json
          updated_at: string | null
          venue: string
        }
        Insert: {
          available_tickets?: number | null
          city: string
          created_at?: string | null
          description?: string | null
          event_date: string
          event_name: string
          event_time?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          ticket_types: Json
          updated_at?: string | null
          venue: string
        }
        Update: {
          available_tickets?: number | null
          city?: string
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_name?: string
          event_time?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          ticket_types?: Json
          updated_at?: string | null
          venue?: string
        }
        Relationships: []
      }
      form_interactions: {
        Row: {
          created_at: string | null
          field_name: string | null
          form_data: Json
          form_type: string
          id: string
          interaction_type: string
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          field_name?: string | null
          form_data: Json
          form_type: string
          id?: string
          interaction_type: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          field_name?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          interaction_type?: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hotel_bookings: {
        Row: {
          booking_id: string | null
          checkin_date: string
          checkout_date: string
          city: string
          created_at: string | null
          guests: string | null
          hotel_name: string
          id: string
          room_type: string
          special_requests: string | null
        }
        Insert: {
          booking_id?: string | null
          checkin_date: string
          checkout_date: string
          city: string
          created_at?: string | null
          guests?: string | null
          hotel_name: string
          id?: string
          room_type: string
          special_requests?: string | null
        }
        Update: {
          booking_id?: string | null
          checkin_date?: string
          checkout_date?: string
          city?: string
          created_at?: string | null
          guests?: string | null
          hotel_name?: string
          id?: string
          room_type?: string
          special_requests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_services: {
        Row: {
          amenities: string[] | null
          base_price_per_night: number
          city: string
          created_at: string | null
          description: string | null
          hotel_name: string
          id: string
          is_active: boolean | null
          max_guests: number | null
          room_type: string
          star_rating: number | null
          updated_at: string | null
        }
        Insert: {
          amenities?: string[] | null
          base_price_per_night: number
          city: string
          created_at?: string | null
          description?: string | null
          hotel_name: string
          id?: string
          is_active?: boolean | null
          max_guests?: number | null
          room_type: string
          star_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          amenities?: string[] | null
          base_price_per_night?: number
          city?: string
          created_at?: string | null
          description?: string | null
          hotel_name?: string
          id?: string
          is_active?: boolean | null
          max_guests?: number | null
          room_type?: string
          star_rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          subscribed_at: string | null
          subscription_source: string | null
          subscription_status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          subscribed_at?: string | null
          subscription_source?: string | null
          subscription_status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          subscribed_at?: string | null
          subscription_source?: string | null
          subscription_status?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          target_admin_id: string | null
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          target_admin_id?: string | null
          type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          target_admin_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      page_visits: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          page_title: string | null
          page_url: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          visit_timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          page_title?: string | null
          page_url: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visit_timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visit_timestamp?: string | null
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          booking_id: string | null
          created_at: string
          file_name: string
          file_url: string
          id: string
          upload_date: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          upload_date?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          upload_date?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string
          phone_verified: boolean | null
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone: string
          phone_verified?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string
          phone_verified?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          created_at: string | null
          id: string
          query_text: string
          results_count: number | null
          search_type: string | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query_text: string
          results_count?: number | null
          search_type?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query_text?: string
          results_count?: number | null
          search_type?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          category_name: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      transportation_bookings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          dropoff_location: string
          id: string
          passengers: string | null
          pickup_location: string
          travel_date: string
          travel_time: string
          vehicle_type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          dropoff_location: string
          id?: string
          passengers?: string | null
          pickup_location: string
          travel_date: string
          travel_time: string
          vehicle_type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          dropoff_location?: string
          id?: string
          passengers?: string | null
          pickup_location?: string
          travel_date?: string
          travel_time?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transportation_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_services: {
        Row: {
          base_price: number
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          max_passengers: number | null
          price_per_km: number | null
          service_name: string
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          base_price: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_passengers?: number | null
          price_per_km?: number | null
          service_name: string
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          base_price?: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_passengers?: number | null
          price_per_km?: number | null
          service_name?: string
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_data: Json
          activity_description: string | null
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json
          activity_description?: string | null
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_description?: string | null
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preference_type: string
          preference_value: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          preference_type: string
          preference_value: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preference_type?: string
          preference_value?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
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
      app_role: "admin" | "moderator" | "user" | "driver"
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
      app_role: ["admin", "moderator", "user", "driver"],
    },
  },
} as const
