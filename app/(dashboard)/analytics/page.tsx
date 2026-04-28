'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, Mail, RefreshCw, Calendar, Trophy, Target, Building2, DollarSign, Download, ArrowUpRight, ArrowDownRight, Briefcase, Loader2, Lightbulb } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAnalytics, type AnalyticsMode, type AnalyticsPeriod } from '@/hooks/useAnalytics';

const TIP = { contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } };

const JOB_STATUS_COLORS: Record<string, string> = { new: '#3b82f6', applied: '#f59e0b', interview: '#8b5cf6', offer: '#10b981', closed: '#6b7280' };
const CLIENT_STATUS_COLORS: Record<string, string> = { lead: '#3b82f6', contacted: '#f59e0b', proposal: '#8b5cf6', negotiation: '#f97316', won: '#10b981', lost: '#ef4444' };

function StatCard({ title, value, change, trend, icon: Icon, iconBg, iconColor }: {
  title: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${trend === 'up' ? 'text-emerald-600 bg-emerald-50' : trend === 'down' ? 'text-red-500 bg-red-50' : 'text-slate-400 bg-slate-50'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : trend === 'down' ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-[#1e293b]">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{title}</p>
    </div>
  );
}

function FunnelChart({ stages }: { stages: { label: string; count: number; color: string }[] }) {
  const max = Math.max(1, ...stages.map(s => s.count));
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const pct = Math.round((s.count / max) * 100);
        const prev = i > 0 ? stages[i - 1].count : s.count;
        const cvt = prev > 0 ? Math.round((s.count / prev) * 100) : 100;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-xs font-semibold text-[#1e293b]">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1e293b]">{s.count}</span>
                {i > 0 && <span className="text-[10px] text-slate-400">{cvt}%</span>}
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="space-y-5 max-w-[1200px] animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border h-72" />)}
      </div>
    </div>
  );
}

const PALETTE = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#6b7280'];

function InlineDonut({ data, title, subtitle }: { data: { name: string; value: number }[]; title: string; subtitle: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
      <h3 className="text-sm font-bold text-[#1e293b]">{title}</h3>
      <p className="text-[11px] text-slate-400 mb-3">{subtitle}</p>
      {data.length > 0 ? (
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value" animationDuration={1000}>
                  {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="white" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold text-[#1e293b]">{total}</span>
              <span className="text-[9px] text-slate-400">Total</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="text-[11px] text-slate-600 truncate">{d.name}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  <span className="text-xs font-bold text-[#1e293b]">{d.value}</span>
                  <span className="text-[10px] text-slate-400">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[150px] flex items-center justify-center text-sm text-slate-400">No source data yet</div>
      )}
    </div>
  );
}

function InlineHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < 12; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) { week.push(data[w * 7 + d] || { date: '', count: 0 }); }
    weeks.push(week);
  }
  const maxCount = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
      <h3 className="text-sm font-bold text-[#1e293b]">Activity Heatmap</h3>
      <p className="text-[11px] text-slate-400 mb-4">Last 12 weeks</p>
      <div className="flex gap-1 items-start overflow-x-auto pb-1">
        <div className="flex flex-col gap-1 mr-1 mt-0.5 flex-shrink-0">
          {['M','T','W','T','F','S','S'].map((d, i) => <span key={i} className="text-[9px] text-slate-400 h-[14px] flex items-center">{d}</span>)}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => {
                const opacity = cell.count === 0 ? 0.06 : Math.max(0.15, cell.count / maxCount);
                return (
                  <div key={di} className="w-[14px] h-[14px] rounded-sm cursor-pointer hover:ring-1 hover:ring-blue-400 transition-all flex-shrink-0"
                    title={cell.date ? `${cell.count} activities on ${cell.date}` : 'No data'}
                    style={{ background: `rgba(59,130,246,${opacity})` }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-slate-400">Less</span>
        {[0.06, 0.2, 0.4, 0.7, 1].map((o, i) => <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ background: `rgba(59,130,246,${o})` }} />)}
        <span className="text-[9px] text-slate-400">More</span>
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function InlineInsights({ insights, loading, mode, lastGenerated, onRefresh }: {
  insights: string[]; loading: boolean; mode: string; lastGenerated: Date | null; onRefresh: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-[#eff6ff] to-[#eef2ff] rounded-2xl border border-blue-100 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> AI-Powered Insights
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Powered by AI {lastGenerated && `· ${timeAgo(lastGenerated)}`}
          </p>
        </div>
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 shadow-sm flex-shrink-0">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {insights.length > 0 ? 'Refresh' : 'Generate'} Insights
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-start gap-2.5 p-3 bg-white/60 rounded-xl animate-pulse">
              <div className="w-5 h-5 bg-blue-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5"><div className="h-3 bg-slate-200 rounded w-full" /><div className="h-3 bg-slate-100 rounded w-3/4" /></div>
            </div>
          ))}
        </div>
      ) : insights.length > 0 ? (
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 bg-white rounded-xl border-l-[3px] border-blue-400 shadow-sm">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-xs text-slate-600 leading-relaxed">{ins}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Lightbulb className="w-8 h-8 text-blue-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Click &ldquo;Generate Insights&rdquo; to get AI-powered recommendations based on your {mode} data.</p>
        </div>
      )}
    </div>
  );
}


