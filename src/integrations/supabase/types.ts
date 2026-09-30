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
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          entry_code: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          entry_code?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          entry_code?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
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
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          post_id: string | null
          read: boolean
          recipient_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          post_id?: string | null
          read?: boolean
          recipient_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          post_id?: string | null
          read?: boolean
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comment_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          post_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          post_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comment_codes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comment_permissions: {
        Row: {
          grade: Database["public"]["Enums"]["grade_level"]
          id: string
          post_id: string
          section: string
        }
        Insert: {
          grade: Database["public"]["Enums"]["grade_level"]
          id?: string
          post_id: string
          section?: string
        }
        Update: {
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
          grade: Database["public"]["Enums"]["grade_level"]
          id: string
          post_id: string
          section: string
        }
        Insert: {
          grade: Database["public"]["Enums"]["grade_level"]
          id?: string
          post_id: string
          section?: string
        }
        Update: {
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
      post_views: {
        Row: {
          post_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachments: Json
          author_id: string
          comment_cooldown_seconds: number
          content: string
          cover_image: string | null
          created_at: string
          current_comment_code: string | null
          id: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          attachments?: Json
          author_id: string
          comment_cooldown_seconds?: number
          content?: string
          cover_image?: string | null
          created_at?: string
          current_comment_code?: string | null
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          attachments?: Json
          author_id?: string
          comment_cooldown_seconds?: number
          content?: string
          cover_image?: string | null
          created_at?: string
          current_comment_code?: string | null
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
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
          age: number | null
          created_at: string
          email: string
          full_name: string
          gender: string | null
          grade: Database["public"]["Enums"]["grade_level"]
          id: string
          is_teacher: boolean
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          section: string
          username: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email: string
          full_name: string
          gender?: string | null
          grade?: Database["public"]["Enums"]["grade_level"]
          id: string
          is_teacher?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          section?: string
          username: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string
          full_name?: string
          gender?: string | null
          grade?: Database["public"]["Enums"]["grade_level"]
          id?: string
          is_teacher?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          section?: string
          username?: string
        }
        Relationships: []
      }
      unlock_key_attempts: {
        Row: {
          attempted_at: string
          id: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          user_id?: string
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
          max_uses: number | null
          target_role: Database["public"]["Enums"]["user_role"] | null
          uses: number
        }
        Insert: {
          action: Database["public"]["Enums"]["unlock_action"]
          active?: boolean
          created_at?: string
          id?: string
          key: string
          max_uses?: number | null
          target_role?: Database["public"]["Enums"]["user_role"] | null
          uses?: number
        }
        Update: {
          action?: Database["public"]["Enums"]["unlock_action"]
          active?: boolean
          created_at?: string
          id?: string
          key?: string
          max_uses?: number | null
          target_role?: Database["public"]["Enums"]["user_role"] | null
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
      generate_comment_code: { Args: { _post: string }; Returns: Json }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"]; _uid: string }
        Returns: boolean
      }
      increment_post_views: { Args: { _post: string }; Returns: undefined }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: { Args: { _id: string }; Returns: undefined }
      redeem_unlock_key: { Args: { _key: string }; Returns: Json }
    }
    Enums: {
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
      unlock_action: "upgrade" | "downgrade" | "admin_gate"
      user_role: "default" | "poster" | "admin"
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
      unlock_action: ["upgrade", "downgrade", "admin_gate"],
      user_role: ["default", "poster", "admin"],
    },
  },
} as const
