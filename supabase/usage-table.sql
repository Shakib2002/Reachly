-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  leads_count INTEGER DEFAULT 0,
  emails_count INTEGER DEFAULT 0,
  job_searches_count INTEGER DEFAULT 0,
  ai_generations_count INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own usage" ON usage_tracking FOR ALL USING (auth.uid() = user_id);

-- Add subscription columns to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
