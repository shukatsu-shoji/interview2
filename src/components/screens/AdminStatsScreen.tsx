import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, BarChart3, Download, PieChart, Activity, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../LoadingSpinner';
import { useNotification } from '../NotificationSystem';
import { useUsageTracking } from '../../hooks/useUsageTracking';

interface UserUsageStats {
  user_id: string;
  email: string;
  user_created_at: string;
  total_usage: number;
  first_usage: string | null;
  last_usage: string | null;
  today_usage: number;
  this_week_usage: number;
  this_month_usage: number;
  usage_category: 'heavy' | 'moderate' | 'light' | 'inactive';
}

interface UsageSummary {
  total_users: number;
  total_interviews: number;
  today_interviews: number;
  this_week_interviews: number;
  this_month_interviews: number;
  avg_daily_usage: number;
}

interface UsageDistribution {
  usage_category: string;
  user_count: number;
  percentage: number;
}

interface DailyUsageStats {
  usage_date: string;
  total_interviews: number;
  unique_users: number;
  avg_interviews_per_user: number;
}

interface IndustryStats {
  industry: string;
  total_usage: number;
  unique_users: number;
  today_usage: number;
  this_week_usage: number;
  this_month_usage: number;
  usage_percentage: number;
}

interface DurationStats {
  duration_minutes: number;
  duration_label: string;
  total_usage: number;
  unique_users: number;
  usage_percentage: number;
  avg_question_count: number;
}

interface InterviewTypeStats {
  interview_type: string;
  total_usage: number;
  unique_users: number;
  usage_percentage: number;
  avg_duration: number;
}

interface WeeklyTrend {
  week_start: string;
  week_label: string;
  total_interviews: number;
  unique_users: number;
  industries_used: number;
  avg_duration: number;
}

interface MonthlyTrend {
  month_start: string;
  month_label: string;
  total_interviews: number;
  unique_users: number;
  growth_interviews: number;
  growth_users: number;
}

