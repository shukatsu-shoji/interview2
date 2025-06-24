import React, { useState } from 'react';
import { Star, Send, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../NotificationSystem';
import { LoadingSpinner } from '../LoadingSpinner';

interface FeedbackData {
  rating: number;
  category: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  email?: string;
}

export const FeedbackScreen: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    category: 'general',
    title: '',
    description: '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'bug', label: 'バグ報告', icon: AlertCircle, color: 'red' },
    { value: 'feature', label: '新機能要望', icon: ThumbsUp, color: 'blue' },
    { value: 'improvement', label: '改善提案', icon: MessageSquare, color: 'yellow' },
    { value: 'general', label: '一般的なフィードバック', icon: Star, color: 'green' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.title.trim() || !feedback.description.trim()) {
      showNotification({
        type: 'warning',
        title: '入力エラー',
        message: 'タイトルと詳細を入力してください。',
        duration: 3000
      });
      return;
    }

    if (feedback.rating === 0) {
      showNotification({
        type: 'warning',
        title: '評価が必要です',
        message: '星評価を選択してください。',
        duration: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert([
          {
            user_id: user?.id || null,
            rating: feedback.rating,
            category: feedback.category,
            title: feedback.title,
            description: feedback.description,
            email: feedback.email,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      }

      setSubmitted(true);
      showNotification({
        type: 'success',
        title: 'フィードバックを送信しました',
        message: '貴重なご意見をありがとうございます。',
        duration: 5000
      });
    } catch (error) {
      console.error('フィードバック送信エラー:', error);
      showNotification({
        type: 'error',
        title: 'フィードバックの送信に失敗しました',
        message: 'しばらく時間をおいて再度お試しください。',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ThumbsUp className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            フィードバックを送信しました
          </h2>
          <p className="text-gray-600 mb-6">
            貴重なご意見をありがとうございます。<br />
            いただいたフィードバックは今後のサービス改善に活用させていただきます。
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">フィードバック</h1>
          <p className="text-gray-600">
            サービスの改善のため、ご意見・ご要望をお聞かせください
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 評価 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                総合評価 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className={`text-2xl transition-colors ${
                      star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {feedback.rating > 0 && `${feedback.rating}/5`}
                </span>
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                フィードバックの種類 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      feedback.category === category.value
                        ? `border-${category.color}-500 bg-${category.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={feedback.category === category.value}
                      onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value as any }))}
                      className="sr-only"
                    />
                    <category.icon className={`w-5 h-5 mr-3 text-${category.color}-600`} />
                    <span className="text-sm font-medium text-gray-900">
                      {category.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* タイトル */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={feedback.title}
                onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="フィードバックのタイトルを入力してください"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                {feedback.title.length}/100文字
              </p>
            </div>

            {/* 詳細 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                詳細 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={feedback.description}
                onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
                placeholder="具体的なフィードバック内容を入力してください"
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {feedback.description.length}/1000文字
              </p>
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス（任意）
              </label>
              <input
                type="email"
                id="email"
                value={feedback.email}
                onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="回答が必要な場合はメールアドレスを入力してください"
              />
              <p className="mt-1 text-xs text-gray-500">
                回答が必要な場合のみ入力してください
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
                  <span>フィードバックを送信</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};