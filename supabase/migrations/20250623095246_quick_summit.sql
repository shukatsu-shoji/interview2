/*
  # ユーザー利用統計ビューの作成

  1. 新しいビュー
    - `user_usage_stats`: ユーザーごとの詳細な利用統計
    - `usage_summary`: 全体のサマリー統計  
    - `usage_distribution`: 利用頻度別ユーザー分布
    - `daily_usage_stats`: 日別利用統計

  2. 機能
    - 各ユーザーの通算利用回数
    - 期間別利用統計（今日/今週/今月）
    - 利用カテゴリ分類
    - 管理者向け統計データ
*/

-- ユーザー利用統計ビューの作成
CREATE OR REPLACE VIEW user_usage_stats AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  COALESCE(stats.total_usage, 0) as total_usage,
  stats.first_usage,
  stats.last_usage,
  COALESCE(stats.today_usage, 0) as today_usage,
  COALESCE(stats.this_week_usage, 0) as this_week_usage,
  COALESCE(stats.this_month_usage, 0) as this_month_usage,
  CASE 
    WHEN stats.total_usage IS NULL THEN 'inactive'
    WHEN stats.total_usage >= 10 THEN 'heavy'
    WHEN stats.total_usage >= 3 THEN 'moderate'
    ELSE 'light'
  END as usage_category
FROM 
  auth.users u
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_usage,
    MIN(started_at) as first_usage,
    MAX(started_at) as last_usage,
    COUNT(CASE WHEN DATE(started_at) = CURRENT_DATE THEN 1 END) as today_usage,
    COUNT(CASE WHEN started_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_usage,
    COUNT(CASE WHEN started_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_usage
  FROM interview_usage_logs
  GROUP BY user_id
) stats ON u.id = stats.user_id
ORDER BY stats.total_usage DESC NULLS LAST, u.created_at DESC;

-- 管理者向けサマリービューの作成
CREATE OR REPLACE VIEW usage_summary AS
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_interviews,
  COUNT(CASE WHEN DATE(started_at) = CURRENT_DATE THEN 1 END) as today_interviews,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_interviews,
  COUNT(CASE WHEN started_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_interviews,
  CAST(ROUND(CAST(AVG(daily_usage.usage_count) AS NUMERIC), 2) AS DECIMAL) as avg_daily_usage
FROM interview_usage_logs
CROSS JOIN (
  SELECT CAST(COUNT(*) AS DECIMAL) / NULLIF(EXTRACT(DAY FROM MAX(started_at) - MIN(started_at)) + 1, 0) as usage_count
  FROM interview_usage_logs
) daily_usage;

-- 利用頻度別ユーザー数ビューの作成
CREATE OR REPLACE VIEW usage_distribution AS
SELECT 
  usage_category,
  COUNT(*) as user_count,
  CAST(ROUND(CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS NUMERIC), 2) AS DECIMAL) as percentage
FROM user_usage_stats
GROUP BY usage_category
ORDER BY 
  CASE usage_category
    WHEN 'heavy' THEN 1
    WHEN 'moderate' THEN 2
    WHEN 'light' THEN 3
    WHEN 'inactive' THEN 4
  END;

-- 日別利用統計ビューの作成
CREATE OR REPLACE VIEW daily_usage_stats AS
SELECT 
  DATE(started_at) as usage_date,
  COUNT(*) as total_interviews,
  COUNT(DISTINCT user_id) as unique_users,
  CAST(ROUND(CAST(COUNT(*) * 1.0 / COUNT(DISTINCT user_id) AS NUMERIC), 2) AS DECIMAL) as avg_interviews_per_user
FROM interview_usage_logs
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY usage_date DESC;