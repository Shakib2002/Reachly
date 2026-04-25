'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import {
  BarChart3, TrendingUp, Users, Mail, Briefcase, ArrowUpRight,
  ArrowDownRight, Calendar, Target, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const supabase = createClient();

interface LeadRow { id: string; status: string; source: string | null; created_at: string; }
interface EmailRow { id: string; status: string; sent_at: string; }
interface ActivityRow { id: string; action: string; created_at: string; }

const STATUS_COLORS: Record<string, string> = { new: '#3b82f6', applied: '#f59e0b', interview: '#8b5cf6', offer: '#10b981', closed: '#6b7280' };
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#6b7280', '#ec4899'];

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7' | '30' | '90'>('30');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const daysAgo = new Date(); daysAgo.setDate(daysAgo.getDate() - parseInt(range));
    const [leadsRes, emailsRes, activitiesRes] = await Promise.all([
      supabase.from('leads').select('id,status,source,created_at').order('created_at', { ascending: true }),
      supabase.from('emails_sent').select('id,status,sent_at').gte('sent_at', daysAgo.toISOString()),
      supabase.from('activities').select('id,action,created_at').gte('created_at', daysAgo.toISOString()).order('created_at', { ascending: false }).limit(20),
    ]);
    setLeads((leadsRes.data || []) as LeadRow[]);
    setEmails((emailsRes.data || []) as EmailRow[]);
    setActivities((activitiesRes.data || []) as ActivityRow[]);
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Metrics
  const totalLeads = leads.length;
  const applied = leads.filter(l => l.status === 'applied').length;
  const interviews = leads.filter(l => l.status === 'interview').length;
  const offers = leads.filter(l => l.status === 'offer').length;
  const totalEmails = emails.length;
  const conversionRate = totalLeads > 0 ? Math.round((offers / totalLeads) * 100) : 0;

  const daysAgoDate = new Date(); daysAgoDate.setDate(daysAgoDate.getDate() - parseInt(range));
  const recentLeads = leads.filter(l => new Date(l.created_at) > daysAgoDate).length;
  const prevPeriodDate = new Date(daysAgoDate); prevPeriodDate.setDate(prevPeriodDate.getDate() - parseInt(range));
  const prevLeads = leads.filter(l => { const d = new Date(l.created_at); return d > prevPeriodDate && d <= daysAgoDate; }).length;
  const leadChange = prevLeads > 0 ? Math.round(((recentLeads - prevLeads) / prevLeads) * 100) : recentLeads > 0 ? 100 : 0;

  const metrics = [
    { title: 'Total Leads', value: String(totalLeads), change: `${leadChange >= 0 ? '+' : ''}${leadChange}%`, trend: leadChange >= 0 ? 'up' : 'down', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Applied', value: String(applied), change: `${totalLeads > 0 ? Math.round((applied/totalLeads)*100) : 0}%`, trend: 'up', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Emails Sent', value: String(totalEmails), change: `${range}d`, trend: 'up', icon: Mail, color: 'text-violet-600', bg: 'bg-violet-50' },
    { title: 'Conversion', value: `${conversionRate}%`, change: `${offers} offers`, trend: conversionRate > 0 ? 'up' : 'neutral', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Pipeline Funnel data
  const funnelData = [
    { name: 'New', value: leads.filter(l => l.status === 'new').length, fill: STATUS_COLORS.new },
    { name: 'Applied', value: applied, fill: STATUS_COLORS.applied },
    { name: 'Interview', value: interviews, fill: STATUS_COLORS.interview },
    { name: 'Offer', value: offers, fill: STATUS_COLORS.offer },
    { name: 'Closed', value: leads.filter(l => l.status === 'closed').length, fill: STATUS_COLORS.closed },
  ];

  // Leads over time (grouped by day)
  const leadsOverTime = (() => {
    const days = parseInt(range);
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    leads.forEach(l => { const key = l.created_at.slice(0, 10); if (key in buckets) buckets[key]++; });
    return Object.entries(buckets).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      leads: count,
    }));
  })();

  // Source breakdown
  const sourceData = (() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { const s = l.source || 'Other'; counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  })();

  const rangeLabels = { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days' };

  if (loading) return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="h-8 bg-slate-200 rounded w-40 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({length:4}).map((_,i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({length:2}).map((_,i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-72" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] flex items-center gap-2.5"><BarChart3 className="w-6 h-6 text-blue-500" /> Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Track performance and optimize your pipeline</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
          {(['7','30','90'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === r ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              {r === '7' ? '7D' : r === '30' ? '30D' : '90D'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.title} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center`}><m.icon className={`w-5 h-5 ${m.color}`} /></div>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-0.5 ${m.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : m.trend === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50'}`}>
                {m.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : m.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                {m.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1e293b]">{m.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{m.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads Over Time */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-1">Leads Over Time</h3>
          <p className="text-xs text-slate-400 mb-4">{rangeLabels[range]}</p>
          {leadsOverTime.some(d => d.leads > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={leadsOverTime}>
                <defs><linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(leadsOverTime.length / 7) - 1)} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} fill="url(#leadGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">No lead data yet — start adding leads!</div>
          )}
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-1">Pipeline Funnel</h3>
          <p className="text-xs text-slate-400 mb-4">Lead status breakdown</p>
          {totalLeads > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={funnelData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {funnelData.filter(f => f.value > 0).map(f => (
                  <span key={f.name} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: f.fill }} /> {f.name} ({f.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">Add leads to see funnel</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Breakdown */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-1">Lead Sources</h3>
          <p className="text-xs text-slate-400 mb-4">Where your leads come from</p>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-slate-400">No source data yet</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-1">Recent Activity</h3>
          <p className="text-xs text-slate-400 mb-4">Latest actions in your pipeline</p>
          {activities.length > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {activities.map(a => {
                const actionIcons: Record<string, typeof Zap> = { lead_added: Users, status_changed: TrendingUp, email_sent: Mail, note_added: Calendar };
                const Icon = actionIcons[a.action] || Zap;
                const actionColors: Record<string, string> = { lead_added: 'bg-blue-50 text-blue-500', status_changed: 'bg-violet-50 text-violet-500', email_sent: 'bg-emerald-50 text-emerald-500' };
                const color = actionColors[a.action] || 'bg-slate-50 text-slate-500';
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}><Icon className="w-4 h-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1e293b] capitalize">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-slate-400">{new Date(a.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-slate-400">Activity will appear as you use the platform</div>
          )}
        </div>
      </div>

      {/* Conversion Stats */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
        <h3 className="text-base font-semibold text-[#1e293b] mb-4">Pipeline Conversion Rates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'New → Applied', from: leads.filter(l=>l.status!=='new').length, total: totalLeads, color: '#f59e0b' },
            { label: 'Applied → Interview', from: interviews + offers, total: applied || 1, color: '#8b5cf6' },
            { label: 'Interview → Offer', from: offers, total: interviews || 1, color: '#10b981' },
            { label: 'Overall', from: offers, total: totalLeads || 1, color: '#3b82f6' },
          ].map(c => {
            const pct = Math.round((c.from / c.total) * 100);
            return (
              <div key={c.label} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={c.color} strokeWidth="3"
                      strokeDasharray={`${Math.min(pct, 100)}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#1e293b]">{pct}%</span>
                </div>
                <p className="text-xs font-semibold text-slate-500">{c.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
