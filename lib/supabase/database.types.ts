export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          reading_style: string;
          font_size: number;
          line_spacing: number;
          letter_spacing: number;
          focus_mode: boolean;
          audio_enabled: boolean;
          audio_speed: number;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reading_style?: string;
          font_size?: number;
          line_spacing?: number;
          letter_spacing?: number;
          focus_mode?: boolean;
          audio_enabled?: boolean;
          audio_speed?: number;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      accessibility_preferences: {
        Row: {
          id: string;
          user_id: string;
          dyslexia_support: boolean;
          focus_support: boolean;
          audio_support: boolean;
          visual_support: boolean;
          language_support: boolean;
          step_by_step_support: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dyslexia_support?: boolean;
          focus_support?: boolean;
          audio_support?: boolean;
          visual_support?: boolean;
          language_support?: boolean;
          step_by_step_support?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accessibility_preferences"]["Insert"]>;
        Relationships: [];
      };
      learning_materials: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          content_type: string;
          original_content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          content_type: string;
          original_content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["learning_materials"]["Insert"]>;
        Relationships: [];
      };
      learning_sessions: {
        Row: {
          id: string;
          user_id: string;
          material_id: string | null;
          mode: string;
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          material_id?: string | null;
          mode: string;
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["learning_sessions"]["Insert"]>;
        Relationships: [];
      };
      saved_notes: {
        Row: {
          id: string;
          user_id: string;
          material_id: string | null;
          title: string;
          content: string;
          note_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          material_id?: string | null;
          title: string;
          content: string;
          note_type: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_notes"]["Insert"]>;
        Relationships: [];
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          material_id: string | null;
          concept: string;
          status: string;
          mastery_level: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          material_id?: string | null;
          concept: string;
          status?: string;
          mastery_level?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["progress"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
