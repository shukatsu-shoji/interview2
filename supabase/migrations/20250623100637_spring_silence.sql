/*
  # 面接設定別統計とトレンド分析機能の実装

  1. テーブル拡張
    - interview_usage_logs テーブルに面接設定情報を追加
    - industry, duration, interview_type, question_count カラム

  2. 統計ビュー
    - 業界別、時間別、面接タイプ別の利用統計
    - 週次・月次トレンド分析
    - 総合分析ダッシュボード
    - ユーザー行動分析

  3. セキュリティ
    - 既存のRLSポリシーを維持
*/

-- interview_usage_logs テーブルに面接設定情報を追加
DO $$
BEGIN
  -- industry カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_usage_logs' AND column_name = 'industry'
  ) THEN
    ALTER TABLE interview_usage_logs ADD COLUMN industry text;
  END IF;
  
  -- duration カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_usage_logs' AND column_name = 'duration'
  ) THEN
    ALTER TABLE interview_usage_logs ADD COLUMN duration integer;
  END IF;
  
  -- interview_type カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_usage_logs' AND column_name = 'interview_type'
  ) THEN
    ALTER TABLE interview_usage_logs ADD COLUMN interview_type text;
  END IF;
  
  -- question_count カラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_usage_logs' AND column_name = 'question_count'
  ) THEN
    ALTER TABLE interview_usage_logs ADD COLUMN question_count integer;
  END IF;
END $$;

-- 業界別利用統計ビュー
CREATE OR REPLACE VIEW industry_usage_stats AS
SELECT 
  COALESCE(industry, '未設定') as industry,
  COUNT(*) as total_usage,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN DATE(started_at) = CURRENT_DATE THEN 1 END) as today_usage,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_usage,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_usage,
  CAST(ROUND(CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS numeric), 2) AS numeric) as usage_percentage,
  MIN(started_at) as first_usage,
  MAX(started_at) as last_usage
FROM interview_usage_logs
GROUP BY industry
ORDER BY total_usage DESC;

-- 面接時間別利用統計ビュー
CREATE OR REPLACE VIEW duration_usage_stats AS
SELECT 
  COALESCE(duration, 0) as duration_minutes,
  CASE 
    WHEN duration = 5 THEN '5分 (クイック)'
    WHEN duration = 15 THEN '15分 (標準)'
    WHEN duration = 30 THEN '30分 (詳細)'
    ELSE '未設定'
  END as duration_label,
  COUNT(*) as total_usage,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN DATE(started_at) = CURRENT_DATE THEN 1 END) as today_usage,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_usage,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_usage,
  CAST(ROUND(CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS numeric), 2) AS numeric) as usage_percentage,
  CAST(ROUND(CAST(AVG(COALESCE(question_count, 0)) AS numeric), 1) AS numeric) as avg_question_count
FROM interview_usage_logs
GROUP BY duration
ORDER BY duration_minutes;

-- 面接タイプ別利用統計ビュー
CREATE OR REPLACE VIEW interview_type_usage_stats AS
SELECT 
  COALESCE(interview_type, '未設定') as interview_type,
  COUNT(*) as total_usage,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN DATE(started_at) = CURRENT_DATE THEN 1 END) as today_usage,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_usage,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_usage,
  CAST(ROUND(CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS numeric), 2) AS numeric) as usage_percentage,
  CAST(ROUND(CAST(AVG(COALESCE(duration, 0)) AS numeric), 1) AS numeric) as avg_duration
FROM interview_usage_logs
GROUP BY interview_type
ORDER BY total_usage DESC;

-- 週次利用トレンドビュー（過去12週間）
CREATE OR REPLACE VIEW weekly_usage_trends AS
SELECT 
  DATE_TRUNC('week', started_at) as week_start,
  TO_CHAR(DATE_TRUNC('week', started_at), 'YYYY-MM-DD') as week_label,
  COUNT(*) as total_interviews,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT industry) as industries_used,
  CAST(ROUND(CAST(AVG(COALESCE(duration, 0)) AS numeric), 1) AS numeric) as avg_duration,
  -- 業界別内訳
  COUNT(CASE WHEN industry = 'IT' THEN 1 END) as it_usage,
  COUNT(CASE WHEN industry = '金融' THEN 1 END) as finance_usage,
  COUNT(CASE WHEN industry = '商社' THEN 1 END) as trading_usage,
  COUNT(CASE WHEN industry = 'コンサル' THEN 1 END) as consulting_usage,
  COUNT(CASE WHEN industry = 'メーカー' THEN 1 END) as manufacturing_usage,
  -- 面接タイプ別内訳
  COUNT(CASE WHEN interview_type = '一次面接' THEN 1 END) as first_interview_usage,
  COUNT(CASE WHEN interview_type = '二次面接' THEN 1 END) as second_interview_usage,
  COUNT(CASE WHEN interview_type = '最終面接' THEN 1 END) as final_interview_usage
FROM interview_usage_logs
WHERE started_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '11 weeks'
GROUP BY DATE_TRUNC('week', started_at)
ORDER BY week_start DESC;

