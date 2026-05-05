export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'team';
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export type LeadStatus = 'new' | 'applied' | 'interview' | 'offer' | 'closed';

export interface Template {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  created_at?: string;
}

export interface EmailSent {
  id: string;
  user_id: string;
  lead_id: string;
  template_id: string | null;
  sent_at: string;
  status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed';
}

export interface Activity {
  id: string;
  user_id: string;
  lead_id: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description: string;
  url: string;
  source: string;
  posted_at: string;
}

// Client CRM Types
export type ClientLeadStatus = 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface ClientLead {
  id: string;
  user_id: string;
  client_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  project_type: string | null;
  budget_range: string | null;
  description: string | null;
  source: string | null;
  priority: 'low' | 'medium' | 'high';
  status: ClientLeadStatus;
  proposal_sent_at: string | null;
  follow_up_date: string | null;
  notes: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
}

// Follow-up Types
export type FollowUpStatus = 'pending' | 'sent' | 'cancelled' | 'failed';

export interface FollowUp {
  id: string;
  user_id: string;
  lead_id: string;
  lead_type: 'job' | 'client';
  template_id: string | null;
  subject: string;
  body: string;
  scheduled_date: string;
  status: FollowUpStatus;
  sequence_order: number;
  parent_email_id: string | null;
  sent_at: string | null;
  created_at: string;
  // joined fields
  lead_name?: string;
  company_name?: string;
}

// ─── Email Tracking ────────────────────────────────────
export interface EmailEvent {
  id: string;
  tracking_id: string;
  event_type: 'open' | 'click';
  url?: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

// ─── Email Sequences ───────────────────────────────────
export interface Sequence {
  id: string;
  user_id: string;
  name: string;
  status: 'draft' | 'active' | 'paused';
  created_at: string;
  steps?: SequenceStep[];
  _enrollmentCount?: number;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  subject: string;
  body: string;
  template_id?: string | null;
  condition: 'always' | 'if_opened' | 'if_not_opened' | 'if_clicked' | 'if_not_clicked';
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  lead_id: string;
  lead_type: 'job' | 'client';
  current_step: number;
  status: 'active' | 'completed' | 'paused' | 'bounced';
  started_at: string;
  completed_at?: string;
}

// ─── A/B Testing ───────────────────────────────────────
export interface ABTest {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'draft';
  winning_metric: 'open_rate' | 'click_rate';
  auto_winner_threshold: number;
  winner_variant_id?: string | null;
  created_at: string;
  variants?: ABVariant[];
}

export interface ABVariant {
  id: string;
  ab_test_id: string;
  name: string;
  subject: string;
  body: string;
  send_count: number;
  open_count: number;
  click_count: number;
}

// ─── Teams ─────────────────────────────────────────────
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  email?: string;
  full_name?: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  token: string;
  email?: string;
  expires_at: string;
  used_at?: string;
}
