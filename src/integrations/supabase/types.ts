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
      ai_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          data_source: string
          generated_at: string
          id: string
          insight_text: string
          recommendations: string | null
          source_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          data_source: string
          generated_at?: string
          id?: string
          insight_text: string
          recommendations?: string | null
          source_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          data_source?: string
          generated_at?: string
          id?: string
          insight_text?: string
          recommendations?: string | null
          source_id?: string | null
        }
        Relationships: []
      }
      doctor_monthly_data: {
        Row: {
          cost_savings: number | null
          cp_ratio: number | null
          cpg_mismatch: number | null
          cpg_mismatch_percentage: number | null
          created_at: string
          doctor_id: string
          duplicate_order_rate: number | null
          duplicate_tests: number | null
          estimated_cost: number | null
          id: string
          lp_ratio: number | null
          month: string
          patients_count: number | null
          rlu_score: number | null
          test_reduction: number | null
          total_lab: number | null
          total_patient: number | null
          total_tests: number | null
          updated_at: string
          year: number
        }
        Insert: {
          cost_savings?: number | null
          cp_ratio?: number | null
          cpg_mismatch?: number | null
          cpg_mismatch_percentage?: number | null
          created_at?: string
          doctor_id: string
          duplicate_order_rate?: number | null
          duplicate_tests?: number | null
          estimated_cost?: number | null
          id?: string
          lp_ratio?: number | null
          month: string
          patients_count?: number | null
          rlu_score?: number | null
          test_reduction?: number | null
          total_lab?: number | null
          total_patient?: number | null
          total_tests?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          cost_savings?: number | null
          cp_ratio?: number | null
          cpg_mismatch?: number | null
          cpg_mismatch_percentage?: number | null
          created_at?: string
          doctor_id?: string
          duplicate_order_rate?: number | null
          duplicate_tests?: number | null
          estimated_cost?: number | null
          id?: string
          lp_ratio?: number | null
          month?: string
          patients_count?: number | null
          rlu_score?: number | null
          test_reduction?: number | null
          total_lab?: number | null
          total_patient?: number | null
          total_tests?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_monthly_data_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string
          id: string
          name: string
          specialty: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department: string
          id?: string
          name: string
          specialty: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string
          id?: string
          name?: string
          specialty?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_log: {
        Row: {
          comment: string | null
          created_at: string
          feedback_date: string
          id: string
          physician_name: string
          rating: number | null
          signature_url: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_date: string
          id?: string
          physician_name: string
          rating?: number | null
          signature_url?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_date?: string
          id?: string
          physician_name?: string
          rating?: number | null
          signature_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mismatch_analysis: {
        Row: {
          aptt_breakdown: string | null
          aptt_count: number | null
          aptt_top_mismatch: string | null
          created_at: string
          doctor_id: string
          fbs_breakdown: string | null
          fbs_count: number | null
          fbs_top_mismatch: string | null
          ft3_breakdown: string | null
          ft3_count: number | null
          ft3_top_mismatch: string | null
          ft4_breakdown: string | null
          ft4_count: number | null
          ft4_top_mismatch: string | null
          hba1c_breakdown: string | null
          hba1c_count: number | null
          hba1c_top_mismatch: string | null
          id: string
          lft_breakdown: string | null
          lft_count: number | null
          lft_top_mismatch: string | null
          lipid_profile_breakdown: string | null
          lipid_profile_count: number | null
          lipid_profile_top_mismatch: string | null
          month: string
          updated_at: string
          year: number
        }
        Insert: {
          aptt_breakdown?: string | null
          aptt_count?: number | null
          aptt_top_mismatch?: string | null
          created_at?: string
          doctor_id: string
          fbs_breakdown?: string | null
          fbs_count?: number | null
          fbs_top_mismatch?: string | null
          ft3_breakdown?: string | null
          ft3_count?: number | null
          ft3_top_mismatch?: string | null
          ft4_breakdown?: string | null
          ft4_count?: number | null
          ft4_top_mismatch?: string | null
          hba1c_breakdown?: string | null
          hba1c_count?: number | null
          hba1c_top_mismatch?: string | null
          id?: string
          lft_breakdown?: string | null
          lft_count?: number | null
          lft_top_mismatch?: string | null
          lipid_profile_breakdown?: string | null
          lipid_profile_count?: number | null
          lipid_profile_top_mismatch?: string | null
          month: string
          updated_at?: string
          year: number
        }
        Update: {
          aptt_breakdown?: string | null
          aptt_count?: number | null
          aptt_top_mismatch?: string | null
          created_at?: string
          doctor_id?: string
          fbs_breakdown?: string | null
          fbs_count?: number | null
          fbs_top_mismatch?: string | null
          ft3_breakdown?: string | null
          ft3_count?: number | null
          ft3_top_mismatch?: string | null
          ft4_breakdown?: string | null
          ft4_count?: number | null
          ft4_top_mismatch?: string | null
          hba1c_breakdown?: string | null
          hba1c_count?: number | null
          hba1c_top_mismatch?: string | null
          id?: string
          lft_breakdown?: string | null
          lft_count?: number | null
          lft_top_mismatch?: string | null
          lipid_profile_breakdown?: string | null
          lipid_profile_count?: number | null
          lipid_profile_top_mismatch?: string | null
          month?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_mismatch_analysis_doctor_id"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      mismatch_data: {
        Row: {
          aptt_mismatch: number | null
          created_at: string
          doctor_id: string
          fbs_mismatch: number | null
          ft3_mismatch: number | null
          ft4_mismatch: number | null
          hba1c_mismatch: number | null
          id: string
          lft_mismatch: number | null
          lipid_profile_mismatch: number | null
          month: string
          total_mismatch: number | null
          updated_at: string
          year: number
        }
        Insert: {
          aptt_mismatch?: number | null
          created_at?: string
          doctor_id: string
          fbs_mismatch?: number | null
          ft3_mismatch?: number | null
          ft4_mismatch?: number | null
          hba1c_mismatch?: number | null
          id?: string
          lft_mismatch?: number | null
          lipid_profile_mismatch?: number | null
          month: string
          total_mismatch?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          aptt_mismatch?: number | null
          created_at?: string
          doctor_id?: string
          fbs_mismatch?: number | null
          ft3_mismatch?: number | null
          ft4_mismatch?: number | null
          hba1c_mismatch?: number | null
          id?: string
          lft_mismatch?: number | null
          lipid_profile_mismatch?: number | null
          month?: string
          total_mismatch?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_mismatch_data_doctor_id"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      physician_summary: {
        Row: {
          cost_impact: number | null
          created_at: string
          department: string
          id: string
          improvement_score: number | null
          physician_name: string
          rlu_score: number | null
          test_pass_rate: number | null
          total_tests: number | null
          updated_at: string
        }
        Insert: {
          cost_impact?: number | null
          created_at?: string
          department: string
          id?: string
          improvement_score?: number | null
          physician_name: string
          rlu_score?: number | null
          test_pass_rate?: number | null
          total_tests?: number | null
          updated_at?: string
        }
        Update: {
          cost_impact?: number | null
          created_at?: string
          department?: string
          id?: string
          improvement_score?: number | null
          physician_name?: string
          rlu_score?: number | null
          test_pass_rate?: number | null
          total_tests?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_metadata: {
        Row: {
          created_at: string
          hospital_name: string
          id: string
          milestone_data: Json | null
          report_period: string
          summary_stats: Json | null
          total_physicians: number | null
          total_savings: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hospital_name: string
          id?: string
          milestone_data?: Json | null
          report_period: string
          summary_stats?: Json | null
          total_physicians?: number | null
          total_savings?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hospital_name?: string
          id?: string
          milestone_data?: Json | null
          report_period?: string
          summary_stats?: Json | null
          total_physicians?: number | null
          total_savings?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rlu_kpi: {
        Row: {
          cost_savings: number | null
          cpg_mismatch: number | null
          created_at: string
          department: string
          duplicate_tests: number | null
          id: string
          month: string
          total_tests: number | null
          updated_at: string
          utilization_rate: number | null
        }
        Insert: {
          cost_savings?: number | null
          cpg_mismatch?: number | null
          created_at?: string
          department: string
          duplicate_tests?: number | null
          id?: string
          month: string
          total_tests?: number | null
          updated_at?: string
          utilization_rate?: number | null
        }
        Update: {
          cost_savings?: number | null
          cpg_mismatch?: number | null
          created_at?: string
          department?: string
          duplicate_tests?: number | null
          id?: string
          month?: string
          total_tests?: number | null
          updated_at?: string
          utilization_rate?: number | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          id: string
          role: string
          route: string
          updated_at: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          id?: string
          role: string
          route: string
          updated_at?: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          id?: string
          role?: string
          route?: string
          updated_at?: string
        }
        Relationships: []
      }
      sheets_sync_status: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_synced: string | null
          sheet_id: string
          sheet_name: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced?: string | null
          sheet_id: string
          sheet_name: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced?: string | null
          sheet_id?: string
          sheet_name?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      table_name: {
        Row: {
          data: Json | null
          id: number
          inserted_at: string
          name: string | null
          updated_at: string
        }
        Insert: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          password: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          id?: string
          last_login?: string | null
          name: string
          password?: string | null
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          password?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { _role: string }
        Returns: boolean
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