-- 月次利用トレンドビュー（過去12ヶ月）
CREATE OR REPLACE VIEW monthly_usage_trends AS
SELECT 
  DATE_TRUNC('month', started_at) as month_start,
  TO_CHAR(DATE_TRUNC('month', started_at), 'YYYY-MM') as month_label,
  COUNT(*) as total_interviews,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT industry) as industries_used,
  CAST(ROUND(CAST(AVG(COALESCE(duration, 0)) AS numeric), 1) AS numeric) as avg_duration,
  -- 成長率計算（前月比）
  COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', started_at)) as growth_interviews,
  COUNT(DISTINCT user_id) - LAG(COUNT(DISTINCT user_id)) OVER (ORDER BY DATE_TRUNC('month', started_at)) as growth_users,
  -- 業界別内訳
  COUNT(CASE WHEN industry = 'IT' THEN 1 END) as it_usage,
  COUNT(CASE WHEN industry = '金融' THEN 1 END) as finance_usage,
  COUNT(CASE WHEN industry = '商社' THEN 1 END) as trading_usage,
  COUNT(CASE WHEN industry = 'コンサル' THEN 1 END) as consulting_usage,
  COUNT(CASE WHEN industry = 'メーカー' THEN 1 END) as manufacturing_usage,
  -- 時間別内訳
  COUNT(CASE WHEN duration = 5 THEN 1 END) as short_duration_usage,
  COUNT(CASE WHEN duration = 15 THEN 1 END) as medium_duration_usage,
  COUNT(CASE WHEN duration = 30 THEN 1 END) as long_duration_usage
FROM interview_usage_logs
WHERE started_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
GROUP BY DATE_TRUNC('month', started_at)
ORDER BY month_start DESC;

-- 総合分析ダッシュボードビュー
CREATE OR REPLACE VIEW comprehensive_analytics AS
SELECT 
  -- 基本統計
  COUNT(*) as total_interviews,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(CASE WHEN DATE(started_at) = CURRENT_DATE THEN 1 END) as today_interviews,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_interviews,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_interviews,
  
  -- 人気の設定
  MODE() WITHIN GROUP (ORDER BY industry) as most_popular_industry,
  MODE() WITHIN GROUP (ORDER BY duration) as most_popular_duration,
  MODE() WITHIN GROUP (ORDER BY interview_type) as most_popular_interview_type,
  
  -- 平均値
  CAST(ROUND(CAST(AVG(COALESCE(duration, 0)) AS numeric), 1) AS numeric) as avg_duration,
  CAST(ROUND(CAST(AVG(COALESCE(question_count, 0)) AS numeric), 1) AS numeric) as avg_question_count,
  
  -- 利用パターン分析
  CAST(ROUND(CAST(COUNT(*) * 1.0 / NULLIF(COUNT(DISTINCT user_id), 0) AS numeric), 2) AS numeric) as avg_interviews_per_user,
  CAST(ROUND(CAST(COUNT(DISTINCT DATE(started_at)) * 1.0 / GREATEST(EXTRACT(DAY FROM (MAX(started_at) - MIN(started_at))) + 1, 1) AS numeric), 2) AS numeric) as avg_active_days_ratio,
  
  -- 時間帯分析
  COUNT(CASE WHEN EXTRACT(HOUR FROM started_at) BETWEEN 6 AND 11 THEN 1 END) as morning_usage,
  COUNT(CASE WHEN EXTRACT(HOUR FROM started_at) BETWEEN 12 AND 17 THEN 1 END) as afternoon_usage,
  COUNT(CASE WHEN EXTRACT(HOUR FROM started_at) BETWEEN 18 AND 23 THEN 1 END) as evening_usage,
  COUNT(CASE WHEN EXTRACT(HOUR FROM started_at) BETWEEN 0 AND 5 THEN 1 END) as night_usage
FROM interview_usage_logs;

-- 業界×面接タイプのクロス分析ビュー
CREATE OR REPLACE VIEW industry_interview_type_matrix AS
SELECT 
  COALESCE(industry, '未設定') as industry,
  COALESCE(interview_type, '未設定') as interview_type,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  CAST(ROUND(CAST(AVG(COALESCE(duration, 0)) AS numeric), 1) AS numeric) as avg_duration,
  CAST(ROUND(CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS numeric), 2) AS numeric) as percentage_of_total
FROM interview_usage_logs
GROUP BY industry, interview_type
ORDER BY industry, interview_type;

-- ユーザー行動分析ビュー
CREATE OR REPLACE VIEW user_behavior_analysis AS
SELECT 
  user_id,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT industry) as industries_tried,
  COUNT(DISTINCT interview_type) as interview_types_tried,
  COUNT(DISTINCT duration) as durations_tried,
  MODE() WITHIN GROUP (ORDER BY industry) as preferred_industry,
  MODE() WITHIN GROUP (ORDER BY interview_type) as preferred_interview_type,
  MODE() WITHIN GROUP (ORDER BY duration) as preferred_duration,
  MIN(started_at) as first_session,
  MAX(started_at) as last_session,
  EXTRACT(DAY FROM (MAX(started_at) - MIN(started_at))) + 1 as active_days,
  CASE 
    WHEN COUNT(*) >= 20 THEN 'ヘビーユーザー'
    WHEN COUNT(*) >= 10 THEN 'アクティブユーザー'
    WHEN COUNT(*) >= 5 THEN '通常ユーザー'
    WHEN COUNT(*) >= 2 THEN 'ライトユーザー'
    ELSE '新規ユーザー'
  END as user_segment
FROM interview_usage_logs
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY total_sessions DESC;