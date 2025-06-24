import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authHelpers } from '../../hooks/useAuth';
import { useNotification } from '../NotificationSystem';

export const ResetPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { showNotification } = useNotification();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      showNotification({
        type: 'warning',
        title: '入力エラー',
        message: 'メールアドレスを入力してください。',
        duration: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await authHelpers.resetPassword(email);

      if (error) {
        let errorMessage = 'パスワードリセットに失敗しました';
        
        if (error.message.includes('Invalid email')) {
          errorMessage = '有効なメールアドレスを入力してください。';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。';
        }

        showNotification({
          type: 'error',
          title: 'エラー',
          message: errorMessage,
          duration: 5000
        });
      } else {
        setEmailSent(true);
        showNotification({
          type: 'success',
          title: 'メール送信完了',
          message: 'パスワードリセット用のメールを送信しました。',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showNotification({
        type: 'error',
        title: 'エラーが発生しました',
        message: 'ネットワーク接続を確認してください。',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">メール送信完了</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              パスワードリセット用のメールを <strong>{email}</strong> に送信しました。<br />
              メール内のリンクをクリックして新しいパスワードを設定してください。
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                ログイン画面に戻る
              </Link>
              <button
                onClick={() => setEmailSent(false)}
                className="block w-full text-yellow-600 hover:text-yellow-700 font-medium hover:underline"
              >
                別のメールアドレスで再送信
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">パスワードリセット</h1>
          <p className="text-gray-600">登録済みのメールアドレスを入力してください</p>
        </div>

        {/* リセットフォーム */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100">
          <form onSubmit={handleReset} className="space-y-6">
            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="your@example.com"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                このメールアドレスにパスワードリセット用のリンクを送信します。
              </p>
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>送信中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>リセットメール送信</span>
                </div>
              )}
            </button>
          </form>

          {/* 戻るリンク */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              ログイン画面に戻る
            </Link>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2025 就活商事くん. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};