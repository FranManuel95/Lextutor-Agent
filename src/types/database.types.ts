export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "user" | "admin";
          study_mode: string | null;
          birthdate: string | null;
          avatar_url: string | null;
          tutor_prefs: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "user" | "admin";
          study_mode?: string | null;
          birthdate?: string | null;
          avatar_url?: string | null;
          tutor_prefs?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: "user" | "admin";
          study_mode?: string | null;
          birthdate?: string | null;
          avatar_url?: string | null;
          tutor_prefs?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          audio_path: string | null;
          transcript: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          audio_path?: string | null;
          transcript?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          audio_path?: string | null;
          transcript?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      student_events: {
        Row: {
          id: string;
          user_id: string;
          chat_id: string | null;
          message_id: string | null;
          area: string | null;
          kind: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chat_id?: string | null;
          message_id?: string | null;
          area?: string | null;
          kind: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          chat_id?: string | null;
          message_id?: string | null;
          area?: string | null;
          kind?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_summaries: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          summary_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          summary_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          user_id?: string;
          summary_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rag_documents: {
        Row: {
          id: string;
          store_name: string | null;
          document_name: string | null;
          display_name: string | null;
          area: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_name?: string | null;
          document_name?: string | null;
          display_name?: string | null;
          area?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_name?: string | null;
          document_name?: string | null;
          display_name?: string | null;
          area?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exam_attempts: {
        Row: {
          id: string;
          user_id: string;
          chat_id: string | null;
          attempt_type: "quiz" | "exam_test" | "exam_open";
          area: "laboral" | "civil" | "mercantil" | "procesal" | "otro" | "general";
          score: number;
          status: "in_progress" | "finished";
          questions_count: number | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chat_id?: string | null;
          attempt_type: "quiz" | "exam_test" | "exam_open";
          area: "laboral" | "civil" | "mercantil" | "procesal" | "otro" | "general";
          score: number;
          status: "in_progress" | "finished";
          questions_count?: number | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          chat_id?: string | null;
          attempt_type?: "quiz" | "exam_test" | "exam_open";
          area?: "laboral" | "civil" | "mercantil" | "procesal" | "otro" | "general";
          score?: number;
          status?: "in_progress" | "finished";
          questions_count?: number | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
