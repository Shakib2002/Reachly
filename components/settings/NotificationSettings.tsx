'use client';

import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

const supabase = createBrowserSupabaseClient();
const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white';

interface NotifPrefs {
  [key: string]: boolean;
}

interface Props {
  prefs: NotifPrefs;
  onChange: (p: NotifPrefs) => void;
}

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-60' : ''}`}>
      <span className="text-sm text-[#1e293b]">{label}{disabled && <span className="ml-2 text-[10px] text-slate-400 font-medium uppercase tracking-wide">Always on</span>}</span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-500' : 'bg-slate-200'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

const SECTIONS = [
  {
    title: 'Job Search',
    icon: '💼',
    items: [
      { key: 'job_new_matches', label: 'New job matches found' },
      { key: 'job_status_changed', label: 'Lead status changed' },
      { key: 'job_followup_reminder', label: 'Follow-up reminder' },
      { key: 'job_deadline_reminder', label: 'Application deadline reminder' },
    ],
  },
  {
    title: 'Client Pipeline',
    icon: '🏢',
    items: [
      { key: 'client_lead_added', label: 'New client lead added' },
      { key: 'client_proposal_reminder', label: 'Proposal follow-up reminder' },
      { key: 'client_status_changed', label: 'Client status changed' },
      { key: 'client_project_won', label: 'Project won notification' },
    ],
  },
  {
    title: 'Outreach',
    icon: '📧',
    items: [
      { key: 'outreach_email_sent', label: 'Email sent confirmation' },
      { key: 'outreach_followup_sent', label: 'Follow-up sent confirmation' },
      { key: 'outreach_sequence_done', label: 'Sequence completed' },
    ],
  },
  {
    title: 'General',
    icon: '⚙️',
    items: [
      { key: 'general_weekly_summary', label: 'Weekly performance summary', defaultOn: true },
      { key: 'general_monthly_report', label: 'Monthly analytics report', defaultOn: true },
      { key: 'general_product_updates', label: 'Product updates & tips' },
      { key: 'general_security_alerts', label: 'Security alerts', always: true },
    ],
  },
];

export default function NotificationSettings({ prefs, onChange }: Props) {
  const [saving, setSaving] = useState(false);
  const [fu1, setFu1] = useState('3');
  const [fu2, setFu2] = useState('7');
  const [fu3, setFu3] = useState('14');
  const [sendTime, setSendTime] = useState('09:00');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [reportDay, setReportDay] = useState('Monday');
  const [reportIncludes, setReportIncludes] = useState({
    job_pipeline: true, client_pipeline: true, emails_sent: true, followups_sent: true, ai_insights: true,
  });

  const set = (key: string, val: boolean) => onChange({ ...prefs, [key]: val });

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase.from('user_settings').update({
      notification_preferences: { ...prefs, fu1, fu2, fu3, sendTime, timezone, reportDay, reportIncludes },
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
    if (error) toast.error('Failed to save');
    else toast.success('Preferences saved!');
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Toggle sections */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <h2 className="text-base font-bold text-[#1e293b] mb-5">Email Notifications</h2>
        <div className="space-y-5">
          {SECTIONS.map(sec => (
            <div key={sec.title}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{sec.icon}</span>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{sec.title}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {sec.items.map(item => (
                  <Toggle
                    key={item.key}
                    label={item.label}
                    checked={prefs[item.key] ?? (item as { key: string; label: string; defaultOn?: boolean; always?: boolean }).defaultOn ?? (item as { key: string; label: string; defaultOn?: boolean; always?: boolean }).always ?? false}
                    onChange={v => set(item.key, v)}
                    disabled={(item as { key: string; label: string; defaultOn?: boolean; always?: boolean }).always}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up timing */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <h2 className="text-base font-bold text-[#1e293b] mb-1.5">Follow-up Reminder Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Default days before sending automated follow-ups</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Follow-up 1', val: fu1, set: setFu1 },
            { label: 'Follow-up 2', val: fu2, set: setFu2 },
            { label: 'Follow-up 3', val: fu3, set: setFu3 },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{f.label}</label>
              <div className="relative">
                <input type="number" min="1" max="60" value={f.val} onChange={e => f.set(e.target.value)} className={inp + ' pr-12'} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">days</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Best time to send emails</label>
            <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inp}>
              {['Asia/Dhaka', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Weekly report */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <h2 className="text-base font-bold text-[#1e293b] mb-4">Weekly Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Send on</label>
            <select value={reportDay} onChange={e => setReportDay(e.target.value)} className={inp}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-500 mb-2">Include in report:</p>
        <div className="space-y-2">
          {[
            { key: 'job_pipeline', label: 'Job pipeline summary' },
            { key: 'client_pipeline', label: 'Client pipeline summary' },
            { key: 'emails_sent', label: 'Emails sent' },
            { key: 'followups_sent', label: 'Follow-ups sent' },
            { key: 'ai_insights', label: 'AI insights' },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reportIncludes[item.key as keyof typeof reportIncludes]}
                onChange={e => setReportIncludes(p => ({ ...p, [item.key]: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-[#1e293b]">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
