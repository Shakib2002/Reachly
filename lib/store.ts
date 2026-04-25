'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase';
import type { Lead, Activity, LeadStatus } from '@/types';
import toast from 'react-hot-toast';

const supabase = createClient();

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
  addLead: (lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const leads = (data || []) as Lead[];
      const totalLeads = leads.length;
      const applied = leads.filter((l) => l.status === 'applied').length;
      const inProgress = leads.filter((l) => l.status === 'interview').length;
      const converted = leads.filter((l) => l.status === 'offer').length;

      // Calculate weekly change
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

      // Log activity
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

  deleteLead: async (id) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      toast.success('Lead deleted');
      get().fetchLeads();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete lead';
      toast.error(message);
    }
  },

  updateLeadStatus: async (id, status) => {
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

      toast.success(`Status updated to ${status}`);
      get().fetchLeads();
      get().fetchActivities();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    }
  },

  subscribeToChanges: () => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          get().fetchLeads();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
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