export const AdminStatsScreen: React.FC = () => {
  const [userStats, setUserStats] = useState<UserUsageStats[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [distribution, setDistribution] = useState<UsageDistribution[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyUsageStats[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryStats[]>([]);
  const [durationStats, setDurationStats] = useState<DurationStats[]>([]);
  const [interviewTypeStats, setInterviewTypeStats] = useState<InterviewTypeStats[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'users' | 'distribution' | 'daily' | 'industry' | 'duration' | 'interview-type' | 'trends'>('summary');
  
  const { showNotification } = useNotification();
  const { 
    getIndustryStats, 
    getDurationStats, 
    getInterviewTypeStats, 
    getWeeklyTrends, 
    getMonthlyTrends,
    getComprehensiveAnalytics 
  } = useUsageTracking();

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadSummary(),
        loadDistribution(),
        loadDailyStats(),
        loadIndustryStats(),
        loadDurationStats(),
        loadInterviewTypeStats(),
        loadWeeklyTrends(),
        loadMonthlyTrends()
      ]);
    } catch (error) {
      console.error('統計データの読み込みに失敗:', error);
      showNotification({
        type: 'error',
        title: '統計データの読み込みに失敗しました',
        message: 'データベース接続を確認してください。',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    const { data, error } = await supabase
      .from('user_usage_stats')
      .select('*')
      .order('total_usage', { ascending: false });

    if (error) {
      console.error('ユーザー統計の読み込みエラー:', error);
    } else {
      setUserStats(data || []);
    }
  };

  const loadSummary = async () => {
    const { data, error } = await supabase
      .from('usage_summary')
      .select('*')
      .single();

    if (error) {
      console.error('サマリー統計の読み込みエラー:', error);
    } else {
      setSummary(data);
    }
  };

  const loadDistribution = async () => {
    const { data, error } = await supabase
      .from('usage_distribution')
      .select('*');

    if (error) {
      console.error('利用分布の読み込みエラー:', error);
    } else {
      setDistribution(data || []);
    }
  };

  const loadDailyStats = async () => {
    const { data, error } = await supabase
      .from('daily_usage_stats')
      .select('*')
      .limit(30);

    if (error) {
      console.error('日別統計の読み込みエラー:', error);
    } else {
      setDailyStats(data || []);
    }
  };

  const loadIndustryStats = async () => {
    const data = await getIndustryStats();
    setIndustryStats(data);
  };

  const loadDurationStats = async () => {
    const data = await getDurationStats();
    setDurationStats(data);
  };

  const loadInterviewTypeStats = async () => {
    const data = await getInterviewTypeStats();
    setInterviewTypeStats(data);
  };

  const loadWeeklyTrends = async () => {
    const data = await getWeeklyTrends();
    setWeeklyTrends(data);
  };

  const loadMonthlyTrends = async () => {
    const data = await getMonthlyTrends();
    setMonthlyTrends(data);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['ユーザーID', 'メールアドレス', '通算利用回数', '初回利用日', '最終利用日', '今日の利用', '今週の利用', '今月の利用', '利用カテゴリ'],
      ...userStats.map(user => [
        user.user_id,
        user.email,
        user.total_usage,
        user.first_usage || '',
        user.last_usage || '',
        user.today_usage,
        user.this_week_usage,
        user.this_month_usage,
        user.usage_category
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `user_usage_stats_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'heavy': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'light': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'heavy': return 'ヘビーユーザー';
      case 'moderate': return '通常ユーザー';
      case 'light': return 'ライトユーザー';
      case 'inactive': return '未利用';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="統計データを読み込み中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">利用統計管理画面</h1>
          <p className="text-gray-600">ユーザーの利用状況と統計データを確認できます</p>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'summary', label: 'サマリー', icon: BarChart3 },
                { id: 'users', label: 'ユーザー別統計', icon: Users },
                { id: 'distribution', label: '利用分布', icon: PieChart },
                { id: 'industry', label: '業界別統計', icon: Target },
                { id: 'duration', label: '時間別統計', icon: Clock },
                { id: 'interview-type', label: 'タイプ別統計', icon: Activity },
                { id: 'trends', label: 'トレンド分析', icon: TrendingUp },
                { id: 'daily', label: '日別統計', icon: Calendar }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

        {/* サマリータブ */}
        {activeTab === 'summary' && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_users}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総面接回数</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_interviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">今日の面接回数</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.today_interviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">今週の面接回数</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.this_week_interviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">今月の面接回数</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.this_month_interviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">1日平均利用回数</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.avg_daily_usage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 業界別統計タブ */}
        {activeTab === 'industry' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">業界別利用統計</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      業界
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      総利用回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用ユーザー数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      今日/今週/今月
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {industryStats.map((stat) => (
                    <tr key={stat.industry} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.industry}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {stat.total_usage}回
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.unique_users}人
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.today_usage} / {stat.this_week_usage} / {stat.this_month_usage}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: `${stat.usage_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{stat.usage_percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 面接時間別統計タブ */}
        {activeTab === 'duration' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">面接時間別利用統計</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      面接時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      総利用回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用ユーザー数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均質問数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {durationStats.map((stat) => (
                    <tr key={stat.duration_minutes} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.duration_label}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {stat.total_usage}回
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.unique_users}人
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.avg_question_count}問
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${stat.usage_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{stat.usage_percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 面接タイプ別統計タブ */}
        {activeTab === 'interview-type' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">面接タイプ別利用統計</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      面接タイプ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      総利用回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用ユーザー数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均面接時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviewTypeStats.map((stat) => (
                    <tr key={stat.interview_type} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.interview_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {stat.total_usage}回
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.unique_users}人
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.avg_duration}分
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${stat.usage_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{stat.usage_percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* トレンド分析タブ */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* 週次トレンド */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">週次利用トレンド（過去12週間）</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        週
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        面接回数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        利用ユーザー数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        利用業界数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均面接時間
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyTrends.map((trend) => (
                      <tr key={trend.week_label} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.week_label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.total_interviews}回
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.unique_users}人
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.industries_used}業界
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.avg_duration}分
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 月次トレンド */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">月次利用トレンド（過去12ヶ月）</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        月
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        面接回数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        利用ユーザー数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        前月比成長
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyTrends.map((trend) => (
                      <tr key={trend.month_label} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.month_label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.total_interviews}回
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.unique_users}人
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${
                              trend.growth_interviews > 0 ? 'text-green-600' : 
                              trend.growth_interviews < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {trend.growth_interviews > 0 ? '+' : ''}{trend.growth_interviews}回
                            </span>
                            <span className={`text-sm ${
                              trend.growth_users > 0 ? 'text-green-600' : 
                              trend.growth_users < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              ({trend.growth_users > 0 ? '+' : ''}{trend.growth_users}人)
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ユーザー別統計タブ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">ユーザー別利用統計</h2>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>CSV出力</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      通算利用回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      今日/今週/今月
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      初回利用日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最終利用日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userStats.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.user_id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {user.total_usage}回
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.today_usage} / {user.this_week_usage} / {user.this_month_usage}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.first_usage ? new Date(user.first_usage).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_usage ? new Date(user.last_usage).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(user.usage_category)}`}>
                          {getCategoryLabel(user.usage_category)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 利用分布タブ */}
        {activeTab === 'distribution' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">利用頻度別ユーザー分布</h2>
            <div className="space-y-4">
              {distribution.map((item) => (
                <div key={item.usage_category} className="flex items-center">
                  <div className="w-32">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(item.usage_category)}`}>
                      {getCategoryLabel(item.usage_category)}
                    </span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {item.user_count}人 ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 日別統計タブ */}
        {activeTab === 'daily' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">日別利用統計（過去30日）</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日付
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      面接回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用ユーザー数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー平均利用回数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyStats.map((day) => (
                    <tr key={day.usage_date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(day.usage_date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.total_interviews}回
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.unique_users}人
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.avg_interviews_per_user}回
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};