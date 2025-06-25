import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 現在のセッション取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          
          // Check for invalid refresh token errors and clear session
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found') ||
              error.message?.includes('Session from session_id claim in JWT does not exist')) {
            console.log('Invalid or expired session detected, clearing session...');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        
        // Also handle caught errors that might contain session issues
        if (error instanceof Error && 
            (error.message?.includes('Invalid Refresh Token') || 
             error.message?.includes('Refresh Token Not Found') ||
             error.message?.includes('Session from session_id claim in JWT does not exist'))) {
          console.log('Invalid session detected in catch, clearing session...');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // ユーザー切り替え時の処理
        if (event === 'SIGNED_IN' && session) {
          // URLのハッシュフラグメントをクリア（認証トークンを削除）
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          // 新しいユーザーでログインした場合、前のユーザーのデータをクリア
          const previousUserId = localStorage.getItem('currentUserId');
          if (previousUserId && previousUserId !== session.user.id) {
            console.log('User switched, clearing previous user data');
            clearUserInterviewData(previousUserId);
          }
          
          // 現在のユーザーIDを保存
          localStorage.setItem('currentUserId', session.user.id);
        }
        
        // ログアウト時の処理
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing all interview data');
          const previousUserId = localStorage.getItem('currentUserId');
          if (previousUserId) {
            clearUserInterviewData(previousUserId);
          }
          localStorage.removeItem('currentUserId');
        }
        
        // トークンエラーの処理
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, clearing session');
          setSession(null);
          setUser(null);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
};

// ユーザー固有の面接データをクリアする関数
const clearUserInterviewData = (userId: string) => {
  const interviewKeys = [
    `interview_${userId}_session`,
    `interview_${userId}_backup`,
    'interviewSession', // 旧形式のキーも削除
    'interviewSessionBackup'
  ];
  
  interviewKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing storage key:', key, error);
    }
  });
  
  console.log('Cleared interview data for user:', userId);
};

// 認証関連のユーティリティ関数
export const authHelpers = {
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      // 開発環境と本番環境で適切なリダイレクトURLを設定
      const redirectTo = process.env.NODE_ENV === 'production' 
        ? `${window.location.origin}/auth/callback`
        : `http://localhost:5173/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  signOut: async () => {
    try {
      // ログアウト前に現在のユーザーIDを取得
      const currentUserId = localStorage.getItem('currentUserId');
      
      const { error } = await supabase.auth.signOut();
      
      // ログアウト成功時に面接データをクリア
      if (!error && currentUserId) {
        clearUserInterviewData(currentUserId);
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  resetPassword: async (email: string) => {
    try {
      // 開発環境と本番環境で適切なリダイレクトURLを設定
      const redirectTo = process.env.NODE_ENV === 'production' 
        ? `${window.location.origin}/auth/callback`
        : `http://localhost:5173/auth/callback`;

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      return { data, error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  },

  updatePassword: async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  },
};

// 面接状態チェック用のヘルパー関数
export const checkInterviewState = (userId: string): boolean => {
  if (!userId) return false;
  
  try {
    const sessionKey = `interview_${userId}_session`;
    const backupKey = `interview_${userId}_backup`;
    
    const sessionData = sessionStorage.getItem(sessionKey) || localStorage.getItem(backupKey);
    return !!sessionData;
  } catch (error) {
    console.error('Error checking interview state:', error);
    return false;
  }
};