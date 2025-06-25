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
              error.message?.includes('Refresh Token Not Found')) {
            console.log('Invalid refresh token detected, clearing session...');
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
        
        // Also handle caught errors that might contain refresh token issues
        if (error instanceof Error && 
            (error.message?.includes('Invalid Refresh Token') || 
             error.message?.includes('Refresh Token Not Found'))) {
          console.log('Invalid refresh token detected in catch, clearing session...');
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signUp: async (email: string, password: string) => {
    // 本番環境では適切なリダイレクトURLを設定
    const redirectTo = process.env.NODE_ENV === 'production' 
      ? `${window.location.origin}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    return { data, error };
  },

  signOut: async () => {
    // ログアウト前に現在のユーザーIDを取得
    const currentUserId = localStorage.getItem('currentUserId');
    
    const { error } = await supabase.auth.signOut();
    
    // ログアウト成功時に面接データをクリア
    if (!error && currentUserId) {
      clearUserInterviewData(currentUserId);
    }
    
    return { error };
  },

  resetPassword: async (email: string) => {
    // 本番環境では適切なリダイレクトURLを設定
    const redirectTo = process.env.NODE_ENV === 'production' 
      ? `${window.location.origin}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { data, error };
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
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