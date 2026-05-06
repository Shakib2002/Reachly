'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Check, Bell } from 'lucide-react';
import { useFollowUps } from '@/hooks/useFollowUps';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import type { Template } from '@/types';

const supabase = createBrowserSupabaseClient();

interface Props {
  leadId: string;
  leadType: 'job' | 'client';
  leadName: string;
  companyName: string;
  onClose: () => void;
}

interface FollowUpRow {
  enabled: boolean;
  templateId: string;
  days: number;
  subject: string;
  body: string;
}

export default function FollowUpScheduler({ leadId, leadType, leadName, companyName, onClose }: Props) {
  const { scheduleFollowUps, loading } = useFollowUps();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rows, setRows] = useState<FollowUpRow[]>([
    { enabled: true, templateId: '', days: 3, subject: `Following up — ${leadName} at ${companyName}`, body: `Hi,\n\nI wanted to follow up on my previous message regarding ${leadName} at ${companyName}. I remain very interested.\n\nBest regards` },
    { enabled: true, templateId: '', days: 7, subject: `Quick check-in — ${leadName}`, body: `Hi,\n\nJust checking in on my application. Would love to discuss further.\n\nBest` },
    { enabled: false, templateId: '', days: 14, subject: `Final follow-up — ${leadName}`, body: `Hi,\n\nI wanted to send one last follow-up. Please let me know if there's any interest.\n\nThank you` },
  ]);

  useEffect(() => {
    supabase.from('templates').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) console.error('Error fetching templates:', error);
      setTemplates((data || []) as Template[]);
    });
  }, []);

  const updateRow = (idx: number, updates: Partial<FollowUpRow>) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...updates } : r));
  };

  const handleTemplateChange = (idx: number, templateId: string) => {
    const tpl = templates.find(t => t.id === templateId);
    if (tpl) {
      const subject = tpl.subject.replace(/\{\{position\}\}/g, leadName).replace(/\{\{company\}\}/g, companyName);
      const body = tpl.body.replace(/\{\{position\}\}/g, leadName).replace(/\{\{company\}\}/g, companyName);
      updateRow(idx, { templateId, subject, body });
    } else {
      updateRow(idx, { templateId });
    }
  };

  const getScheduledDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  const enabledCount = rows.filter(r => r.enabled).length;

  const handleSchedule = async () => {
    const items = rows.filter(r => r.enabled).map((r, i) => ({
      subject: r.subject,
      body: r.body,
      scheduledDate: getScheduledDate(r.days).toISOString(),
      sequenceOrder: i + 1,
      templateId: r.templateId || undefined,
    }));
    await scheduleFollowUps(leadId, leadType, items);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="followup-title">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 id="followup-title" className="text-lg font-bold text-[#1e293b] flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" />Schedule Follow-ups</h2>
              <p className="text-xs text-slate-400 mt-1">Automatically follow up with <strong>{leadName}</strong> at <strong>{companyName}</strong></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl" aria-label="Close follow-up scheduler"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
        </div>

        {/* Follow-up Rows */}
        <div className="px-6 py-4 space-y-4">
          {rows.map((row, idx) => (
            <div key={idx} className={`p-4 rounded-xl border transition-all ${row.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50 opacity-60'}`}>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => updateRow(idx, { enabled: !row.enabled })}
                  aria-label={`${row.enabled ? 'Disable' : 'Enable'} follow-up ${idx + 1}`}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${row.enabled ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                  {row.enabled && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm font-bold text-[#1e293b]">Follow-up {idx + 1}</span>
              </div>

              {row.enabled && (
                <div className="space-y-3 ml-8">
                  {/* Template selector */}
                  <select value={row.templateId} onChange={e => handleTemplateChange(idx, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
                    <option value="">Use custom message</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject.slice(0, 40)}</option>)}
                  </select>

                  {/* Days input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Send after</span>
                    <input type="number" min={1} max={90} value={row.days} onChange={e => updateRow(idx, { days: parseInt(e.target.value) || 1 })}
                      className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <span className="text-xs text-slate-500">days</span>
                  </div>

                  {/* Date preview */}
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <Calendar className="w-3.5 h-3.5" />
                    Will send on: <strong>{formatDate(getScheduledDate(row.days))}</strong>
                  </div>

                  {/* Subject preview */}
                  <div className="text-[11px] text-slate-400">
                    Subject: <span className="text-slate-600 font-medium">{row.subject.slice(0, 60)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Skip</button>
          <button onClick={handleSchedule} disabled={loading || enabledCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Schedule {enabledCount} Follow-up{enabledCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
