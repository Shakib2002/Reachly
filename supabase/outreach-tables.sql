-- Run this in Supabase SQL Editor to create outreach tables

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (auth.uid() = user_id);

-- Emails sent table
CREATE TABLE IF NOT EXISTS emails_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  to_name TEXT DEFAULT '',
  company TEXT DEFAULT '',
  subject TEXT NOT NULL,
  template_name TEXT DEFAULT 'Custom',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own emails" ON emails_sent FOR ALL USING (auth.uid() = user_id);
