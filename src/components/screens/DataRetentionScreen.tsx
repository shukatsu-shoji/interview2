import React, { useState, useEffect } from 'react';
import { Calendar, Download, AlertTriangle, Shield, Clock, Database } from 'lucide-react';
import { useDataRetention } from '../../hooks/useDataRetention';
import { LoadingSpinner } from '../LoadingSpinner';
import { useNotification } from '../NotificationSystem';

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

export const DataRetentionScreen: React.FC = () => {
  const [retentionInfo, setRetentionInfo] = useState<RetentionInfo[]>([]);
  const [userDataSummary, setUserDataSummary] = useState<UserDataSummary | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { 
    getRetentionInfo, 
    getUserDataSummary, 
    exportUserData, 
    getRetentionNotifications,
    acknowledgeNotification 
  } = useDataRetention();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [retention, userSummary, userNotifications] = await Promise.all([
        getRetentionInfo(),
        getUserDataSummary(),
        getRetentionNotifications()
      ]);

      setRetentionInfo(retention);
      setUserDataSummary(userSummary);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      showNotification({
        type: 'error',
        title: 'データの読み込みに失敗しました',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      await exportUserData();
    } finally {
      setExporting(false);
    }
  };

  const handleAcknowledgeNotification = async (notificationId: string) => {
    await acknowledgeNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getDaysUntilExpiry = (createdAt: string, retentionDays: number) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="データ保存情報を読み込み中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">データ保存期間について</h1>
          <p className="text-gray-600">
            あなたのデータの保存状況と管理について確認できます
          </p>
        </div>

        {/* 通知がある場合 */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">重要な通知</h2>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <h3 className="font-medium text-yellow-800">
                        データ削除予定のお知らせ
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        {notification.table_name === 'interview_usage_logs' ? '面接履歴' : 'フィードバック'}
                        が {formatDate(notification.scheduled_deletion_date)} に削除予定です。
                        必要に応じてデータをエクスポートしてください。
                      </p>
                      <button
                        onClick={() => handleAcknowledgeNotification(notification.id)}
                        className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 underline"
                      >
                        確認済みにする
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* データ保存ポリシー */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              データ保存ポリシー
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {retentionInfo.map((info) => (
                <div key={info.table_name} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Database className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-900">{info.description}</h3>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>保存期間:</span>
                      <span className="font-medium">{info.retention_days}日間</span>
                    </div>
                    <div className="flex justify-between">
                      <span>総レコード数:</span>
                      <span className="font-medium">{info.total_records}</span>
                    </div>
                    {info.expired_records > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>期限切れ:</span>
                        <span className="font-medium">{info.expired_records}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ユーザーデータサマリー */}
        {userDataSummary && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                あなたのデータ保存状況
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 面接履歴 */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">面接履歴</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">総面接回数:</span>
                      <span className="font-medium">{userDataSummary.total_interviews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">保存中:</span>
                      <span className="font-medium text-green-600">{userDataSummary.active_interviews}</span>
                    </div>
                    {userDataSummary.expired_interviews > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">期限切れ:</span>
                        <span className="font-medium text-red-600">{userDataSummary.expired_interviews}</span>
                      </div>
                    )}
                    {userDataSummary.first_interview && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">初回面接:</span>
                        <span className="font-medium">{formatDate(userDataSummary.first_interview)}</span>
                      </div>
                    )}
                    {userDataSummary.last_interview && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">最終面接:</span>
                        <span className="font-medium">{formatDate(userDataSummary.last_interview)}</span>
                      </div>
                    )}
                    {userDataSummary.last_interview && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">削除まで:</span>
                        <span className="font-medium">
                          {getDaysUntilExpiry(userDataSummary.last_interview, 730)}日
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* フィードバック */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">フィードバック</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">総フィードバック数:</span>
                      <span className="font-medium">{userDataSummary.total_feedback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">保存中:</span>
                      <span className="font-medium text-green-600">{userDataSummary.active_feedback}</span>
                    </div>
                    {userDataSummary.expired_feedback > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">期限切れ:</span>
                        <span className="font-medium text-red-600">{userDataSummary.expired_feedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* データエクスポート */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              データエクスポート
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              あなたの面接履歴とフィードバックデータをJSONファイルとしてダウンロードできます。
              データが削除される前に、必要に応じてバックアップを取得してください。
            </p>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>エクスポート中...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>データをエクスポート</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">データ保存期間について</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 面接履歴は2年間保存されます</li>
                <li>• フィードバックは3年間保存されます</li>
                <li>• 削除予定の30日前に通知をお送りします</li>
                <li>• 削除前にデータをエクスポートすることをお勧めします</li>
                <li>• 統計データは匿名化されて永続保存されます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};