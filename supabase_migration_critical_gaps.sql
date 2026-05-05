-- Reachly Critical Gaps — SQL Migration
-- Run this in Supabase Dashboard → SQL Editor

-- ═══════════════════════════════════════════════
-- 1. Email Tracking Events
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  url TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_events_tracking ON email_events(tracking_id);

-- Add tracking columns to existing emails_sent table
ALTER TABLE emails_sent ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE emails_sent ADD COLUMN IF NOT EXISTS variant_id TEXT;
ALTER TABLE emails_sent ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE emails_sent ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- ═══════════════════════════════════════════════
-- 2. A/B Tests
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  winning_metric TEXT DEFAULT 'open_rate' CHECK (winning_metric IN ('open_rate', 'click_rate')),
  auto_winner_threshold INTEGER DEFAULT 50,
  winner_variant_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ab_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ab_test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  send_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0
);

-- ═══════════════════════════════════════════════
-- 3. Email Sequences
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id UUID,
  condition TEXT DEFAULT 'always' CHECK (condition IN ('always', 'if_opened', 'if_not_opened', 'if_clicked', 'if_not_clicked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('job', 'client')),
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'bounced')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════
-- 4. Teams
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════
-- 5. Row Level Security
-- ═══════════════════════════════════════════════
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Email events: allow insert from service role (API routes), read by tracking_id
CREATE POLICY "Allow insert email events" ON email_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read email events" ON email_events FOR SELECT USING (true);

-- A/B Tests
CREATE POLICY "Users manage own ab_tests" ON ab_tests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own variants" ON ab_variants FOR ALL USING (
  ab_test_id IN (SELECT id FROM ab_tests WHERE user_id = auth.uid())
);

-- Sequences
CREATE POLICY "Users manage own sequences" ON sequences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own steps" ON sequence_steps FOR ALL USING (
  sequence_id IN (SELECT id FROM sequences WHERE user_id = auth.uid())
);
CREATE POLICY "Users manage own enrollments" ON sequence_enrollments FOR ALL USING (
  sequence_id IN (SELECT id FROM sequences WHERE user_id = auth.uid())
);

-- Teams
CREATE POLICY "Owner manages team" ON teams FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Team members view team" ON teams FOR SELECT USING (
  id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members view membership" ON team_members FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Owner manages members" ON team_members FOR ALL USING (
  team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
);
CREATE POLICY "Members manage own membership" ON team_members FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Owner manages invites" ON team_invites FOR ALL USING (
  team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
);
CREATE POLICY "Read invite by token" ON team_invites FOR SELECT USING (true);
