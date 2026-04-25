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
