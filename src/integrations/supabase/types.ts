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
      action_drafts: {
        Row: {
          bcc_emails: string[] | null
          cc_emails: string[] | null
          created_at: string
          department: Database["public"]["Enums"]["action_department"] | null
          description: string | null
          due_date: string | null
          id: string
          meeting_date: string | null
          meeting_title: string | null
          notes: string | null
          organization_id: string | null
          owner_email: string | null
          priority: Database["public"]["Enums"]["action_priority"] | null
          progress_status: Database["public"]["Enums"]["action_progress"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          department?: Database["public"]["Enums"]["action_department"] | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_date?: string | null
          meeting_title?: string | null
          notes?: string | null
          organization_id?: string | null
          owner_email?: string | null
          priority?: Database["public"]["Enums"]["action_priority"] | null
          progress_status?:
            | Database["public"]["Enums"]["action_progress"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          department?: Database["public"]["Enums"]["action_department"] | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_date?: string | null
          meeting_title?: string | null
          notes?: string | null
          organization_id?: string | null
          owner_email?: string | null
          priority?: Database["public"]["Enums"]["action_priority"] | null
          progress_status?:
            | Database["public"]["Enums"]["action_progress"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      action_tokens: {
        Row: {
          action_data: Json | null
          action_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          action_data?: Json | null
          action_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          action_data?: Json | null
          action_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "action_tokens_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          completed: boolean
          created_at: string
          department: Database["public"]["Enums"]["action_department"]
          description: string
          due_date: string | null
          id: string
          meeting_date: string
          meeting_id: string | null
          meeting_title: string | null
          notes: string | null
          organization_id: string | null
          owner_email: string
          owner_responded_at: string | null
          owner_response: Database["public"]["Enums"]["owner_response_status"]
          priority: Database["public"]["Enums"]["action_priority"]
          progress_status: Database["public"]["Enums"]["action_progress"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          department: Database["public"]["Enums"]["action_department"]
          description: string
          due_date?: string | null
          id?: string
          meeting_date: string
          meeting_id?: string | null
          meeting_title?: string | null
          notes?: string | null
          organization_id?: string | null
          owner_email: string
          owner_responded_at?: string | null
          owner_response?: Database["public"]["Enums"]["owner_response_status"]
          priority: Database["public"]["Enums"]["action_priority"]
          progress_status?: Database["public"]["Enums"]["action_progress"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          department?: Database["public"]["Enums"]["action_department"]
          description?: string
          due_date?: string | null
          id?: string
          meeting_date?: string
          meeting_id?: string | null
          meeting_title?: string | null
          notes?: string | null
          organization_id?: string | null
          owner_email?: string
          owner_responded_at?: string | null
          owner_response?: Database["public"]["Enums"]["owner_response_status"]
          priority?: Database["public"]["Enums"]["action_priority"]
          progress_status?: Database["public"]["Enums"]["action_progress"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string
          owner_email: string
          owner_user_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id: string
          owner_email: string
          owner_user_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string
          owner_email?: string
          owner_user_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_at: string
          ics_uid: string
          id: string
          location: string | null
          organization_id: string
          start_at: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_at: string
          ics_uid?: string
          id?: string
          location?: string | null
          organization_id: string
          start_at: string
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string
          ics_uid?: string
          id?: string
          location?: string | null
          organization_id?: string
          start_at?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_email_settings: {
        Row: {
          assignment_notifications: boolean
          completion_updates: boolean
          compliance_rule: string
          due_date_reminders: boolean
          monthly_compliance_report: boolean | null
          organization_id: string
          project_handoff: boolean | null
          project_overrun: boolean | null
          project_stage_assignment: boolean | null
          updated_at: string
          updated_by: string | null
          weekly_digest: boolean
        }
        Insert: {
          assignment_notifications?: boolean
          completion_updates?: boolean
          compliance_rule?: string
          due_date_reminders?: boolean
          monthly_compliance_report?: boolean | null
          organization_id: string
          project_handoff?: boolean | null
          project_overrun?: boolean | null
          project_stage_assignment?: boolean | null
          updated_at?: string
          updated_by?: string | null
          weekly_digest?: boolean
        }
        Update: {
          assignment_notifications?: boolean
          completion_updates?: boolean
          compliance_rule?: string
          due_date_reminders?: boolean
          monthly_compliance_report?: boolean | null
          organization_id?: string
          project_handoff?: boolean | null
          project_overrun?: boolean | null
          project_stage_assignment?: boolean | null
          updated_at?: string
          updated_by?: string | null
          weekly_digest?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organization_email_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          last_resend_error: string | null
          last_resend_status: string | null
          last_resent_at: string | null
          organization_id: string
          resend_count: number
          role: Database["public"]["Enums"]["org_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          last_resend_error?: string | null
          last_resend_status?: string | null
          last_resent_at?: string | null
          organization_id: string
          resend_count?: number
          role?: Database["public"]["Enums"]["org_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          last_resend_error?: string | null
          last_resend_status?: string | null
          last_resent_at?: string | null
          organization_id?: string
          resend_count?: number
          role?: Database["public"]["Enums"]["org_role"]
        }
        Relationships: [
          {
            foreignKeyName: "pending_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_stages: {
        Row: {
          action_id: string | null
          actual_end_date: string | null
          actual_start_date: string | null
          created_at: string
          depends_on_stage_id: string | null
          id: string
          notes: string | null
          owner_email: string
          owner_user_id: string | null
          planned_duration_days: number
          planned_end_date: string | null
          planned_start_date: string | null
          progress_status: Database["public"]["Enums"]["action_progress"]
          project_id: string
          sequence: number
          skill_required: string | null
          status: Database["public"]["Enums"]["stage_status"]
          title: string
          updated_at: string
        }
        Insert: {
          action_id?: string | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string
          depends_on_stage_id?: string | null
          id?: string
          notes?: string | null
          owner_email: string
          owner_user_id?: string | null
          planned_duration_days?: number
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_status?: Database["public"]["Enums"]["action_progress"]
          project_id: string
          sequence: number
          skill_required?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          title: string
          updated_at?: string
        }
        Update: {
          action_id?: string | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string
          depends_on_stage_id?: string | null
          id?: string
          notes?: string | null
          owner_email?: string
          owner_user_id?: string | null
          planned_duration_days?: number
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_status?: Database["public"]["Enums"]["action_progress"]
          project_id?: string
          sequence?: number
          skill_required?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_depends_on_stage_id_fkey"
            columns: ["depends_on_stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collaborative_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["todo_priority"]
          status: Database["public"]["Enums"]["todo_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["todo_priority"]
          status?: Database["public"]["Enums"]["todo_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["todo_priority"]
          status?: Database["public"]["Enums"]["todo_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_email_settings: {
        Row: {
          assignment_notifications: boolean | null
          completion_updates: boolean | null
          due_date_reminders: boolean | null
          monthly_compliance_report: boolean | null
          organization_id: string | null
          project_handoff: boolean | null
          project_overrun: boolean | null
          project_stage_assignment: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          assignment_notifications?: boolean | null
          completion_updates?: boolean | null
          due_date_reminders?: boolean | null
          monthly_compliance_report?: boolean | null
          organization_id?: string | null
          project_handoff?: boolean | null
          project_overrun?: boolean | null
          project_stage_assignment?: boolean | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          assignment_notifications?: boolean | null
          completion_updates?: boolean | null
          due_date_reminders?: boolean | null
          monthly_compliance_report?: boolean | null
          organization_id?: string | null
          project_handoff?: boolean | null
          project_overrun?: boolean | null
          project_stage_assignment?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_action_token_by_id_and_token: {
        Args: { p_action_id: string; p_token: string }
        Returns: {
          action_data: Json | null
          action_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "action_tokens"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_effective_email_pref: {
        Args: { _key: string; _org_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      action_department:
        | "NTSA/KRA"
        | "Biashara"
        | "Agribusiness"
        | "Business Development & Strategy"
        | "Finance"
        | "ICT"
        | "Credit"
        | "Collections & Settlements"
        | "Operations"
        | "Sales Support & Data"
        | "Call Centre"
        | "Delinquency"
        | "Legal"
        | "RISK & COMPLIANCE"
        | "HR & Admin"
        | "Customer Experience & Marketing"
        | "Asset Finance"
        | "Checkoff & Personal Loans"
      action_priority: "high" | "medium" | "low"
      action_progress: "Not Started" | "25%" | "50%" | "75%" | "100%"
      app_role: "super_admin" | "admin" | "moderator"
      org_role: "admin" | "member"
      owner_response_status: "pending" | "accepted" | "rejected"
      project_status: "planning" | "active" | "completed" | "cancelled"
      stage_status: "locked" | "ready" | "in_progress" | "completed" | "overdue"
      subscription_plan: "free" | "basic" | "premium"
      subscription_status: "active" | "expired" | "cancelled"
      todo_priority: "low" | "medium" | "high"
      todo_status: "todo" | "in_progress" | "done"
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
      action_department: [
        "NTSA/KRA",
        "Biashara",
        "Agribusiness",
        "Business Development & Strategy",
        "Finance",
        "ICT",
        "Credit",
        "Collections & Settlements",
        "Operations",
        "Sales Support & Data",
        "Call Centre",
        "Delinquency",
        "Legal",
        "RISK & COMPLIANCE",
        "HR & Admin",
        "Customer Experience & Marketing",
        "Asset Finance",
        "Checkoff & Personal Loans",
      ],
      action_priority: ["high", "medium", "low"],
      action_progress: ["Not Started", "25%", "50%", "75%", "100%"],
      app_role: ["super_admin", "admin", "moderator"],
      org_role: ["admin", "member"],
      owner_response_status: ["pending", "accepted", "rejected"],
      project_status: ["planning", "active", "completed", "cancelled"],
      stage_status: ["locked", "ready", "in_progress", "completed", "overdue"],
      subscription_plan: ["free", "basic", "premium"],
      subscription_status: ["active", "expired", "cancelled"],
      todo_priority: ["low", "medium", "high"],
      todo_status: ["todo", "in_progress", "done"],
    },
  },
} as const
