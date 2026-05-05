-- Reachly Tier 3 — SQL Migration
-- Run in Supabase Dashboard → SQL Editor

-- ═══════════════════════════════════════════════
-- 1. API Keys (for Public API)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT '{"read"}',
  rate_limit INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- ═══════════════════════════════════════════════
-- 2. Webhooks (for API Platform)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- 3. White-Label Config
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS white_label_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  company_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  accent_color TEXT DEFAULT '#6366f1',
  custom_domain TEXT,
  support_email TEXT,
  hide_powered_by BOOLEAN DEFAULT false,
  custom_login_bg TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- 4. Sub-Accounts (Agency client accounts)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sub_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  leads_count INTEGER DEFAULT 0,
  emails_sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- 5. LinkedIn Sequences
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS linkedin_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS linkedin_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES linkedin_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('profile_visit', 'connect', 'message', 'follow', 'endorse')),
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  message TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_all" ON api_keys FOR ALL USING (true);
CREATE POLICY "webhooks_all" ON webhooks FOR ALL USING (true);
CREATE POLICY "wl_config_all" ON white_label_config FOR ALL USING (true);
CREATE POLICY "sub_accounts_all" ON sub_accounts FOR ALL USING (true);
CREATE POLICY "li_sequences_all" ON linkedin_sequences FOR ALL USING (true);
CREATE POLICY "li_steps_all" ON linkedin_steps FOR ALL USING (true);
