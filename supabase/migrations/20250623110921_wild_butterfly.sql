/*
  # データ保存期間ポリシーの設定

  1. 保存期間の定義
    - 面接履歴: 2年間（学習効果と長期分析のため）
    - フィードバック: 3年間（サービス改善のため）
    - 統計データ: 永続保存（匿名化済み）

  2. 自動削除機能
    - 定期的なクリーンアップ処理
    - ユーザー削除時の関連データ削除

  3. データエクスポート機能
    - ユーザーが削除前にデータを取得可能
*/

-- データ保存期間の設定（日数）
CREATE OR REPLACE FUNCTION get_retention_days(table_name text) 
RETURNS integer AS $$
BEGIN
  CASE table_name
    WHEN 'interview_usage_logs' THEN RETURN 730; -- 2年間
    WHEN 'user_feedback' THEN RETURN 1095; -- 3年間
    ELSE RETURN 365; -- デフォルト1年間
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 古いデータを削除する関数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
DECLARE
  deleted_interviews integer;
  deleted_feedback integer;
BEGIN
  -- 2年以上古い面接ログを削除
  DELETE FROM interview_usage_logs 
  WHERE created_at < NOW() - INTERVAL '730 days';
  GET DIAGNOSTICS deleted_interviews = ROW_COUNT;
  
  -- 3年以上古いフィードバックを削除
  DELETE FROM user_feedback 
  WHERE created_at < NOW() - INTERVAL '1095 days';
  GET DIAGNOSTICS deleted_feedback = ROW_COUNT;
  
  -- ログ出力
  RAISE NOTICE 'Cleanup completed: % interview logs, % feedback entries deleted', 
    deleted_interviews, deleted_feedback;
END;
$$ LANGUAGE plpgsql;

-- データ保存期間情報を取得するビュー
CREATE OR REPLACE VIEW data_retention_info AS
SELECT 
  'interview_usage_logs' as table_name,
  '面接履歴' as description,
  get_retention_days('interview_usage_logs') as retention_days,
  COUNT(*) as total_records,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '730 days' THEN 1 END) as expired_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM interview_usage_logs
UNION ALL
SELECT 
  'user_feedback' as table_name,
  'ユーザーフィードバック' as description,
  get_retention_days('user_feedback') as retention_days,
  COUNT(*) as total_records,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '1095 days' THEN 1 END) as expired_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM user_feedback;

-- ユーザー別データ保存状況ビュー
CREATE OR REPLACE VIEW user_data_retention AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  COUNT(iul.*) as total_interviews,
  COUNT(CASE WHEN iul.created_at >= NOW() - INTERVAL '730 days' THEN 1 END) as active_interviews,
  COUNT(CASE WHEN iul.created_at < NOW() - INTERVAL '730 days' THEN 1 END) as expired_interviews,
  COUNT(uf.*) as total_feedback,
  COUNT(CASE WHEN uf.created_at >= NOW() - INTERVAL '1095 days' THEN 1 END) as active_feedback,
  COUNT(CASE WHEN uf.created_at < NOW() - INTERVAL '1095 days' THEN 1 END) as expired_feedback,
  MIN(iul.created_at) as first_interview,
  MAX(iul.created_at) as last_interview
FROM auth.users u
LEFT JOIN interview_usage_logs iul ON u.id = iul.user_id
LEFT JOIN user_feedback uf ON u.id = uf.user_id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;

-- 定期実行用のクリーンアップジョブ（pg_cronが利用可能な場合）
-- 毎日午前2時に実行
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- データエクスポート用の関数
CREATE OR REPLACE FUNCTION export_user_data(target_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'user_id', target_user_id,
    'export_date', NOW(),
    'interview_history', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'started_at', started_at,
          'industry', industry,
          'interview_type', interview_type,
          'duration', duration,
          'question_count', question_count,
          'created_at', created_at
        )
      )
      FROM interview_usage_logs 
      WHERE user_id = target_user_id
      ORDER BY created_at DESC
    ),
    'feedback_history', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'rating', rating,
          'category', category,
          'title', title,
          'description', description,
          'status', status,
          'created_at', created_at
        )
      )
      FROM user_feedback 
      WHERE user_id = target_user_id
      ORDER BY created_at DESC
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- データ削除通知用のテーブル
CREATE TABLE IF NOT EXISTS data_retention_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('warning', 'deletion')),
  table_name text NOT NULL,
  scheduled_deletion_date date NOT NULL,
  sent_at timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE data_retention_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own retention notifications"
  ON data_retention_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 削除予定データの通知を作成する関数
CREATE OR REPLACE FUNCTION create_retention_warnings()
RETURNS void AS $$
BEGIN
  -- 30日後に削除予定の面接ログについて警告
  INSERT INTO data_retention_notifications (user_id, notification_type, table_name, scheduled_deletion_date)
  SELECT DISTINCT 
    user_id,
    'warning',
    'interview_usage_logs',
    (created_at + INTERVAL '730 days')::date
  FROM interview_usage_logs 
  WHERE created_at BETWEEN NOW() - INTERVAL '700 days' AND NOW() - INTERVAL '699 days'
    AND user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM data_retention_notifications 
      WHERE user_id = interview_usage_logs.user_id 
        AND table_name = 'interview_usage_logs'
        AND notification_type = 'warning'
        AND scheduled_deletion_date = (interview_usage_logs.created_at + INTERVAL '730 days')::date
    );
    
  -- 30日後に削除予定のフィードバックについて警告
  INSERT INTO data_retention_notifications (user_id, notification_type, table_name, scheduled_deletion_date)
  SELECT DISTINCT 
    user_id,
    'warning',
    'user_feedback',
    (created_at + INTERVAL '1095 days')::date
  FROM user_feedback 
  WHERE created_at BETWEEN NOW() - INTERVAL '1065 days' AND NOW() - INTERVAL '1064 days'
    AND user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM data_retention_notifications 
      WHERE user_id = user_feedback.user_id 
        AND table_name = 'user_feedback'
        AND notification_type = 'warning'
        AND scheduled_deletion_date = (user_feedback.created_at + INTERVAL '1095 days')::date
    );
END;
$$ LANGUAGE plpgsql;