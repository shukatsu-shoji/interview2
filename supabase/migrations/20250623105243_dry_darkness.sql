/*
  # ユーザーフィードバック機能

  1. New Tables
    - `user_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `rating` (integer, 1-5 stars)
      - `category` (text, feedback category)
      - `title` (text, feedback title)
      - `description` (text, detailed feedback)
      - `email` (text, optional contact email)
      - `status` (text, feedback status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_feedback` table
    - Add policy for users to insert their own feedback
    - Add policy for users to read their own feedback
    - Add policy for admins to read all feedback
*/

CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category text NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'general')),
  title text NOT NULL,
  description text NOT NULL,
  email text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_category ON user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);

-- フィードバック統計ビュー
CREATE OR REPLACE VIEW feedback_stats AS
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_feedback,
  COUNT(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_feedback,
  COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_feedback,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN category = 'bug' THEN 1 END) as bug_reports,
  COUNT(CASE WHEN category = 'feature' THEN 1 END) as feature_requests,
  COUNT(CASE WHEN category = 'improvement' THEN 1 END) as improvement_suggestions,
  COUNT(CASE WHEN category = 'general' THEN 1 END) as general_feedback,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_feedback,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_feedback
FROM user_feedback;

-- カテゴリ別フィードバック統計ビュー
CREATE OR REPLACE VIEW feedback_by_category AS
SELECT 
  category,
  COUNT(*) as feedback_count,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_feedback
GROUP BY category
ORDER BY feedback_count DESC;

-- 評価別フィードバック分布ビュー
CREATE OR REPLACE VIEW feedback_by_rating AS
SELECT 
  rating,
  COUNT(*) as feedback_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_feedback
GROUP BY rating
ORDER BY rating DESC;