import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../components/NotificationSystem';
import { InterviewSettings } from '../types/interview';

export const useUsageTracking = () => {
  const { showNotification } = useNotification();

  const recordUsage = useCallback(async (settings?: InterviewSettings) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      const usageData = {
        user_id: user.id,
        started_at: new Date().toISOString(),
        // 面接設定情報を追加
        industry: settings?.industry || null,
        duration: settings?.duration || null,
        interview_type: settings?.interviewType || null,
        question_count: settings?.questionCount || null
      };

      const { error } = await supabase
        .from('interview_usage_logs')
        .insert([usageData]);

      if (error) {
        console.error('利用回数記録エラー:', error);
        showNotification({
          type: 'warning',
          title: '利用記録の保存に失敗しました',
          message: 'サービスは正常に利用できます。',
          duration: 3000
        });
      } else {
        console.log('利用回数を記録しました:', usageData);
      }
    } catch (error) {
      console.error('利用回数記録失敗:', error);
    }
  }, [showNotification]);

  const getUsageStats = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { totalUsage: 0, todayUsage: 0 };
      }

      // 総利用回数
      const { count: totalUsage, error: totalError } = await supabase
        .from('interview_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (totalError) {
        console.error('総利用回数取得エラー:', totalError);
      }

      // 今日の利用回数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayUsage, error: todayError } = await supabase
        .from('interview_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('started_at', today.toISOString());

      if (todayError) {
        console.error('今日の利用回数取得エラー:', todayError);
      }

      return {
        totalUsage: totalUsage || 0,
        todayUsage: todayUsage || 0
      };
    } catch (error) {
      console.error('利用統計取得失敗:', error);
      return { totalUsage: 0, todayUsage: 0 };
    }
  }, []);

  // 業界別統計取得
  const getIndustryStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('industry_usage_stats')
        .select('*');

      if (error) {
        console.error('業界別統計取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('業界別統計取得失敗:', error);
      return [];
    }
  }, []);

  // 面接時間別統計取得
  const getDurationStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('duration_usage_stats')
        .select('*');

      if (error) {
        console.error('面接時間別統計取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('面接時間別統計取得失敗:', error);
      return [];
    }
  }, []);

  // 面接タイプ別統計取得
  const getInterviewTypeStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('interview_type_usage_stats')
        .select('*');

      if (error) {
        console.error('面接タイプ別統計取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('面接タイプ別統計取得失敗:', error);
      return [];
    }
  }, []);

  // 週次トレンド取得
  const getWeeklyTrends = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_usage_trends')
        .select('*');

      if (error) {
        console.error('週次トレンド取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('週次トレンド取得失敗:', error);
      return [];
    }
  }, []);

  // 月次トレンド取得
  const getMonthlyTrends = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_usage_trends')
        .select('*');

      if (error) {
        console.error('月次トレンド取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('月次トレンド取得失敗:', error);
      return [];
    }
  }, []);

  // 総合分析データ取得
  const getComprehensiveAnalytics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comprehensive_analytics')
        .select('*')
        .single();

      if (error) {
        console.error('総合分析データ取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('総合分析データ取得失敗:', error);
      return null;
    }
  }, []);

  return { 
    recordUsage, 
    getUsageStats,
    getIndustryStats,
    getDurationStats,
    getInterviewTypeStats,
    getWeeklyTrends,
    getMonthlyTrends,
    getComprehensiveAnalytics
  };
};