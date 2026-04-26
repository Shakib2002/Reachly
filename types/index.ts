export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
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
