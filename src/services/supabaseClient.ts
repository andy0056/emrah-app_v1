import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Types for our database schema
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          form_data: any;
          base_prompts: any;
          enhanced_prompts: any;
          brand: string | null;
          product: string | null;
          stand_type: string | null;
          status: 'draft' | 'in_progress' | 'completed' | 'archived';
          is_public: boolean;
          share_token: string;
          created_at: string;
          updated_at: string;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          form_data: any;
          base_prompts?: any;
          enhanced_prompts?: any;
          brand?: string | null;
          product?: string | null;
          stand_type?: string | null;
          status?: 'draft' | 'in_progress' | 'completed' | 'archived';
          is_public?: boolean;
          share_token?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          form_data?: any;
          base_prompts?: any;
          enhanced_prompts?: any;
          brand?: string | null;
          product?: string | null;
          stand_type?: string | null;
          status?: 'draft' | 'in_progress' | 'completed' | 'archived';
          is_public?: boolean;
        };
      };
      project_versions: {
        Row: {
          id: string;
          project_id: string;
          version_number: number;
          form_data: any;
          base_prompts: any;
          enhanced_prompts: any;
          version_name: string | null;
          change_notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version_number?: number;
          form_data: any;
          base_prompts?: any;
          enhanced_prompts?: any;
          version_name?: string | null;
          change_notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          version_name?: string | null;
          change_notes?: string | null;
        };
      };
      generated_images: {
        Row: {
          id: string;
          project_id: string;
          version_id: string | null;
          image_type: 'front_view' | 'store_view' | 'three_quarter_view' | 'edited';
          image_url: string;
          storage_path: string | null;
          prompt_used: string | null;
          model_used: string;
          generation_params: any;
          aspect_ratio: string | null;
          file_size: number | null;
          width: number | null;
          height: number | null;
          status: 'generating' | 'generated' | 'failed' | 'archived';
          quality_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version_id?: string | null;
          image_type: 'front_view' | 'store_view' | 'three_quarter_view' | 'edited';
          image_url: string;
          storage_path?: string | null;
          prompt_used?: string | null;
          model_used?: string;
          generation_params?: any;
          aspect_ratio?: string | null;
          file_size?: number | null;
          width?: number | null;
          height?: number | null;
          status?: 'generating' | 'generated' | 'failed' | 'archived';
          quality_score?: number | null;
        };
        Update: {
          status?: 'generating' | 'generated' | 'failed' | 'archived';
          quality_score?: number | null;
          file_size?: number | null;
          width?: number | null;
          height?: number | null;
        };
      };
      project_exports: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          export_type: 'pdf' | 'zip' | 'json' | 'images_only';
          file_path: string | null;
          file_size: number | null;
          includes_images: boolean;
          includes_prompts: boolean;
          includes_form_data: boolean;
          export_format_version: string;
          created_at: string;
          downloaded_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          export_type: 'pdf' | 'zip' | 'json' | 'images_only';
          file_path?: string | null;
          file_size?: number | null;
          includes_images?: boolean;
          includes_prompts?: boolean;
          includes_form_data?: boolean;
          export_format_version?: string;
        };
        Update: {
          file_path?: string | null;
          file_size?: number | null;
          downloaded_at?: string | null;
        };
      };
    };
  };
}

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type ProjectVersion = Database['public']['Tables']['project_versions']['Row'];
export type ProjectVersionInsert = Database['public']['Tables']['project_versions']['Insert'];

export type GeneratedImage = Database['public']['Tables']['generated_images']['Row'];
export type GeneratedImageInsert = Database['public']['Tables']['generated_images']['Insert'];

export type ProjectExport = Database['public']['Tables']['project_exports']['Row'];
export type ProjectExportInsert = Database['public']['Tables']['project_exports']['Insert'];