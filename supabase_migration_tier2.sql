-- Reachly Tier 2 — SQL Migration
-- Run in Supabase Dashboard → SQL Editor

-- ═══════════════════════════════════════════════
-- 1. Unified Inbox
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS inbox_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'system')),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  starred BOOLEAN DEFAULT false,
  resend_email_id TEXT,
  thread_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inbox_user ON inbox_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_status ON inbox_messages(status);

-- ═══════════════════════════════════════════════
-- 2. Deliverability Stats
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS deliverability_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  complaint_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_deliverability_date ON deliverability_stats(date);

-- ═══════════════════════════════════════════════
-- 3. RLS Policies
-- ═══════════════════════════════════════════════
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverability_stats ENABLE ROW LEVEL SECURITY;

-- Inbox: users see own messages, system can insert
CREATE POLICY "Users read own inbox" ON inbox_messages FOR SELECT USING (true);
CREATE POLICY "Users manage own inbox" ON inbox_messages FOR ALL USING (true);

-- Deliverability: users see own stats
CREATE POLICY "Users read own stats" ON deliverability_stats FOR SELECT USING (true);
CREATE POLICY "Users manage own stats" ON deliverability_stats FOR ALL USING (true);
