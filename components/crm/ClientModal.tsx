'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Building2, User, Mail, Phone, Copy, Check, Trophy, XCircle, Clock, FileText, Bell, Send } from 'lucide-react';
import { useClientStore } from '@/lib/clientStore';
import { useFollowUps } from '@/hooks/useFollowUps';
import FollowUpScheduler from '@/components/outreach/FollowUpScheduler';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { formatRelativeTime } from '@/lib/utils';
import type { ClientLead, Activity } from '@/types';
import toast from 'react-hot-toast';

const supabase = createBrowserSupabaseClient();

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  sent: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-400 border-slate-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
};

export default function ClientModal({ client, onClose }: { client: ClientLead; onClose: () => void }) {
  const { updateClient: _updateClient, markAsWon, markAsLost, addNote: storeAddNote } = useClientStore();
  const { followUps, loading: fuLoading, getFollowUps, cancelFollowUp, sendFollowUpNow } = useFollowUps();
  const [tab, setTab] = useState<'activity' | 'notes' | 'followups'>('activity');
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [showLostInput, setShowLostInput] = useState(false);
  const [copied, setCopied] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch activities
    supabase.from('activities').select('*').eq('lead_id', client.id).order('created_at', { ascending: false }).then(({ data }) => {
      setActivities((data || []) as Activity[]);
    });
    // Fetch follow-ups
    getFollowUps(client.id, 'client');
  }, [client.id, getFollowUps]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
    toast.success('Copied!');
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await storeAddNote(client.id, newNote);
    setNewNote('');
    // Refresh activities
    const { data } = await supabase.from('activities').select('*').eq('lead_id', client.id).order('created_at', { ascending: false });
    setActivities((data || []) as Activity[]);
    setSaving(false);
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) { toast.error('Please provide a reason'); return; }
    await markAsLost(client.id, lostReason);
    onClose();
  };

  const notes = (client.notes || '').split('\n---\n').filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />{client.client_name}
            </h2>
            {client.contact_person && <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{client.contact_person}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Left Panel */}
          <div className="lg:w-[280px] p-5 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-4 flex-shrink-0">
            {/* Contact info */}
            {client.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{client.email}</div>
                <button onClick={() => copyToClipboard(client.email!, 'email')} className="p-1 hover:bg-slate-100 rounded-lg">
                  {copied === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{client.phone}</div>
                <button onClick={() => copyToClipboard(client.phone!, 'phone')} className="p-1 hover:bg-slate-100 rounded-lg">
                  {copied === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {client.project_type && <div className="text-xs"><span className="text-slate-400">Project:</span> <span className="font-semibold text-[#1e293b]">{client.project_type}</span></div>}
              {client.budget_range && <div className="text-xs"><span className="text-slate-400">Budget:</span> <span className="font-semibold text-emerald-600">{client.budget_range}</span></div>}
              {client.source && <div className="text-xs"><span className="text-slate-400">Source:</span> <span className="font-semibold text-[#1e293b]">{client.source}</span></div>}
              <div className="text-xs"><span className="text-slate-400">Priority:</span> <span className={`font-semibold capitalize ${client.priority === 'high' ? 'text-red-600' : client.priority === 'medium' ? 'text-amber-600' : 'text-slate-500'}`}>{client.priority}</span></div>
              <div className="text-xs"><span className="text-slate-400">Status:</span> <span className="font-semibold text-[#1e293b] capitalize">{client.status}</span></div>
            </div>

            {client.description && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 mb-1">Description</p>
                <p className="text-xs text-slate-600 leading-relaxed">{client.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {client.status !== 'won' && client.status !== 'lost' && (
                <>
                  <button onClick={() => { markAsWon(client.id); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">
                    <Trophy className="w-3.5 h-3.5" />Mark as Won
                  </button>
                  {!showLostInput ? (
                    <button onClick={() => setShowLostInput(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                      <XCircle className="w-3.5 h-3.5" />Mark as Lost
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Reason for loss..." className="w-full px-3 py-2 border border-red-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-200" />
                      <button onClick={handleMarkLost} className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600">Confirm Lost</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-5">
              {[
                { id: 'activity' as const, label: 'Activity', icon: Clock },
                { id: 'notes' as const, label: 'Notes', icon: FileText },
                { id: 'followups' as const, label: 'Follow-ups', icon: Bell },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* Activity Tab */}
              {tab === 'activity' && (
                <div className="space-y-3">
                  {activities.length > 0 ? activities.map(a => (
                    <div key={a.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[#1e293b] font-medium">{a.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(a.created_at)}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 text-center py-8">No activity yet</p>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {tab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..."
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" rows={2} />
                    <button onClick={handleAddNote} disabled={saving || !newNote.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-30 flex-shrink-0 self-end">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                  {notes.length > 0 ? notes.map((note, i) => {
                    const match = note.match(/^\[(.+?)\]\s*([\s\S]*)/);
                    return (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-[#1e293b]">{match ? match[2] : note}</p>
                        {match && <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(match[1])}</p>}
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-slate-400 text-center py-4">No notes yet</p>
                  )}
                </div>
              )}

              {/* Follow-ups Tab */}
              {tab === 'followups' && (
                <div className="space-y-3">
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setSchedulerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                      <Bell className="w-3.5 h-3.5" />Schedule Follow-up
                    </button>
                  </div>
                  {fuLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                  ) : followUps.length > 0 ? followUps.map(fu => (
                    <div key={fu.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{fu.sequence_order}</div>
                        <div>
                          <p className="text-xs font-semibold text-[#1e293b] truncate max-w-[200px]">{fu.subject}</p>
                          <p className="text-[10px] text-slate-400">{new Date(fu.scheduled_date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[fu.status]}`}>{fu.status}</span>
                        {fu.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => sendFollowUpNow(fu.id)} className="p-1 hover:bg-blue-50 rounded-lg"><Send className="w-3.5 h-3.5 text-blue-500" /></button>
                            <button onClick={() => cancelFollowUp(fu.id)} className="p-1 hover:bg-red-50 rounded-lg"><XCircle className="w-3.5 h-3.5 text-red-400" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No follow-ups scheduled</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Keep the conversation going by scheduling an automated sequence.</p>
                      <button onClick={() => setSchedulerOpen(true)} className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25">
                        Schedule Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {schedulerOpen && (
        <FollowUpScheduler
          leadId={client.id}
          leadType="client"
          leadName={client.contact_person || client.client_name}
          companyName={client.client_name}
          onClose={() => setSchedulerOpen(false)}
        />
      )}
    </div>
  );
}