export default function AnalyticsPage() {
  const { data, loading, insights, insightLoading, getAnalyticsData, getInsights, exportToCSV } = useAnalytics();
  const [mode, setMode] = useState<AnalyticsMode>('job');
  const [period, setPeriod] = useState<AnalyticsPeriod>('30');
  const [lastInsightGen, setLastInsightGen] = useState<Date | null>(null);

  useEffect(() => { getAnalyticsData(period, mode); }, [period, mode, getAnalyticsData]);

  const handleInsights = useCallback(async () => {
    await getInsights(mode, data);
    setLastInsightGen(new Date());
  }, [mode, data, getInsights]);

  const j = data?.job ?? null;
  const c = data?.client ?? null;

  // Job funnel
  const jobFunnel = j ? [
    { label: 'New', count: j.byStatus.find(s => s.status === 'new')?.count || 0, color: JOB_STATUS_COLORS.new },
    { label: 'Applied', count: j.byStatus.find(s => s.status === 'applied')?.count || 0, color: JOB_STATUS_COLORS.applied },
    { label: 'Interview', count: j.byStatus.find(s => s.status === 'interview')?.count || 0, color: JOB_STATUS_COLORS.interview },
    { label: 'Offer', count: j.byStatus.find(s => s.status === 'offer')?.count || 0, color: JOB_STATUS_COLORS.offer },
    { label: 'Closed', count: j.byStatus.find(s => s.status === 'closed')?.count || 0, color: JOB_STATUS_COLORS.closed },
  ] : [];

  // Client funnel
  const clientFunnel = c ? [
    { label: 'Lead', count: c.byStatus.find(s => s.status === 'lead')?.count || 0, color: CLIENT_STATUS_COLORS.lead },
    { label: 'Contacted', count: c.byStatus.find(s => s.status === 'contacted')?.count || 0, color: CLIENT_STATUS_COLORS.contacted },
    { label: 'Proposal', count: c.byStatus.find(s => s.status === 'proposal')?.count || 0, color: CLIENT_STATUS_COLORS.proposal },
    { label: 'Negotiation', count: c.byStatus.find(s => s.status === 'negotiation')?.count || 0, color: CLIENT_STATUS_COLORS.negotiation },
    { label: 'Won', count: c.byStatus.find(s => s.status === 'won')?.count || 0, color: CLIENT_STATUS_COLORS.won },
    { label: 'Lost', count: c.byStatus.find(s => s.status === 'lost')?.count || 0, color: CLIENT_STATUS_COLORS.lost },
  ] : [];

  const pctTrend = (v: number): 'up' | 'down' | 'neutral' => v > 0 ? 'up' : v < 0 ? 'down' : 'neutral';

  if (loading && !j && !c) return <SkeletonPage />;

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-500" /> Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your performance across jobs and clients</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode toggle */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
            {([['job', 'Job', Briefcase], ['client', 'Client', Building2], ['combined', 'Combined', BarChart3]] as const).map(([m, label, Icon]) => (
              <button key={m} onClick={() => setMode(m as AnalyticsMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === m ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
          {/* Period picker */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {([['7', '7D'], ['30', '30D'], ['90', '90D'], ['365', '1Y']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setPeriod(v as AnalyticsPeriod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === v ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => exportToCSV(mode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── JOB MODE ── */}
      {(mode === 'job' || mode === 'combined') && j && (
        <div className={mode === 'combined' ? 'space-y-4 border-b border-slate-200 pb-6' : 'space-y-4'}>
          {mode === 'combined' && (
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-[#1e293b]">Job Pipeline</span>
            </div>
          )}
          {/* Job Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard title="Total Leads" value={j.totalLeads} change={`${j.totalLeadsPct > 0 ? '+' : ''}${j.totalLeadsPct}%`} trend={pctTrend(j.totalLeadsPct)} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <StatCard title="Emails Sent" value={j.emailsSent} change={`${j.emailsSentPct > 0 ? '+' : ''}${j.emailsSentPct}%`} trend={pctTrend(j.emailsSentPct)} icon={Mail} iconBg="bg-violet-50" iconColor="text-violet-600" />
            <StatCard title="Follow-ups Sent" value={j.followUpsSent} change={`${j.followUpsPct > 0 ? '+' : ''}${j.followUpsPct}%`} trend={pctTrend(j.followUpsPct)} icon={RefreshCw} iconBg="bg-amber-50" iconColor="text-amber-600" />
            <StatCard title="Interviews" value={j.interviews} change={j.totalLeads > 0 ? `${Math.round((j.interviews / j.totalLeads) * 100)}% rate` : '0%'} trend={j.interviews > 0 ? 'up' : 'neutral'} icon={Calendar} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <StatCard title="Offers" value={j.offers} change={j.totalLeads > 0 ? `${Math.round((j.offers / j.totalLeads) * 100)}% rate` : '0%'} trend={j.offers > 0 ? 'up' : 'neutral'} icon={Trophy} iconBg="bg-orange-50" iconColor="text-orange-600" />
            <StatCard title="Conversion" value={`${j.conversionRate}%`} change={`${j.offers}/${j.totalLeads}`} trend={j.conversionRate > 0 ? 'up' : 'neutral'} icon={Target} iconBg="bg-red-50" iconColor="text-red-600" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
              <h3 className="text-sm font-bold text-[#1e293b]">Leads & Emails Over Time</h3>
              <p className="text-[11px] text-slate-400 mb-4">Last {period} days</p>
              {j.leadsOverTime.some(d => d.leads > 0 || d.emails > 0) ? (
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={j.leadsOverTime}>
                    <defs>
                      <linearGradient id="jLg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                      <linearGradient id="jLg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(j.leadsOverTime.length / 6) - 1)} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...TIP} />
                    <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} fill="url(#jLg1)" name="Leads" animationDuration={1000} />
                    <Area type="monotone" dataKey="emails" stroke="#8b5cf6" strokeWidth={2} fill="url(#jLg2)" name="Emails" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-[230px] flex items-center justify-center text-sm text-slate-400">No data for this period</div>}
            </div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
              <h3 className="text-sm font-bold text-[#1e293b]">Pipeline Funnel</h3>
              <p className="text-[11px] text-slate-400 mb-4">Conversion by stage</p>
              {j.totalLeads > 0 ? <FunnelChart stages={jobFunnel} /> : <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">Add leads to see funnel</div>}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead Sources Donut */}
            <InlineDonut data={j.bySource.map(s => ({ name: s.source, value: s.count }))} title="Lead Sources" subtitle="Where your leads come from" />
            {/* Activity Heatmap */}
            <InlineHeatmap data={j.heatmap} />
          </div>
        </div>
      )}

      {/* ── CLIENT MODE ── */}
      {(mode === 'client' || mode === 'combined') && c && (
        <div className="space-y-4">
          {mode === 'combined' && (
            <div className="flex items-center gap-2 mt-2 mb-1">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-[#1e293b]">Client Pipeline</span>
            </div>
          )}
          {/* Client Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard title="Total Clients" value={c.totalClients} change={`${c.totalClientsPct > 0 ? '+' : ''}${c.totalClientsPct}%`} trend={pctTrend(c.totalClientsPct)} icon={Building2} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <StatCard title="Proposals Sent" value={c.proposalsSent} change="stage" trend="neutral" icon={Mail} iconBg="bg-violet-50" iconColor="text-violet-600" />
            <StatCard title="Negotiations" value={c.activeNegotiations} change="active" trend={c.activeNegotiations > 0 ? 'up' : 'neutral'} icon={RefreshCw} iconBg="bg-amber-50" iconColor="text-amber-600" />
            <StatCard title="Projects Won" value={c.projectsWon} change={`${c.winRate}% rate`} trend={c.projectsWon > 0 ? 'up' : 'neutral'} icon={Trophy} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <StatCard title="Pipeline Value" value={c.pipelineValue > 0 ? `$${c.pipelineValue.toLocaleString()}` : '$0'} change="estimated" trend={c.pipelineValue > 0 ? 'up' : 'neutral'} icon={DollarSign} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
            <StatCard title="Win Rate" value={`${c.winRate}%`} change={`${c.projectsWon}/${c.projectsWon + c.projectsLost}`} trend={c.winRate >= 30 ? 'up' : c.winRate > 0 ? 'neutral' : 'down'} icon={Target} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          </div>

          {/* Client Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
              <h3 className="text-sm font-bold text-[#1e293b]">Won vs Lost Over Time</h3>
              <p className="text-[11px] text-slate-400 mb-4">Project outcomes over last {period} days</p>
              {c.wonVsLostOverTime.some(d => d.won > 0 || d.lost > 0) ? (
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={c.wonVsLostOverTime}>
                    <defs>
                      <linearGradient id="wonGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                      <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(c.wonVsLostOverTime.length / 6) - 1)} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...TIP} />
                    <Area type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2} fill="url(#wonGrad)" name="Won" animationDuration={1000} />
                    <Area type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} fill="url(#lostGrad)" name="Lost" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-[230px] flex items-center justify-center text-sm text-slate-400">No won/lost data yet</div>}
            </div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
              <h3 className="text-sm font-bold text-[#1e293b]">Client Pipeline Funnel</h3>
              <p className="text-[11px] text-slate-400 mb-4">Conversion by stage</p>
              {c.totalClients > 0 ? <FunnelChart stages={clientFunnel} /> : <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">Add clients to see funnel</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InlineDonut data={c.bySource.map(s => ({ name: s.source, value: s.count }))} title="Client Sources" subtitle="Where your clients come from" />
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
              <h3 className="text-sm font-bold text-[#1e293b]">Project Types</h3>
              <p className="text-[11px] text-slate-400 mb-4">Most common project categories</p>
              {c.byProjectType.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...c.byProjectType].sort((a, b) => b.count - a.count).slice(0, 6).map(t => ({ name: t.type, count: t.count }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip {...TIP} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Projects" animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">No project type data yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── COMBINED: side-by-side summary ── */}
      {mode === 'combined' && j && c && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" />Job Summary</h3>
            <div className="space-y-2">
              {[['Total Leads', j.totalLeads], ['Emails Sent', j.emailsSent], ['Interviews', j.interviews], ['Offers', j.offers], [`Conversion`, `${j.conversionRate}%`]].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-xs"><span className="text-blue-600">{label}</span><span className="font-bold text-[#1e293b]">{val}</span></div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5">
            <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" />Client Summary</h3>
            <div className="space-y-2">
              {[['Total Clients', c.totalClients], ['Proposals Sent', c.proposalsSent], ['Negotiations', c.activeNegotiations], ['Projects Won', c.projectsWon], ['Win Rate', `${c.winRate}%`]].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-xs"><span className="text-emerald-600">{label}</span><span className="font-bold text-[#1e293b]">{val}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <InlineInsights insights={insights} loading={insightLoading} mode={mode} lastGenerated={lastInsightGen} onRefresh={handleInsights} />

      {/* Empty state */}
      {!loading && !j && !c && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-16 text-center">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No analytics data yet</p>
          <p className="text-xs text-slate-400 mt-1">Add leads or clients to start tracking your performance</p>
        </div>
      )}
    </div>
  );
}
