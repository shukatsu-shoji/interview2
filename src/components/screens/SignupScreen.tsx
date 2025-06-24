import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, UserPlus, Check } from 'lucide-react';
import { authHelpers, useAuth } from '../../hooks/useAuth';
import { useNotification } from '../NotificationSystem';

export const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // ログイン済みの場合はリダイレクト
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      showNotification({
        type: 'warning',
        title: '入力エラー',
        message: 'すべての項目を入力してください。',
        duration: 3000
      });
      return false;
    }

    if (password.length < 6) {
      showNotification({
        type: 'warning',
        title: 'パスワードエラー',
        message: 'パスワードは6文字以上で入力してください。',
        duration: 3000
      });
      return false;
    }

    if (password !== confirmPassword) {
      showNotification({
        type: 'warning',
        title: 'パスワードエラー',
        message: 'パスワードが一致しません。',
        duration: 3000
      });
      return false;
    }

    if (!agreeToTerms) {
      showNotification({
        type: 'warning',
        title: '利用規約',
        message: '利用規約とプライバシーポリシーに同意してください。',
        duration: 3000
      });
      return false;
    }

    if (!parentConsent) {
      showNotification({
        type: 'warning',
        title: '年齢確認',
        message: '年齢に関する確認にチェックしてください。',
        duration: 3000
      });
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authHelpers.signUp(email, password);

      if (error) {
        let errorMessage = '新規登録に失敗しました';
        
        if (error.message.includes('User already registered')) {
          errorMessage = 'このメールアドレスは既に登録されています。ログインしてください。';
        } else if (error.message.includes('Password should be at least 6 characters')) {
          errorMessage = 'パスワードは6文字以上で入力してください。';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '有効なメールアドレスを入力してください。';
        }

        showNotification({
          type: 'error',
          title: '登録エラー',
          message: errorMessage,
          duration: 5000
        });
      } else if (data.user) {
        setRegistrationComplete(true);
        showNotification({
          type: 'success',
          title: '登録完了',
          message: '認証メールを送信しました。メールを確認してリンクをクリックしてください。',
          duration: 8000
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      showNotification({
        type: 'error',
        title: '登録中にエラーが発生しました',
        message: 'ネットワーク接続を確認してください。',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">登録完了</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              認証メールを <strong>{email}</strong> に送信しました。<br />
              Supabase Authから届くメール内のリンクをクリックしてアカウントを有効化してください。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>重要:</strong> メール内のリンクをクリックすると、自動的にログイン画面にリダイレクトされます。
                その後、通常通りログインしてサービスをご利用ください。
              </p>
            </div>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                ログイン画面に戻る
              </Link>
              <p className="text-sm text-gray-500">
                メールが届かない場合は、迷惑メールフォルダもご確認ください。
              </p>
            </div>
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
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新規登録</h1>
          <p className="text-gray-600">アカウントを作成して面接練習を始めましょう</p>
        </div>

        {/* 登録フォーム */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100">
          <form onSubmit={handleSignup} className="space-y-6">
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
                  minLength={6}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="6文字以上で入力"
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
              <p className="mt-1 text-xs text-gray-500">6文字以上で入力してください</p>
            </div>

            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="パスワードを再入力"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* 同意チェックボックス */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mt-1"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  <Link to="/terms" target="_blank" className="text-yellow-600 hover:underline">利用規約</Link>
                  および
                  <Link to="/privacy" target="_blank" className="text-yellow-600 hover:underline">プライバシーポリシー</Link>
                  に同意します
                </span>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={parentConsent}
                  onChange={(e) => setParentConsent(e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mt-1"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  15歳以上18歳未満の場合は保護者の同意を得ています（該当しない場合もチェックしてください）
                </span>
              </label>
            </div>

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>登録中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>新規登録</span>
                </div>
              )}
            </button>
          </form>

          {/* ログインリンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              既にアカウントをお持ちの方は{' '}
              <Link
                to="/login"
                className="text-yellow-600 hover:text-yellow-700 font-medium hover:underline"
              >
                ログイン
              </Link>
            </p>
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