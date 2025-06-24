import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, UserPlus } from 'lucide-react';
import { authHelpers, useAuth } from '../../hooks/useAuth';
import { useNotification } from '../NotificationSystem';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // ログイン済みの場合はリダイレクト
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowCredentialsHelp(false);

    try {
      const { data, error } = await authHelpers.signIn(email, password);

      if (error) {
        let errorMessage = 'ログインに失敗しました';
        let showHelp = false;
        
        // Handle different types of Supabase errors
        const errorCode = error.code || '';
        const errorMsg = error.message || '';
        
        if (errorCode === 'invalid_credentials' || errorMsg.includes('Invalid login credentials')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません';
          showHelp = true;
          setShowCredentialsHelp(true);
        } else if (errorCode === 'email_not_confirmed' || errorMsg.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスの確認が完了していません。確認メールをご確認ください。';
        } else if (errorCode === 'too_many_requests' || errorMsg.includes('Too many requests')) {
          errorMessage = 'ログイン試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。';
        } else if (errorCode === 'weak_password' || errorMsg.includes('Password')) {
          errorMessage = 'パスワードが正しくありません';
          showHelp = true;
          setShowCredentialsHelp(true);
        } else if (errorCode === 'invalid_email' || errorMsg.includes('email')) {
          errorMessage = 'メールアドレスの形式が正しくありません';
        }

        console.error('Login error details:', { error, errorCode, errorMsg });

        showNotification({
          type: 'error',
          title: 'ログインエラー',
          message: errorMessage,
          duration: showHelp ? 8000 : 5000
        });
      } else if (data.user) {
        showNotification({
          type: 'success',
          title: 'ログインしました',
          message: 'ようこそ！面接練習を始めましょう。',
          duration: 3000
        });

        // リダイレクト先を決定
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification({
        type: 'error',
        title: 'ログイン中にエラーが発生しました',
        message: 'ネットワーク接続を確認してください。',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
          <p className="text-gray-600">アカウントにログインして面接練習を始めましょう</p>
        </div>

        {/* 認証情報ヘルプ */}
        {showCredentialsHelp && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 mb-2">
                  ログインできませんか？
                </h3>
                <div className="text-sm text-amber-700 space-y-2">
                  <p>• メールアドレスとパスワードを再度確認してください</p>
                  <p>• パスワードを忘れた場合は「パスワードを忘れた方」をクリック</p>
                  <p>• アカウントをお持ちでない場合は新規登録が必要です</p>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Link
                    to="/reset-password"
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    パスワードリセット
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    新規登録
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ログインフォーム */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100">
          <form onSubmit={handleLogin} className="space-y-6">
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
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all ${
                    showCredentialsHelp ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                  }`}
                  placeholder="your@example.com"
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all ${
                    showCredentialsHelp ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                  }`}
                  placeholder="パスワードを入力"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* オプション */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">ログイン状態を保持</span>
              </label>
              <Link
                to="/reset-password"
                className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline"
              >
                パスワードを忘れた方
              </Link>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ログイン中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <LogIn className="w-5 h-5" />
                  <span>ログイン</span>
                </div>
              )}
            </button>
          </form>

          {/* 新規登録リンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link
                to="/signup"
                className="text-yellow-600 hover:text-yellow-700 font-medium hover:underline"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 就活商事　模擬面接. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};