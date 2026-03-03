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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          max_points: number | null
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          max_points?: number | null
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          max_points?: number | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_by: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: []
      }
      call_sessions: {
        Row: {
          call_type: string
          caller_id: string
          class_id: string
          created_at: string
          ended_at: string | null
          id: string
          receiver_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          call_type?: string
          caller_id: string
          class_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          receiver_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          class_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          receiver_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          cover_color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          class_code: string
          cover_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          class_code?: string
          cover_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gpa_courses: {
        Row: {
          course_name: string
          created_at: string
          credits: number
          grade: string
          grade_points: number
          id: string
          record_id: string
        }
        Insert: {
          course_name: string
          created_at?: string
          credits?: number
          grade?: string
          grade_points?: number
          id?: string
          record_id: string
        }
        Update: {
          course_name?: string
          created_at?: string
          credits?: number
          grade?: string
          grade_points?: number
          id?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gpa_courses_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "gpa_records"
            referencedColumns: ["id"]
          },
        ]
      }
      gpa_records: {
        Row: {
          created_at: string
          gpa: number
          id: string
          semester_name: string
          semester_order: number
          student_id: string
          total_credits: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gpa?: number
          id?: string
          semester_name: string
          semester_order?: number
          student_id: string
          total_credits?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gpa?: number
          id?: string
          semester_name?: string
          semester_order?: number
          student_id?: string
          total_credits?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gpa_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          class_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          class_id: string
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          class_id?: string
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      question_papers: {
        Row: {
          class_id: string | null
          created_at: string
          file_name: string
          file_url: string
          id: string
          subject: string
          title: string
          uploaded_by: string
          year: number
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          subject: string
          title: string
          uploaded_by: string
          year: number
        }
        Update: {
          class_id?: string | null
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          subject?: string
          title?: string
          uploaded_by?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_papers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_papers_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recorded_videos: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          file_name: string
          id: string
          title: string
          uploaded_by: string
          video_url: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          file_name: string
          id?: string
          title: string
          uploaded_by: string
          video_url: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          id?: string
          title?: string
          uploaded_by?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "recorded_videos_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recorded_videos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          reminder_date: string
          reminder_time: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          reminder_date: string
          reminder_time?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          reminder_date?: string
          reminder_time?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_name: string | null
          file_url: string | null
          grade: number | null
          id: string
          student_id: string
          submitted_at: string
          text_content: string | null
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_name?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          student_id: string
          submitted_at?: string
          text_content?: string | null
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_name?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          student_id?: string
          submitted_at?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_strategies: {
        Row: {
          class_id: string
          content: string
          created_at: string
          date: string
          id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          content: string
          created_at?: string
          date?: string
          id?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          content?: string
          created_at?: string
          date?: string
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_strategies_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_strategies_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { _target_profile_id: string; _viewer_user_id: string }
        Returns: boolean
      }
      create_system_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      find_class_by_code: {
        Args: { _code: string }
        Returns: {
          class_code: string
          cover_color: string
          created_at: string
          description: string
          id: string
          name: string
          teacher_id: string
        }[]
      }
      generate_class_code: { Args: never; Returns: string }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late"
      user_role: "student" | "teacher"
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
      attendance_status: ["present", "absent", "late"],
      user_role: ["student", "teacher"],
    },
  },
} as const
