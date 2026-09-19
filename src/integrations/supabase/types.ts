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
      activities: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      anthology_settings: {
        Row: {
          academic_year: string
          accent_color: string
          closing_text: string
          created_at: string
          id: string
          intro_text: string
          layout_map: Json
          logo_url: string | null
          owner_id: string
          post_ids: Json
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          accent_color?: string
          closing_text?: string
          created_at?: string
          id?: string
          intro_text?: string
          layout_map?: Json
          logo_url?: string | null
          owner_id: string
          post_ids?: Json
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          accent_color?: string
          closing_text?: string
          created_at?: string
          id?: string
          intro_text?: string
          layout_map?: Json
          logo_url?: string | null
          owner_id?: string
          post_ids?: Json
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anthology_settings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          grade_label: string
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          grade_label: string
          id?: string
          label: string
        }
        Update: {
          created_at?: string
          grade_label?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      comment_sessions: {
        Row: {
          active: boolean
          class_label: string | null
          code: string
          created_at: string
          created_by: string
          duration_minutes: number
          expires_at: string
          grade_label: string | null
          id: string
          post_id: string
          started_at: string
        }
        Insert: {
          active?: boolean
          class_label?: string | null
          code: string
          created_at?: string
          created_by: string
          duration_minutes?: number
          expires_at: string
          grade_label?: string | null
          id?: string
          post_id: string
          started_at?: string
        }
        Update: {
          active?: boolean
          class_label?: string | null
          code?: string
          created_at?: string
          created_by?: string
          duration_minutes?: number
          expires_at?: string
          grade_label?: string | null
          id?: string
          post_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_sessions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_class: string | null
          author_grade: string | null
          author_id: string
          author_login_id: string
          content: string
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          parent_id: string | null
          post_id: string
          session_id: string | null
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
        }
        Insert: {
          author_class?: string | null
          author_grade?: string | null
          author_id: string
          author_login_id?: string
          content: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          parent_id?: string | null
          post_id: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
        }
        Update: {
          author_class?: string | null
          author_grade?: string | null
          author_id?: string
          author_login_id?: string
          content?: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          parent_id?: string | null
          post_id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "comment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      post_comment_permissions: {
        Row: {
          created_at: string
          grade: Database["public"]["Enums"]["grade_level"]
          id: string
          post_id: string
          section: string
        }
        Insert: {
          created_at?: string
          grade: Database["public"]["Enums"]["grade_level"]
          id?: string
          post_id: string
          section?: string
        }
        Update: {
          created_at?: string
          grade?: Database["public"]["Enums"]["grade_level"]
          id?: string
          post_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comment_permissions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_view_permissions: {
        Row: {
          created_at: string
          grade: Database["public"]["Enums"]["grade_level"]
          id: string
          post_id: string
          section: string
        }
        Insert: {
          created_at?: string
          grade: Database["public"]["Enums"]["grade_level"]
          id?: string
          post_id: string
          section?: string
        }
        Update: {
          created_at?: string
          grade?: Database["public"]["Enums"]["grade_level"]
          id?: string
          post_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_view_permissions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_visibility: {
        Row: {
          grade_label: string
          id: string
          post_id: string
        }
        Insert: {
          grade_label: string
          id?: string
          post_id: string
        }
        Update: {
          grade_label?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_visibility_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          academic_year: string
          activity_id: string | null
          attachments: Json
          author_id: string
          caption: string
          class_label: string | null
          comment_cooldown_seconds: number
          content: string
          cover_image: string | null
          created_at: string
          featured: boolean
          grade_label: string | null
          id: string
          image_path: string | null
          image_url: string | null
          status: Database["public"]["Enums"]["post_status"]
          student_names: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
          visibility: Database["public"]["Enums"]["view_scope"]
        }
        Insert: {
          academic_year?: string
          activity_id?: string | null
          attachments?: Json
          author_id: string
          caption?: string
          class_label?: string | null
          comment_cooldown_seconds?: number
          content?: string
          cover_image?: string | null
          created_at?: string
          featured?: boolean
          grade_label?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          student_names?: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["view_scope"]
        }
        Update: {
          academic_year?: string
          activity_id?: string | null
          attachments?: Json
          author_id?: string
          caption?: string
          class_label?: string | null
          comment_cooldown_seconds?: number
          content?: string
          cover_image?: string | null
          created_at?: string
          featured?: boolean
          grade_label?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          student_names?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["view_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_role: Database["public"]["Enums"]["app_role"]
          class_label: string | null
          created_at: string
          email: string
          full_name: string | null
          grade: Database["public"]["Enums"]["grade_level"]
          grade_label: string | null
          id: string
          login_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          section: string
          username: string
        }
        Insert: {
          app_role?: Database["public"]["Enums"]["app_role"]
          class_label?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          grade?: Database["public"]["Enums"]["grade_level"]
          grade_label?: string | null
          id: string
          login_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          section?: string
          username: string
        }
        Update: {
          app_role?: Database["public"]["Enums"]["app_role"]
          class_label?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          grade?: Database["public"]["Enums"]["grade_level"]
          grade_label?: string | null
          id?: string
          login_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          section?: string
          username?: string
        }
        Relationships: []
      }
      staff_registry: {
        Row: {
          created_at: string
          full_name: string
          login_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          full_name: string
          login_id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          full_name?: string
          login_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      unlock_keys: {
        Row: {
          action: Database["public"]["Enums"]["unlock_action"]
          active: boolean
          created_at: string
          id: string
          key: string
          max_uses: number
          target_role: Database["public"]["Enums"]["user_role"]
          uses: number
        }
        Insert: {
          action?: Database["public"]["Enums"]["unlock_action"]
          active?: boolean
          created_at?: string
          id?: string
          key: string
          max_uses?: number
          target_role?: Database["public"]["Enums"]["user_role"]
          uses?: number
        }
        Update: {
          action?: Database["public"]["Enums"]["unlock_action"]
          active?: boolean
          created_at?: string
          id?: string
          key?: string
          max_uses?: number
          target_role?: Database["public"]["Enums"]["user_role"]
          uses?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_comment_post: { Args: { _post: string }; Returns: boolean }
      can_view_post: { Args: { _post: string }; Returns: boolean }
      comment_session_state: { Args: { _post: string }; Returns: Json }
      comment_wait_seconds: { Args: { _post: string }; Returns: number }
      current_grade: {
        Args: never
        Returns: Database["public"]["Enums"]["grade_level"]
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_section: { Args: never; Returns: string }
      gen_comment_code: {
        Args: { _class: string; _grade: string }
        Returns: string
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"]; _uid: string }
        Returns: boolean
      }
      increment_post_views: { Args: { _post: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      my_class: { Args: never; Returns: string }
      my_grade: { Args: never; Returns: string }
      redeem_unlock_key: { Args: { _key: string }; Returns: Json }
      start_comment_session: {
        Args: {
          _class: string
          _grade: string
          _minutes: number
          _post: string
        }
        Returns: Json
      }
      stop_comment_session: { Args: { _session: string }; Returns: Json }
      submit_comment: {
        Args: { _code: string; _content: string; _post: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      comment_status: "pending" | "approved" | "rejected"
      grade_level:
        | "1"
        | "2"
        | "3"
        | "4"
        | "5"
        | "6"
        | "7"
        | "8"
        | "9"
        | "10"
        | "11"
        | "12"
      post_status: "draft" | "published"
      unlock_action: "upgrade" | "downgrade"
      user_role: "default" | "poster" | "admin"
      view_scope: "public" | "school" | "authenticated"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "teacher", "admin"],
      comment_status: ["pending", "approved", "rejected"],
      grade_level: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
      ],
      post_status: ["draft", "published"],
      unlock_action: ["upgrade", "downgrade"],
      user_role: ["default", "poster", "admin"],
      view_scope: ["public", "school", "authenticated"],
    },
  },
} as const
