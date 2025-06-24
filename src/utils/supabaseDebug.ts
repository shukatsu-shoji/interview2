// Supabaseデバッグ用ユーティリティ
import { supabase } from '../lib/supabase';

export const debugSupabaseConnection = async () => {
  console.log('=== Supabase Debug Info ===');
  
  // 1. 環境変数の確認
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
  
  // 2. 現在のセッション確認
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current Session:', session);
    console.log('Session Error:', error);
  } catch (error) {
    console.error('Session Error:', error);
  }
  
  // 3. 現在のユーザー確認
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('Current User:', user);
    console.log('User Error:', error);
  } catch (error) {
    console.error('User Error:', error);
  }
  
  // 4. データベース接続テスト
  try {
    const { data, error } = await supabase
      .from('interview_usage_logs')
      .select('count', { count: 'exact', head: true });
    console.log('Database Connection Test:', { data, error });
  } catch (error) {
    console.error('Database Connection Error:', error);
  }
};

// 管理者用：全ユーザー情報取得（開発環境のみ）
export const debugAllUsers = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('This function should only be used in development');
    return;
  }
  
  try {
    // Note: これは通常のユーザーには権限がないため、Service Role Keyが必要
    const { data, error } = await supabase.auth.admin.listUsers();
    console.log('All Users (Admin):', data);
    console.log('Admin Error:', error);
  } catch (error) {
    console.error('Admin Users Error:', error);
  }
};