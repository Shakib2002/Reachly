-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT, job_title TEXT, location TEXT, bio TEXT,
  linkedin_url TEXT, website_url TEXT, avatar_url TEXT,
  rapidapi_key TEXT, hunter_api_key TEXT, resend_api_key TEXT,
  notification_preferences JSONB DEFAULT '{"new_lead":true,"status_changed":true,"email_reply":true,"followup_reminder":true,"weekly_summary":true,"product_updates":false}',
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
