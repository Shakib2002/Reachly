'use client';

import { create } from 'zustand';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import type { Lead, Activity, LeadStatus } from '@/types';
import toast from 'react-hot-toast';

const supabase = createBrowserSupabaseClient();

interface LeadStore {
  leads: Lead[];
  recentLeads: Lead[];
  activities: Activity[];
  loading: boolean;
  stats: {
    totalLeads: number;
    applied: number;
    inProgress: number;
    converted: number;
    weeklyChange: number;
  };
  addLeadModalOpen: boolean;

  setAddLeadModalOpen: (open: boolean) => void;
  fetchLeads: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  fetchLeadActivities: (leadId: string) => Promise<Activity[]>;
  addLead: (lead: Partial<Lead>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
  addNote: (leadId: string, note: string) => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  recentLeads: [],
  activities: [],
  loading: true,
  stats: {
    totalLeads: 0,
    applied: 0,
    inProgress: 0,
    converted: 0,
    weeklyChange: 0,
  },
  addLeadModalOpen: false,

  setAddLeadModalOpen: (open) => set({ addLeadModalOpen: open }),

  fetchLeads: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const leads = (data || []) as Lead[];
      const totalLeads = leads.length;
      const applied = leads.filter((l) => l.status === 'applied').length;
      const inProgress = leads.filter((l) => l.status === 'interview').length;
      const converted = leads.filter((l) => l.status === 'offer').length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentCount = leads.filter(
        (l) => new Date(l.created_at) > oneWeekAgo
      ).length;
      const weeklyChange = totalLeads > 0 ? Math.round((recentCount / totalLeads) * 100) : 0;

      set({
        leads,
        recentLeads: leads.slice(0, 5),
        stats: { totalLeads, applied, inProgress, converted, weeklyChange },
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      set({ loading: false });
    }
  },

  fetchActivities: async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      set({ activities: (data || []) as Activity[] });
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  },

  fetchLeadActivities: async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Activity[];
    } catch (error) {
      console.error('Error fetching lead activities:', error);
      return [];
    }
  },

  addLead: async (lead) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('leads')
        .insert({ ...lead, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('activities').insert({
        user_id: user.id,
        lead_id: data.id,
        action: 'lead_added',
        description: `Added lead: ${lead.title} at ${lead.company || 'Unknown'}`,
      });

      toast.success('Lead added successfully!');
      set({ addLeadModalOpen: false });
      get().fetchLeads();
      get().fetchActivities();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add lead';
      toast.error(message);
    }
  },

  updateLead: async (id, updates) => {
    // Optimistic update
    const prevLeads = get().leads;
    set({
      leads: prevLeads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    });

    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activities').insert({
          user_id: user.id,
          lead_id: id,
          action: 'lead_updated',
          description: `Updated lead details`,
        });
      }

      toast.success('Lead updated');
      get().fetchLeads();
      get().fetchActivities();
    } catch (error) {
      // Rollback
      set({ leads: prevLeads });
      const message = error instanceof Error ? error.message : 'Failed to update lead';
      toast.error(message);
    }
  },

  deleteLead: async (id) => {
    // Optimistic update
    const prevLeads = get().leads;
    set({ leads: prevLeads.filter((l) => l.id !== id) });

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      toast.success('Lead deleted');
      get().fetchLeads();
      get().fetchActivities();
    } catch (error) {
      set({ leads: prevLeads });
      const message = error instanceof Error ? error.message : 'Failed to delete lead';
      toast.error(message);
    }
  },

  updateLeadStatus: async (id, status) => {
    // Optimistic update
    const prevLeads = get().leads;
    set({
      leads: prevLeads.map((l) => (l.id === id ? { ...l, status } : l)),
    });

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activities').insert({
          user_id: user.id,
          lead_id: id,
          action: 'status_changed',
          description: `Status changed to ${status}`,
        });
      }

      toast.success(`Moved to ${status}`);
      get().fetchLeads();
      get().fetchActivities();
    } catch (error) {
      set({ leads: prevLeads });
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    }
  },

  addNote: async (leadId, note) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update lead notes
      const lead = get().leads.find((l) => l.id === leadId);
      const existingNotes = lead?.notes || '';
      const timestamp = new Date().toISOString();
      const newNotes = existingNotes
        ? `${existingNotes}\n---\n[${timestamp}] ${note}`
        : `[${timestamp}] ${note}`;

      await supabase.from('leads').update({ notes: newNotes }).eq('id', leadId);

      await supabase.from('activities').insert({
        user_id: user.id,
        lead_id: leadId,
        action: 'note_added',
        description: `Note: ${note.slice(0, 60)}${note.length > 60 ? '...' : ''}`,
      });

      toast.success('Note added');
      get().fetchLeads();
      get().fetchActivities();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add note';
      toast.error(message);
    }
  },

  subscribeToChanges: () => {
    // Get current user ID for filtering — only listen to OUR changes
    let userId: string | null = null;
    supabase.auth.getUser().then(({ data }) => { userId = data.user?.id || null; });

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: 'leads',
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
        },
        () => {
          get().fetchLeads();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: 'activities',
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
        },
        () => {
          get().fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
