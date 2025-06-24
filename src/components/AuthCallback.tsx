import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { useNotification } from './NotificationSystem';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLのハッシュフラグメントから認証情報を取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          showNotification({
            type: 'error',
            title: '認証エラー',
            message: '認証処理中にエラーが発生しました。',
            duration: 5000
          });
          navigate('/login');
          return;
        }

        if (data.session) {
          // 認証成功
          showNotification({
            type: 'success',
            title: 'アカウントが有効化されました',
            message: 'ログインが完了しました。面接練習を始めましょう！',
            duration: 5000
          });
          
          // URLをクリーンアップ
          window.history.replaceState(null, '', '/');
          navigate('/', { replace: true });
        } else {
          // セッションが見つからない場合
          showNotification({
            type: 'warning',
            title: '認証が完了していません',
            message: 'ログイン画面からもう一度お試しください。',
            duration: 5000
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        showNotification({
          type: 'error',
          title: '認証処理エラー',
          message: 'ネットワーク接続を確認してください。',
          duration: 5000
        });
        navigate('/login');
      }
    };

    // 少し遅延を入れて認証処理を実行
    const timer = setTimeout(handleAuthCallback, 1000);
    
    return () => clearTimeout(timer);
  }, [navigate, showNotification]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100 text-center">
        <LoadingSpinner size="lg" message="認証処理中..." />
        <p className="mt-4 text-gray-600">
          アカウントの有効化を処理しています。<br />
          しばらくお待ちください。
        </p>
      </div>
    </div>
  );
};