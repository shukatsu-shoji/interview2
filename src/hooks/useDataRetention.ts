import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useNotification } from '../components/NotificationSystem';

interface RetentionInfo {
  table_name: string;
  description: string;
  retention_days: number;
  total_records: number;
  expired_records: number;
  oldest_record: string;
  newest_record: string;
}

interface UserDataSummary {
  total_interviews: number;
  active_interviews: number;
  expired_interviews: number;
  total_feedback: number;
  active_feedback: number;
  expired_feedback: number;
  first_interview: string;
  last_interview: string;
}

export const useDataRetention = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // データ保存期間情報を取得
  const getRetentionInfo = useCallback(async (): Promise<RetentionInfo[]> => {
    try {
      const { data, error } = await supabase
        .from('data_retention_info')
        .select('*');

      if (error) {
        console.error('データ保存期間情報の取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('データ保存期間情報の取得失敗:', error);
      return [];
    }
  }, []);

  // ユーザーのデータ保存状況を取得
  const getUserDataSummary = useCallback(async (): Promise<UserDataSummary | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_data_retention')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('ユーザーデータ保存状況の取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('ユーザーデータ保存状況の取得失敗:', error);
      return null;
    }
  }, [user]);

  // ユーザーデータをエクスポート
  const exportUserData = useCallback(async (): Promise<any> => {
    if (!user) {
      showNotification({
        type: 'error',
        title: 'ユーザーが認証されていません',
        duration: 3000
      });
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('export_user_data', {
        target_user_id: user.id
      });

      if (error) {
        throw error;
      }

      // JSONファイルとしてダウンロード
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview_data_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showNotification({
        type: 'success',
        title: 'データエクスポートが完了しました',
        message: 'ファイルがダウンロードされました。',
        duration: 5000
      });

      return data;
    } catch (error) {
      console.error('データエクスポートエラー:', error);
      showNotification({
        type: 'error',
        title: 'データエクスポートに失敗しました',
        message: 'しばらく時間をおいて再度お試しください。',
        duration: 5000
      });
      return null;
    }
  }, [user, showNotification]);

  // データ削除通知を取得
  const getRetentionNotifications = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('data_retention_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('acknowledged', false)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('データ削除通知の取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('データ削除通知の取得失敗:', error);
      return [];
    }
  }, [user]);

  // 通知を既読にする
  const acknowledgeNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('data_retention_notifications')
        .update({ acknowledged: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      showNotification({
        type: 'success',
        title: '通知を確認しました',
        duration: 3000
      });
    } catch (error) {
      console.error('通知確認エラー:', error);
      showNotification({
        type: 'error',
        title: '通知の確認に失敗しました',
        duration: 3000
      });
    }
  }, [showNotification]);

  return {
    getRetentionInfo,
    getUserDataSummary,
    exportUserData,
    getRetentionNotifications,
    acknowledgeNotification
  };
};