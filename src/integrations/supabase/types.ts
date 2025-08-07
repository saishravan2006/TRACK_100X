export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      classes: {
        Row: {
          class_name: string
          class_type: string
          created_at: string
          date: string | null
          end_time: string | null
          fees: number
          id: string
          location: string
          notes: string | null
          repeat_days: string[] | null
          start_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          class_name: string
          class_type?: string
          created_at?: string
          date?: string | null
          end_time?: string | null
          fees?: number
          id?: string
          location: string
          notes?: string | null
          repeat_days?: string[] | null
          start_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          class_name?: string
          class_type?: string
          created_at?: string
          date?: string | null
          end_time?: string | null
          fees?: number
          id?: string
          location?: string
          notes?: string | null
          repeat_days?: string[] | null
          start_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          id: string
          raw_data: Json | null
          row_number: number | null
          student_reference: string | null
          upload_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          raw_data?: Json | null
          row_number?: number | null
          student_reference?: string | null
          upload_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          raw_data?: Json | null
          row_number?: number | null
          student_reference?: string | null
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_errors_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "payment_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_uploads: {
        Row: {
          created_at: string
          error_log: Json | null
          failed_records: number
          file_name: string
          id: string
          processed_records: number
          status: string
          total_records: number
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_log?: Json | null
          failed_records?: number
          file_name: string
          id?: string
          processed_records?: number
          status?: string
          total_records?: number
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_log?: Json | null
          failed_records?: number
          file_name?: string
          id?: string
          processed_records?: number
          status?: string
          total_records?: number
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          payment_date: string
          remarks: string | null
          status: string
          student_id: string
          transaction_ref: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          payment_date?: string
          remarks?: string | null
          status?: string
          student_id: string
          transaction_ref?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payment_date?: string
          remarks?: string | null
          status?: string
          student_id?: string
          transaction_ref?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_archive: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          payment_date: string
          remarks: string | null
          status: string
          student_id: string
          transaction_ref: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          payment_date?: string
          remarks?: string | null
          status?: string
          student_id: string
          transaction_ref?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payment_date?: string
          remarks?: string | null
          status?: string
          student_id?: string
          transaction_ref?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          mobile: string | null
          name: string
          service_type: string | null
          student_limit: number | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mobile?: string | null
          name: string
          service_type?: string | null
          student_limit?: number | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mobile?: string | null
          name?: string
          service_type?: string | null
          student_limit?: number | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_balances: {
        Row: {
          current_balance: number
          id: string
          last_payment_date: string | null
          student_id: string
          total_fees: number
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_balance?: number
          id?: string
          last_payment_date?: string | null
          student_id: string
          total_fees?: number
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_balance?: number
          id?: string
          last_payment_date?: string | null
          student_id?: string
          total_fees?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_balances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_name: string
          created_at: string
          email: string | null
          fees: number
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          email?: string | null
          fees?: number
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          email?: string | null
          fees?: number
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          student_id?: string
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
      recalculate_payment_status: {
        Args: { student_uuid: string; user_uuid: string }
        Returns: undefined
      }
      reset_monthly_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
