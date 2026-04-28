'use client';

import { create } from 'zustand';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import type { ClientLead, ClientLeadStatus } from '@/types';
import toast from 'react-hot-toast';

const supabase = createBrowserSupabaseClient();

interface ClientStore {
  clients: ClientLead[];
  loading: boolean;
  addModalOpen: boolean;
  setAddModalOpen: (open: boolean) => void;
  fetchClients: () => Promise<void>;
  addClient: (client: Partial<ClientLead>) => Promise<void>;
  updateClient: (id: string, updates: Partial<ClientLead>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateClientStatus: (id: string, status: ClientLeadStatus) => Promise<void>;
  markAsWon: (id: string) => Promise<void>;
  markAsLost: (id: string, reason: string) => Promise<void>;
  addNote: (id: string, note: string) => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  loading: true,
  addModalOpen: false,

  setAddModalOpen: (open) => set({ addModalOpen: open }),

  fetchClients: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('client_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ clients: (data || []) as ClientLead[], loading: false });
    } catch (e) {
      console.error('Error fetching clients:', e);
      set({ loading: false });
    }
  },

  addClient: async (client) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('client_leads')
        .insert({ ...client, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await supabase.from('activities').insert({
        user_id: user.id,
        lead_id: data.id,
        action: 'client_added',
        description: `Added client: ${client.client_name}`,
      });
      toast.success('Client added!');
      set({ addModalOpen: false });
      get().fetchClients();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add client');
    }
  },

  updateClient: async (id, updates) => {
    const prev = get().clients;
    set({ clients: prev.map(c => c.id === id ? { ...c, ...updates } : c) });
    try {
      const { error } = await supabase.from('client_leads').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Client updated');
      get().fetchClients();
    } catch (e) {
      set({ clients: prev });
      toast.error(e instanceof Error ? e.message : 'Failed to update client');
    }
  },

  deleteClient: async (id) => {
    const prev = get().clients;
    set({ clients: prev.filter(c => c.id !== id) });
    try {
      const { error } = await supabase.from('client_leads').delete().eq('id', id);
      if (error) throw error;
      // Cancel pending follow-ups
      await supabase.from('follow_ups').update({ status: 'cancelled' }).eq('lead_id', id).eq('status', 'pending');
      toast.success('Client deleted');
      get().fetchClients();
    } catch (e) {
      set({ clients: prev });
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  },

  updateClientStatus: async (id, status) => {
    const prev = get().clients;
    set({ clients: prev.map(c => c.id === id ? { ...c, status } : c) });
    try {
      const updates: Partial<ClientLead> = { status };
      if (status === 'won') updates.won_at = new Date().toISOString();
      if (status === 'lost') updates.lost_at = new Date().toISOString();
      if (status === 'proposal') updates.proposal_sent_at = new Date().toISOString();
      const { error } = await supabase.from('client_leads').update(updates).eq('id', id);
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activities').insert({
          user_id: user.id, lead_id: id, action: 'status_changed',
          description: `Client status changed to ${status}`,
        });
      }
      // Auto-cancel follow-ups on terminal status
      if (status === 'won' || status === 'lost') {
        const { data: cancelled } = await supabase.from('follow_ups').update({ status: 'cancelled' }).eq('lead_id', id).eq('status', 'pending').select('id');
        if (cancelled && cancelled.length > 0) {
          toast.success(`Moved to ${status}. ${cancelled.length} follow-up(s) cancelled.`);
        } else {
          toast.success(`Moved to ${status}`);
        }
      } else {
        toast.success(`Moved to ${status}`);
      }
      get().fetchClients();
    } catch (e) {
      set({ clients: prev });
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    }
  },

  markAsWon: async (id) => { get().updateClientStatus(id, 'won'); },
  markAsLost: async (id, reason) => {
    const prev = get().clients;
    set({ clients: prev.map(c => c.id === id ? { ...c, status: 'lost' as ClientLeadStatus, lost_reason: reason } : c) });
    try {
      const { error } = await supabase.from('client_leads').update({ status: 'lost', lost_at: new Date().toISOString(), lost_reason: reason }).eq('id', id);
      if (error) throw error;
      await supabase.from('follow_ups').update({ status: 'cancelled' }).eq('lead_id', id).eq('status', 'pending');
      toast.success('Marked as lost');
      get().fetchClients();
    } catch (e) {
      set({ clients: prev });
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  },

  addNote: async (id, note) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const client = get().clients.find(c => c.id === id);
      const existing = client?.notes || '';
      const ts = new Date().toISOString();
      const newNotes = existing ? `${existing}\n---\n[${ts}] ${note}` : `[${ts}] ${note}`;
      await supabase.from('client_leads').update({ notes: newNotes }).eq('id', id);
      await supabase.from('activities').insert({
        user_id: user.id, lead_id: id, action: 'note_added',
        description: `Note: ${note.slice(0, 60)}${note.length > 60 ? '...' : ''}`,
      });
      toast.success('Note added');
      get().fetchClients();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  },

  subscribeToChanges: () => {
    const ch = supabase
      .channel('client-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_leads' }, () => get().fetchClients())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  },
}));
