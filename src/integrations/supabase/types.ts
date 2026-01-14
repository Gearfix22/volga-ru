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
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          permissions: Database["public"]["Enums"]["admin_permission"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Database["public"]["Enums"]["admin_permission"][]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Database["public"]["Enums"]["admin_permission"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_guide_logs: {
        Row: {
          assistant_response: string
          created_at: string
          id: string
          language: string
          session_id: string
          user_id: string | null
          user_message: string
        }
        Insert: {
          assistant_response: string
          created_at?: string
          id?: string
          language?: string
          session_id: string
          user_id?: string | null
          user_message: string
        }
        Update: {
          assistant_response?: string
          created_at?: string
          id?: string
          language?: string
          session_id?: string
          user_id?: string | null
          user_message?: string
        }
        Relationships: []
      }
      ai_guide_sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: string
          value_type: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: string
          value_type?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string
          value_type?: string | null
        }
        Relationships: []
      }
      auth_sessions: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      booking_price_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_price: number | null
          old_price: number | null
          reason: string | null
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          reason?: string | null
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_price_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_price_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_price_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_price_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_price_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_prices: {
        Row: {
          admin_price: number | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          booking_id: string
          created_at: string
          currency: string
          id: string
          locked: boolean | null
          tax: number
          updated_at: string
        }
        Insert: {
          admin_price?: number | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          locked?: boolean | null
          tax?: number
          updated_at?: string
        }
        Update: {
          admin_price?: number | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          locked?: boolean | null
          tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_prices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_prices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_prices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_prices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_prices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
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
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          assigned_driver_id: string | null
          assigned_guide_id: string | null
          created_at: string | null
          currency: string | null
          customer_notes: string | null
          driver_notes: string | null
          driver_required: boolean | null
          driver_response: string | null
          driver_response_at: string | null
          exchange_rate_used: number | null
          final_paid_amount: number | null
          id: string
          payment_currency: string | null
          payment_method: string | null
          payment_status: string | null
          requires_verification: boolean | null
          service_details: Json | null
          service_id: string | null
          service_type: string
          show_driver_to_customer: boolean | null
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
          assigned_guide_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_notes?: string | null
          driver_notes?: string | null
          driver_required?: boolean | null
          driver_response?: string | null
          driver_response_at?: string | null
          exchange_rate_used?: number | null
          final_paid_amount?: number | null
          id?: string
          payment_currency?: string | null
          payment_method?: string | null
          payment_status?: string | null
          requires_verification?: boolean | null
          service_details?: Json | null
          service_id?: string | null
          service_type: string
          show_driver_to_customer?: boolean | null
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
          assigned_guide_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_notes?: string | null
          driver_notes?: string | null
          driver_required?: boolean | null
          driver_response?: string | null
          driver_response_at?: string | null
          exchange_rate_used?: number | null
          final_paid_amount?: number | null
          id?: string
          payment_currency?: string | null
          payment_method?: string | null
          payment_status?: string | null
          requires_verification?: boolean | null
          service_details?: Json | null
          service_id?: string | null
          service_type?: string
          show_driver_to_customer?: boolean | null
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
          {
            foreignKeyName: "bookings_assigned_guide_id_fkey"
            columns: ["assigned_guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_driver"
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
      currency_rates: {
        Row: {
          currency_code: string
          id: string
          rate_to_usd: number
          symbol: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          currency_code: string
          id?: string
          rate_to_usd?: number
          symbol: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          currency_code?: string
          id?: string
          rate_to_usd?: number
          symbol?: string
          updated_at?: string
          updated_by?: string | null
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
          {
            foreignKeyName: "custom_trip_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "custom_trip_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "custom_trip_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "custom_trip_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
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
      driver_locations: {
        Row: {
          accuracy: number | null
          booking_id: string | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          speed: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          booking_id?: string | null
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          speed?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          booking_id?: string | null
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_route_history: {
        Row: {
          booking_id: string
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed: number | null
        }
        Insert: {
          booking_id: string
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed?: number | null
        }
        Update: {
          booking_id?: string
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_route_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_route_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_route_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_route_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_route_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_route_history_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "event_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "event_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "event_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "event_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_event_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_event_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_event_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_event_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
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
      guide_availability: {
        Row: {
          available_from: string | null
          available_to: string | null
          created_at: string | null
          guide_id: string
          id: string
          is_available: boolean | null
          languages: string[] | null
          service_areas: string[] | null
          updated_at: string | null
          working_days: number[] | null
        }
        Insert: {
          available_from?: string | null
          available_to?: string | null
          created_at?: string | null
          guide_id: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          service_areas?: string[] | null
          updated_at?: string | null
          working_days?: number[] | null
        }
        Update: {
          available_from?: string | null
          available_to?: string | null
          created_at?: string | null
          guide_id?: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          service_areas?: string[] | null
          updated_at?: string | null
          working_days?: number[] | null
        }
        Relationships: []
      }
      guide_locations: {
        Row: {
          accuracy: number | null
          booking_id: string | null
          created_at: string | null
          guide_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          speed: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          booking_id?: string | null
          created_at?: string | null
          guide_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          booking_id?: string | null
          created_at?: string | null
          guide_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "guide_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "guide_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "guide_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "guide_locations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          created_at: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          languages: string[] | null
          phone: string
          specialization: string[] | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          phone: string
          specialization?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          phone?: string
          specialization?: string[] | null
          status?: string
          updated_at?: string | null
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
            foreignKeyName: "fk_hotel_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_hotel_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_hotel_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_hotel_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_hotel_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "hotel_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "hotel_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "hotel_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "hotel_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          id: string
          identifier: string
          ip_address: string | null
          success: boolean | null
        }
        Insert: {
          attempt_type?: string
          created_at?: string
          id?: string
          identifier: string
          ip_address?: string | null
          success?: boolean | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          id?: string
          identifier?: string
          ip_address?: string | null
          success?: boolean | null
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
          {
            foreignKeyName: "payment_receipts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payment_receipts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payment_receipts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payment_receipts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      profiles: {
        Row: {
          country_code: string | null
          created_at: string | null
          dial_code: string | null
          full_name: string | null
          id: string
          phone: string
          phone_e164: string | null
          phone_verified: boolean | null
          preferred_currency: string | null
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          dial_code?: string | null
          full_name?: string | null
          id: string
          phone: string
          phone_e164?: string | null
          phone_verified?: boolean | null
          preferred_currency?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          dial_code?: string | null
          full_name?: string | null
          id?: string
          phone?: string
          phone_e164?: string | null
          phone_verified?: boolean | null
          preferred_currency?: string | null
          preferred_language?: string | null
          updated_at?: string | null
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
          category_id: string | null
          created_at: string | null
          currency: string
          description: string | null
          display_order: number | null
          features: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          service_type: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          service_type?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          service_type?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_guide_bookings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          group_size: number | null
          guide_language: string
          hourly_rate: number | null
          id: string
          special_interests: string | null
          tour_area: string
          tour_date: string
          tour_duration_hours: number
          tour_start_time: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          group_size?: number | null
          guide_language?: string
          hourly_rate?: number | null
          id?: string
          special_interests?: string | null
          tour_area: string
          tour_date: string
          tour_duration_hours?: number
          tour_start_time: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          group_size?: number | null
          guide_language?: string
          hourly_rate?: number | null
          id?: string
          special_interests?: string | null
          tour_area?: string
          tour_date?: string
          tour_duration_hours?: number
          tour_start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_guide_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guide_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_guide_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_guide_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_guide_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "tourist_guide_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourist_guide_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "tourist_guide_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "tourist_guide_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "tourist_guide_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
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
            foreignKeyName: "fk_transport_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transport_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_transport_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_transport_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_transport_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "transportation_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "transportation_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "transportation_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "transportation_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      ui_translations: {
        Row: {
          key: string
          lang: string
          value: string | null
        }
        Insert: {
          key: string
          lang: string
          value?: string | null
        }
        Update: {
          key?: string
          lang?: string
          value?: string | null
        }
        Relationships: []
      }
      unified_notifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_id: string
          recipient_type: string
          title: string
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_id: string
          recipient_type: string
          title: string
          type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_id?: string
          recipient_type?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_admin_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "unified_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_payment_guard"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "unified_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_payment_audit"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "unified_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_user_booking_dashboard"
            referencedColumns: ["booking_id"]
          },
        ]
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
      v_admin_bookings: {
        Row: {
          admin_price: number | null
          amount: number | null
          booking_id: string | null
          can_pay: boolean | null
          created_at: string | null
          currency: string | null
          locked: boolean | null
          status: string | null
          tax: number | null
        }
        Relationships: []
      }
      v_booking_payment_guard: {
        Row: {
          approved_price: number | null
          booking_id: string | null
          can_pay: boolean | null
          locked: boolean | null
        }
        Relationships: []
      }
      v_payment_audit: {
        Row: {
          base_price_usd: number | null
          booking_date: string | null
          booking_id: string | null
          customer_name: string | null
          customer_phone: string | null
          exchange_rate_used: number | null
          final_paid_amount: number | null
          payment_currency: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          service_type: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_user_booking_dashboard: {
        Row: {
          admin_price: number | null
          booking_id: string | null
          created_at: string | null
          currency: string | null
          locked: boolean | null
          price_status: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      current_user_roles: { Args: never; Returns: string[] }
      get_service_by_type: {
        Args: { p_type: string }
        Returns: {
          base_price: number
          currency: string
          description: string
          features: string[]
          id: string
          image_url: string
          is_active: boolean
          name: string
          type: string
        }[]
      }
      has_admin_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["admin_permission"]
          _user_id: string
        }
        Returns: boolean
      }
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
      is_admin: { Args: never; Returns: boolean }
      is_driver: { Args: never; Returns: boolean }
      is_guide: { Args: never; Returns: boolean }
      normalize_phone_e164: {
        Args: { dial_code: string; phone: string }
        Returns: string
      }
    }
    Enums: {
      admin_permission:
        | "users_create"
        | "users_delete"
        | "users_view"
        | "users_edit"
        | "bookings_view"
        | "bookings_edit"
        | "payments_view"
        | "payments_edit"
        | "drivers_manage"
        | "settings_manage"
        | "full_access"
      app_role: "admin" | "moderator" | "user" | "driver" | "guide"
      booking_status:
        | "draft"
        | "pending"
        | "under_review"
        | "approved"
        | "awaiting_payment"
        | "paid"
        | "confirmed"
        | "assigned"
        | "accepted"
        | "on_trip"
        | "completed"
        | "cancelled"
        | "rejected"
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
      admin_permission: [
        "users_create",
        "users_delete",
        "users_view",
        "users_edit",
        "bookings_view",
        "bookings_edit",
        "payments_view",
        "payments_edit",
        "drivers_manage",
        "settings_manage",
        "full_access",
      ],
      app_role: ["admin", "moderator", "user", "driver", "guide"],
      booking_status: [
        "draft",
        "pending",
        "under_review",
        "approved",
        "awaiting_payment",
        "paid",
        "confirmed",
        "assigned",
        "accepted",
        "on_trip",
        "completed",
        "cancelled",
        "rejected",
      ],
    },
  },
} as const
