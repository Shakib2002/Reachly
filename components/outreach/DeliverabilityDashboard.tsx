'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import {
  Activity, Mail, Eye, MousePointerClick,
  AlertTriangle, ShieldCheck, RefreshCw, Calendar,
} from 'lucide-react';

const supabase = createBrowserSupabaseClient();

interface DailyStats {
  date: string;
  sent_count: number;
  delivered_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  complaint_count: number;
}

interface HealthScore {
  score: number;
  label: string;
  color: string;
  tips: string[];
}

function computeHealth(stats: DailyStats[]): HealthScore {
  if (stats.length === 0) return { score: 100, label: 'No data', color: 'text-slate-400', tips: ['Send your first email to start tracking'] };

  const total = stats.reduce((a, s) => ({
    sent: a.sent + s.sent_count,
    delivered: a.delivered + s.delivered_count,
    bounced: a.bounced + s.bounce_count,
    complaints: a.complaints + s.complaint_count,
    opens: a.opens + s.open_count,
    clicks: a.clicks + s.click_count,
  }), { sent: 0, delivered: 0, bounced: 0, complaints: 0, opens: 0, clicks: 0 });

  let score = 100;
  const tips: string[] = [];

  // Bounce penalty
  const bounceRate = total.sent > 0 ? (total.bounced / total.sent) * 100 : 0;
  if (bounceRate > 5) { score -= 30; tips.push(`Bounce rate ${bounceRate.toFixed(1)}% is high — verify emails before sending`); }
  else if (bounceRate > 2) { score -= 15; tips.push(`Bounce rate ${bounceRate.toFixed(1)}% — consider email verification`); }

  // Complaint penalty
  const complaintRate = total.sent > 0 ? (total.complaints / total.sent) * 100 : 0;
  if (complaintRate > 0.5) { score -= 25; tips.push(`Spam complaint rate ${complaintRate.toFixed(2)}% — review your email content`); }
  else if (complaintRate > 0.1) { score -= 10; tips.push('Low spam complaints — good, but keep monitoring'); }

  // Open rate bonus/penalty
  const openRate = total.sent > 0 ? (total.opens / total.sent) * 100 : 0;
  if (openRate < 10) { score -= 15; tips.push(`Open rate ${openRate.toFixed(1)}% is low — improve subject lines`); }
  else if (openRate > 30) { tips.push(`Open rate ${openRate.toFixed(1)}% — excellent engagement!`); }

  // Click rate
  const clickRate = total.opens > 0 ? (total.clicks / total.opens) * 100 : 0;
  if (clickRate > 5) tips.push(`Click rate ${clickRate.toFixed(1)}% — strong CTA performance`);

  if (total.sent < 50) tips.push('Send more emails to get accurate deliverability data');

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) return { score, label: 'Excellent', color: 'text-emerald-500', tips };
  if (score >= 60) return { score, label: 'Good', color: 'text-blue-500', tips };
  if (score >= 40) return { score, label: 'Fair', color: 'text-amber-500', tips };
  return { score, label: 'Poor', color: 'text-red-500', tips };
}

export default function DeliverabilityDashboard() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 14 | 30>(7);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - range);

      const { data, error } = await supabase
        .from('deliverability_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setStats(data || []);
    } catch (e) {
      console.error('Deliverability fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const totals = stats.reduce((a, s) => ({
    sent: a.sent + (s.sent_count || 0),
    delivered: a.delivered + (s.delivered_count || 0),
    opened: a.opened + (s.open_count || 0),
    clicked: a.clicked + (s.click_count || 0),
    bounced: a.bounced + (s.bounce_count || 0),
    complaints: a.complaints + (s.complaint_count || 0),
  }), { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complaints: 0 });

  const health = computeHealth(stats);

  const metrics = [
    { label: 'Sent', value: totals.sent, icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Delivered', value: totals.delivered, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50',
      rate: totals.sent > 0 ? `${((totals.delivered / totals.sent) * 100).toFixed(1)}%` : '–' },
    { label: 'Opened', value: totals.opened, icon: Eye, color: 'text-violet-500', bg: 'bg-violet-50',
      rate: totals.sent > 0 ? `${((totals.opened / totals.sent) * 100).toFixed(1)}%` : '–' },
    { label: 'Clicked', value: totals.clicked, icon: MousePointerClick, color: 'text-blue-500', bg: 'bg-blue-50',
      rate: totals.opened > 0 ? `${((totals.clicked / totals.opened) * 100).toFixed(1)}%` : '–' },
    { label: 'Bounced', value: totals.bounced, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50',
      rate: totals.sent > 0 ? `${((totals.bounced / totals.sent) * 100).toFixed(1)}%` : '–' },
    { label: 'Complaints', value: totals.complaints, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50',
      rate: totals.sent > 0 ? `${((totals.complaints / totals.sent) * 100).toFixed(2)}%` : '–' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Email Deliverability
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Track bounce rates, complaints, and inbox placement</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setRange(d as 7 | 14 | 30)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                range === d ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'
              }`}>
              {d}d
            </button>
          ))}
          <button onClick={fetchStats} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={health.score >= 80 ? '#10b981' : health.score >= 60 ? '#3b82f6' : health.score >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={`${health.score * 2.64} 264`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${health.color}`}>{health.score}</span>
              <span className="text-[9px] font-semibold text-slate-400">{health.label}</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-[#1e293b] mb-2">Domain Health</h4>
            <ul className="space-y-1">
              {health.tips.map((tip, i) => (
                <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                  <span className="mt-0.5">{tip.includes('excellent') || tip.includes('good') || tip.includes('strong') ? '✅' : tip.includes('high') || tip.includes('poor') ? '⚠️' : '💡'}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                </div>
                <span className="text-[11px] font-semibold text-slate-400">{m.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold text-[#1e293b]">{m.value.toLocaleString()}</span>
                {'rate' in m && m.rate && (
                  <span className="text-[11px] font-semibold text-slate-400">{m.rate}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Breakdown */}
      {stats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-[#1e293b]">Daily Breakdown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-center">Sent</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-center">Delivered</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-center">Opens</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-center">Clicks</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-center">Bounces</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice().reverse().map(s => (
                  <tr key={s.date} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-2.5 text-[11px] font-semibold text-[#1e293b]">{new Date(s.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-600 text-center">{s.sent_count}</td>
                    <td className="px-3 py-2.5 text-[11px] text-emerald-600 text-center font-semibold">{s.delivered_count}</td>
                    <td className="px-3 py-2.5 text-[11px] text-violet-600 text-center">{s.open_count}</td>
                    <td className="px-3 py-2.5 text-[11px] text-indigo-600 text-center">{s.click_count}</td>
                    <td className="px-3 py-2.5 text-center">
                      {s.bounce_count > 0 ? (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-500 rounded text-[10px] font-bold">{s.bounce_count}</span>
                      ) : (
                        <span className="text-[11px] text-slate-300">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
