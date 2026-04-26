'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { FollowUp } from '@/types';
import toast from 'react-hot-toast';

const supabase = createClient();

export function useFollowUps() {
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  const getFollowUps = useCallback(async (leadId: string, leadType: 'job' | 'client') => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('lead_id', leadId)
        .eq('lead_type', leadType)
        .order('sequence_order', { ascending: true });
      if (error) throw error;
      setFollowUps((data || []) as FollowUp[]);
    } catch (e) {
      console.error('Error fetching follow-ups:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUpcomingFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      setFollowUps((data || []) as FollowUp[]);
    } catch (e) {
      console.error('Error fetching upcoming:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleFollowUps = useCallback(async (
    leadId: string,
    leadType: 'job' | 'client',
    items: { subject: string; body: string; scheduledDate: string; sequenceOrder: number; templateId?: string }[]
  ) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const rows = items.map(item => ({
        user_id: user.id,
        lead_id: leadId,
        lead_type: leadType,
        template_id: item.templateId || null,
        subject: item.subject,
        body: item.body,
        scheduled_date: item.scheduledDate,
        sequence_order: item.sequenceOrder,
        status: 'pending',
      }));
      const { error } = await supabase.from('follow_ups').insert(rows);
      if (error) throw error;
      toast.success(`${items.length} follow-up(s) scheduled!`);
      await getFollowUps(leadId, leadType);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  }, [getFollowUps]);

  const cancelFollowUp = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('follow_ups').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'cancelled' as const } : f));
      toast.success('Follow-up cancelled');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }, []);

  const sendFollowUpNow = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const fu = followUps.find(f => f.id === id);
      if (!fu) throw new Error('Follow-up not found');
      // Send via our email API
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'recipient@example.com', // Will be resolved from lead
          subject: fu.subject,
          body: fu.body,
          leadId: fu.lead_id,
          leadType: fu.lead_type,
        }),
      });
      if (!res.ok) throw new Error('Failed to send email');
      await supabase.from('follow_ups').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      }).eq('id', id);
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'sent' as const, sent_at: new Date().toISOString() } : f));
      toast.success('Follow-up sent!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setLoading(false);
    }
  }, [followUps]);

  return { followUps, loading, getFollowUps, getUpcomingFollowUps, scheduleFollowUps, cancelFollowUp, sendFollowUpNow };
}
