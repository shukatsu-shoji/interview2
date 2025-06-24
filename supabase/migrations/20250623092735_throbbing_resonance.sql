/*
  # Create interview usage logs table

  1. New Tables
    - `interview_usage_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `started_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `interview_usage_logs` table
    - Add policy for users to view their own usage logs
    - Add policy for service to insert usage logs
*/

CREATE TABLE IF NOT EXISTS interview_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON interview_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage logs"
  ON interview_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);