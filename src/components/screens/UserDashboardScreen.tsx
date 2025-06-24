import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Award, Clock, BarChart3, BookOpen, Star, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../LoadingSpinner';
import { useNotification } from '../NotificationSystem';

interface UserStats {
  totalInterviews: number;
  thisWeekInterviews: number;
  thisMonthInterviews: number;
  averageDuration: number;
  favoriteIndustry: string;
  favoriteInterviewType: string;
  longestStreak: number;
  currentStreak: number;
  improvementRate: number;
}

interface RecentInterview {
  id: string;
  industry: string;
  interview_type: string;
  duration: number;
  started_at: string;
  question_count: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export const UserDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentInterviews, setRecentInterviews] = useState<RecentInterview[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements' | 'insights'>('overview');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleGoToTop = () => {
    navigate('/');
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadRecentInterviews(),
        loadAchievements()
      ]);
    } catch (error) {
      console.error('ダッシュボードデータの読み込みに失敗:', error);
      showNotification({
        type: 'error',
        title: 'データの読み込みに失敗しました',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('interview_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('ユーザー統計の読み込みエラー:', error);
      return;
    }

    const interviews = data || [];
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekInterviews = interviews.filter(i => 
      new Date(i.started_at) >= weekStart
    ).length;

    const thisMonthInterviews = interviews.filter(i => 
      new Date(i.started_at) >= monthStart
    ).length;

    const averageDuration = interviews.length > 0 
      ? interviews.reduce((sum, i) => sum + (i.duration || 0), 0) / interviews.length 
      : 0;

    // 最頻出の業界と面接タイプ
    const industryCount = interviews.reduce((acc, i) => {
      acc[i.industry || '未設定'] = (acc[i.industry || '未設定'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const interviewTypeCount = interviews.reduce((acc, i) => {
      acc[i.interview_type || '未設定'] = (acc[i.interview_type || '未設定'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteIndustry = Object.keys(industryCount).reduce((a, b) => 
      industryCount[a] > industryCount[b] ? a : b, '未設定'
    );

    const favoriteInterviewType = Object.keys(interviewTypeCount).reduce((a, b) => 
      interviewTypeCount[a] > interviewTypeCount[b] ? a : b, '未設定'
    );

    // 連続利用日数の計算
    const { currentStreak, longestStreak } = calculateStreaks(interviews);

    setStats({
      totalInterviews: interviews.length,
      thisWeekInterviews,
      thisMonthInterviews,
      averageDuration: Math.round(averageDuration),
      favoriteIndustry,
      favoriteInterviewType,
      longestStreak,
      currentStreak,
      improvementRate: calculateImprovementRate(interviews)
    });
  };

  const loadRecentInterviews = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('interview_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('最近の面接履歴の読み込みエラー:', error);
      return;
    }

    setRecentInterviews(data || []);
  };

  const loadAchievements = async () => {
    if (!user) return;

    // 実際の利用データに基づいて実績を計算
    const { data: interviews, error } = await supabase
      .from('interview_usage_logs')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('実績データの読み込みエラー:', error);
      return;
    }

    const interviewCount = interviews?.length || 0;
    const industries = new Set(interviews?.map(i => i.industry).filter(Boolean)).size;
    const interviewTypes = new Set(interviews?.map(i => i.interview_type).filter(Boolean)).size;

    const achievementsList: Achievement[] = [
      {
        id: 'first_interview',
        title: '初回面接完了',
        description: '最初の模擬面接を完了しました',
        icon: '🎯',
        unlocked: interviewCount >= 1,
        unlockedAt: interviews?.[0]?.started_at
      },
      {
        id: 'interview_5',
        title: '面接練習5回達成',
        description: '5回の面接練習を完了しました',
        icon: '🏃',
        unlocked: interviewCount >= 5,
        progress: Math.min(interviewCount, 5),
        target: 5
      },
      {
        id: 'interview_10',
        title: '面接マスター',
        description: '10回の面接練習を完了しました',
        icon: '🏆',
        unlocked: interviewCount >= 10,
        progress: Math.min(interviewCount, 10),
        target: 10
      },
      {
        id: 'industry_explorer',
        title: '業界エクスプローラー',
        description: '3つ以上の業界で面接練習を行いました',
        icon: '🌟',
        unlocked: industries >= 3,
        progress: Math.min(industries, 3),
        target: 3
      },
      {
        id: 'interview_variety',
        title: '面接タイプマスター',
        description: '全ての面接タイプを経験しました',
        icon: '🎭',
        unlocked: interviewTypes >= 3,
        progress: Math.min(interviewTypes, 3),
        target: 3
      }
    ];

    setAchievements(achievementsList);
  };

  const calculateStreaks = (interviews: any[]) => {
    if (interviews.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const dates = interviews.map(i => new Date(i.started_at).toDateString());
    const uniqueDates = [...new Set(dates)].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // 現在の連続記録を計算
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      currentStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(uniqueDates[i + 1]);
        const prevDate = new Date(uniqueDates[i]);
        const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // 最長連続記録を計算
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const prevDate = new Date(uniqueDates[i - 1]);
      const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  };

  const calculateImprovementRate = (interviews: any[]) => {
    if (interviews.length < 2) return 0;

    const recent = interviews.slice(0, Math.ceil(interviews.length / 2));
    const older = interviews.slice(Math.ceil(interviews.length / 2));

    const recentAvgDuration = recent.reduce((sum, i) => sum + (i.duration || 0), 0) / recent.length;
    const olderAvgDuration = older.reduce((sum, i) => sum + (i.duration || 0), 0) / older.length;

    if (olderAvgDuration === 0) return 0;
    return Math.round(((recentAvgDuration - olderAvgDuration) / olderAvgDuration) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="ダッシュボードを読み込み中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">マイダッシュボード</h1>
              <p className="text-gray-600">あなたの面接練習の進捗と成長を確認しましょう</p>
            </div>
            <button
              onClick={handleGoToTop}
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Home className="w-5 h-5" />
              <span>トップページ</span>
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: '概要', icon: BarChart3 },
                { id: 'history', label: '履歴', icon: Calendar },
                { id: 'achievements', label: '実績', icon: Award },
                { id: 'insights', label: '分析', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総面接回数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">今週の練習</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.thisWeekInterviews}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">平均面接時間</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageDuration}分</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">連続練習日数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 詳細統計 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">練習傾向</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">よく練習する業界</span>
                      <span className="font-medium">{stats.favoriteIndustry}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">よく練習する面接タイプ</span>
                      <span className="font-medium">{stats.favoriteInterviewType}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">最長連続練習日数</span>
                      <span className="font-medium">{stats.longestStreak}日</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">今月の目標</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">月間面接回数</span>
                      <span className="font-medium">{stats.thisMonthInterviews}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${Math.min((stats.thisMonthInterviews / 20) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">週間練習日数</span>
                      <span className="font-medium">{Math.min(stats.thisWeekInterviews, 7)}/7</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((Math.min(stats.thisWeekInterviews, 7) / 7) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 履歴タブ */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">最近の面接履歴</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      業界
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      面接タイプ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      質問数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentInterviews.map((interview, index) => (
                    <tr key={interview.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(interview.started_at).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {interview.industry || '未設定'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {interview.interview_type || '未設定'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {interview.duration || 0}分
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {interview.question_count || 0}問
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 実績タブ */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-white rounded-lg p-6 shadow-sm border ${
                  achievement.unlocked ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  <div className={`text-3xl mr-4 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${achievement.unlocked ? 'text-yellow-800' : 'text-gray-600'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm mt-1 ${achievement.unlocked ? 'text-yellow-700' : 'text-gray-500'}`}>
                      {achievement.description}
                    </p>
                    {achievement.target && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>進捗</span>
                          <span>{achievement.progress}/{achievement.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-400'}`}
                            style={{ width: `${((achievement.progress || 0) / achievement.target) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-yellow-600 mt-2">
                        {new Date(achievement.unlockedAt).toLocaleDateString('ja-JP')} に達成
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分析タブ */}
        {activeTab === 'insights' && stats && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">成長分析</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">練習頻度の推移</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    最近の練習頻度が向上しています。継続して練習を続けましょう。
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      💡 <strong>アドバイス:</strong> 週に3回以上の練習を目標にすると、より効果的な成長が期待できます。
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">おすすめの次のステップ</h4>
                  <div className="space-y-3">
                    {stats.totalInterviews < 5 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          🎯 まずは5回の面接練習を目標にしましょう
                        </p>
                      </div>
                    )}
                    {stats.favoriteIndustry === '未設定' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          🌟 異なる業界での面接練習にチャレンジしてみましょう
                        </p>
                      </div>
                    )}
                    {stats.currentStreak === 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-sm text-purple-800">
                          🔥 連続練習記録を作ってみましょう
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};