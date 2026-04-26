-- Client Leads Table
CREATE TABLE IF NOT EXISTS client_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  project_type TEXT,
  budget_range TEXT,
  description TEXT,
  source TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'lead',
  proposal_sent_at TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,
  notes TEXT,
  won_at TIMESTAMP WITH TIME ZONE,
  lost_at TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own client leads" ON client_leads
  FOR ALL USING (auth.uid() = user_id);

-- Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID,
  lead_type TEXT NOT NULL,
  template_id UUID,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  sequence_order INTEGER DEFAULT 1,
  parent_email_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own follow_ups" ON follow_ups
  FOR ALL USING (auth.uid() = user_id);
