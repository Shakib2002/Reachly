'use client';

import { useState, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import type { Lead, LeadStatus, Activity } from '@/types';
import {
  X,
  Building2,
  MapPin,
  DollarSign,
  Mail,
  Phone,
  ExternalLink,
  Pencil,
  Save,
  Trash2,
  Send,
  UserPlus,
  ArrowRight,
  StickyNote,
  MailCheck,
  Loader2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

const statusConfig: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  new: { label: 'New', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  applied: { label: 'Applied', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  interview: { label: 'Interview', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  offer: { label: 'Offer', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  closed: { label: 'Closed', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const activityIcons: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  lead_added: { icon: UserPlus, bg: 'bg-blue-50', color: 'text-blue-500' },
  status_changed: { icon: ArrowRight, bg: 'bg-purple-50', color: 'text-purple-500' },
  email_sent: { icon: MailCheck, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  lead_updated: { icon: Pencil, bg: 'bg-amber-50', color: 'text-amber-500' },
  note_added: { icon: StickyNote, bg: 'bg-cyan-50', color: 'text-cyan-500' },
};

interface LeadModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export default function LeadModal({ lead, onClose }: LeadModalProps) {
  const { updateLead, updateLeadStatus, deleteLead, addNote, fetchLeadActivities } = useLeadStore();
  const [editing, setEditing] = useState(false);
  const [leadActivities, setLeadActivities] = useState<Activity[]>([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    email: '',
    phone: '',
    source: '',
  });

  useEffect(() => {
    if (lead) {
      setEditForm({
        title: lead.title || '',
        company: lead.company || '',
        location: lead.location || '',
        salary: lead.salary || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
      });
      // Fetch activities for this lead
      fetchLeadActivities(lead.id).then(setLeadActivities);
    }
  }, [lead, fetchLeadActivities]);

  const loadActivities = async (leadId: string) => {
    const acts = await fetchLeadActivities(leadId);
    setLeadActivities(acts);
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!lead) return null;

  const handleSave = async () => {
    setSaving(true);
    await updateLead(lead.id, editForm);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteLead(lead.id);
    onClose();
  };

  const handleStatusChange = async (status: LeadStatus) => {
    await updateLeadStatus(lead.id, status);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    await addNote(lead.id, noteText);
    setNoteText('');
    setSavingNote(false);
    loadActivities(lead.id);
  };

  const currentStatus = statusConfig[lead.status];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 ${currentStatus.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${currentStatus.color}`}>
                {lead.title?.[0]?.toUpperCase() || 'L'}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1e293b] truncate">{lead.title}</h2>
              {lead.company && (
                <p className="text-sm text-slate-400 truncate">{lead.company}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Left Panel - Lead Details */}
            <div className="lg:col-span-2 p-6 space-y-5">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(statusConfig) as LeadStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
                        lead.status === s
                          ? `${statusConfig[s].bg} ${statusConfig[s].color} ${statusConfig[s].border}`
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Details
                </label>

                {editing ? (
                  <div className="space-y-2.5">
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Title / Position"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <input
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      placeholder="Company"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Location"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <input
                      value={editForm.salary}
                      onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                      placeholder="Salary range"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {lead.company && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{lead.company}</span>
                      </div>
                    )}
                    {lead.location && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{lead.location}</span>
                      </div>
                    )}
                    {lead.salary && (
                      <div className="flex items-center gap-2.5 text-sm text-emerald-600 font-medium">
                        <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{lead.salary}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <a href={`mailto:${lead.email}`} className="hover:text-blue-500 transition-colors">{lead.email}</a>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.source && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>Source: {lead.source}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 mt-2 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit Details
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Actions
                </label>
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Email
                  </a>
                )}
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Lead
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-600 text-xs font-semibold mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Delete this lead?
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 bg-white text-slate-600 px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                Added {formatRelativeTime(lead.created_at)}
              </div>
            </div>

            {/* Right Panel - Timeline + Notes */}
            <div className="lg:col-span-3 p-6 space-y-5">
              {/* Add Note */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Add Note
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write a note..."
                      rows={2}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || savingNote}
                    className="self-end px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Activity Timeline
                </label>
                {leadActivities.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

                    <div className="space-y-4">
                      {leadActivities.map((activity) => {
                        const iconConfig = activityIcons[activity.action] || activityIcons.lead_added;
                        const Icon = iconConfig.icon;
                        return (
                          <div key={activity.id} className="flex items-start gap-3 relative">
                            <div className={`w-8 h-8 ${iconConfig.bg} rounded-lg flex items-center justify-center z-10 flex-shrink-0`}>
                              <Icon className={`w-3.5 h-3.5 ${iconConfig.color}`} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm text-slate-600 leading-snug">
                                {activity.description}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatRelativeTime(activity.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <StickyNote className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400">No activity yet</p>
                  </div>
                )}
              </div>

              {/* Existing Notes */}
              {lead.notes && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Notes History
                  </label>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                    {lead.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
