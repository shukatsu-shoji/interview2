import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // 本番環境では email confirmation を有効にする
    flowType: 'pkce',
    // ローカル開発環境での設定を追加
    debug: process.env.NODE_ENV === 'development'
  },
  // ローカル開発環境でのリクエスト設定
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// 本番環境用の設定チェック
if (process.env.NODE_ENV === 'production') {
  // 本番環境でのSupabase設定確認
  console.log('Production Supabase configuration loaded');
  
  // URL検証
  if (!supabaseUrl.includes('supabase.co')) {
    console.warn('⚠️ Supabase URL format may be incorrect');
  }
  
  // 開発用URLの検出
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.error('🚨 Development Supabase URL detected in production!');
  }
} else {
  // 開発環境での設定確認
  console.log('Development Supabase configuration loaded');
  console.log('Make sure your Supabase project is configured for local development:');
  console.log('1. Site URL: http://localhost:5173');
  console.log('2. Redirect URLs: http://localhost:5173/auth/callback');
}

// Database types
export interface Database {
  public: {
    Tables: {
      interview_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          created_at: string;
          industry: string | null;
          duration: number | null;
          interview_type: string | null;
          question_count: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          created_at?: string;
          industry?: string | null;
          duration?: number | null;
          interview_type?: string | null;
          question_count?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          created_at?: string;
          industry?: string | null;
          duration?: number | null;
          interview_type?: string | null;
          question_count?: number | null;
        };
      };
      user_feedback: {
        Row: {
          id: string;
          user_id: string | null;
          rating: number;
          category: string;
          title: string;
          description: string;
          email: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          rating: number;
          category: string;
          title: string;
          description: string;
          email?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          rating?: number;
          category?: string;
          title?: string;
          description?: string;
          email?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}