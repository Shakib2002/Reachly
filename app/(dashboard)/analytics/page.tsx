'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import {
  BarChart3, TrendingUp, Mail, Target, Calendar, Trophy,
  MessageSquare, ArrowUpRight, ArrowDownRight, Download, Lightbulb,
  RefreshCw, Loader2, ExternalLink,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const supabase = createClient();
interface R { id: string; status: string; source: string | null; created_at: string; title?: string; company?: string | null; location?: string | null; email?: string | null; }
interface E { id: string; status: string; sent_at: string; }
interface A { id: string; action: string; description: string | null; created_at: string; }
const SC: Record<string,string> = { new:'#3b82f6', applied:'#f59e0b', interview:'#8b5cf6', offer:'#10b981', closed:'#6b7280' };
const PC = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#6b7280'];

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<R[]>([]);
  const [emails, setEmails] = useState<E[]>([]);
  const [acts, setActs] = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7'|'30'|'90'>('30');
  const [insights, setInsights] = useState<string[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [tablePage, setTablePage] = useState(0);

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - parseInt(range));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [lr, er, ar] = await Promise.all([
      supabase.from('leads').select('id,status,source,created_at,title,company,location,email').order('created_at',{ascending:true}),
      supabase.from('emails_sent').select('id,status,sent_at').gte('sent_at', cutoff.toISOString()),
      supabase.from('activities').select('id,action,description,created_at').order('created_at',{ascending:false}).limit(200),
    ]);
    setLeads((lr.data||[]) as R[]); setEmails((er.data||[]) as E[]); setActs((ar.data||[]) as A[]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Metrics
  const total = leads.length;
  const byStatus = (s:string) => leads.filter(l=>l.status===s).length;
  const newC=byStatus('new'), appC=byStatus('applied'), intC=byStatus('interview'), offC=byStatus('offer'), clsC=byStatus('closed');
  const recentLeads = leads.filter(l=>new Date(l.created_at)>cutoff).length;
  const conv = total>0?Math.round((offC/total)*100):0;

  const metrics: {t:string;v:string|number;c:string;tr:string;icon:typeof TrendingUp;cl:string;bg:string}[] = [
    {t:'Total Leads',v:total,c:`+${recentLeads} new`,tr:'up',icon:TrendingUp,cl:'text-blue-600',bg:'bg-blue-50'},
    {t:'Emails Sent',v:emails.length,c:`${range}d`,tr:'up',icon:Mail,cl:'text-violet-600',bg:'bg-violet-50'},
    {t:'Response Rate',v:`${emails.length>0?Math.round((emails.filter(e=>e.status==='opened').length/emails.length)*100):0}%`,c:'avg',tr:'up',icon:MessageSquare,cl:'text-emerald-600',bg:'bg-emerald-50'},
    {t:'Interviews',v:intC,c:`${total>0?Math.round((intC/total)*100):0}%`,tr:intC>0?'up':'neutral',icon:Calendar,cl:'text-amber-600',bg:'bg-amber-50'},
    {t:'Offers',v:offC,c:`${conv}% rate`,tr:offC>0?'up':'neutral',icon:Trophy,cl:'text-orange-600',bg:'bg-orange-50'},
    {t:'Conversion',v:`${conv}%`,c:`${offC}/${total}`,tr:conv>0?'up':'neutral',icon:Target,cl:'text-red-600',bg:'bg-red-50'},
  ];

  // Funnel
  const funnel = [{n:'New',v:newC,f:SC.new},{n:'Applied',v:appC,f:SC.applied},{n:'Interview',v:intC,f:SC.interview},{n:'Offer',v:offC,f:SC.offer},{n:'Closed',v:clsC,f:SC.closed}];

  // Leads over time
  const lot = (()=>{const d=parseInt(range),b:Record<string,{leads:number,emails:number}>={};for(let i=d-1;i>=0;i--){const dt=new Date();dt.setDate(dt.getDate()-i);b[dt.toISOString().slice(0,10)]={leads:0,emails:0}}leads.forEach(l=>{const k=l.created_at.slice(0,10);if(k in b)b[k].leads++});emails.forEach(e=>{const k=e.sent_at.slice(0,10);if(k in b)b[k].emails++});return Object.entries(b).map(([d,v])=>({date:new Date(d).toLocaleDateString('en',{month:'short',day:'numeric'}),...v}))})();

  // Source pie
  const srcData=(()=>{const c:Record<string,number>={};leads.forEach(l=>{const s=l.source||'Other';c[s]=(c[s]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({name:n,value:v}))})();

  // Heatmap (last 12 weeks)
  const heatmap=(()=>{const g:number[][]=[];for(let w=0;w<12;w++){const row:number[]=[];for(let d=0;d<7;d++){const dt=new Date();dt.setDate(dt.getDate()-(11-w)*7-d);const key=dt.toISOString().slice(0,10);const count=acts.filter(a=>a.created_at.slice(0,10)===key).length;row.push(count)}g.push(row)}return g})();
  const maxAct=Math.max(1,...heatmap.flat());

  // Insights
  const fetchInsights = async () => {
    setInsightLoading(true);
    try {
      const byStatusObj:Record<string,number>={new:newC,applied:appC,interview:intC,offer:offC,closed:clsC};
      const bySource:Record<string,number>={};leads.forEach(l=>{const s=l.source||'Other';bySource[s]=(bySource[s]||0)+1});
      const res=await fetch('/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({summary:{totalLeads:total,emailsSent:emails.length,byStatus:byStatusObj,bySource}})});
      const data=await res.json();
      setInsights(data.insights||[]);
    } catch { setInsights(['Unable to generate insights right now.']); }
    finally { setInsightLoading(false); }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['Title','Company','Location','Status','Source','Email','Created'];
    const rows = leads.map(l=>[l.title||'',l.company||'',l.location||'',l.status,l.source||'',l.email||'',new Date(l.created_at).toLocaleDateString()]);
    const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`reachly-report-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Table
  const perPage=10;
  const sortedLeads=[...leads].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
  const pageLeads=sortedLeads.slice(tablePage*perPage,(tablePage+1)*perPage);
  const totalPages=Math.ceil(total/perPage);

  const tip={contentStyle:{borderRadius:12,border:'1px solid #e2e8f0',fontSize:12,boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}};

  if(loading) return (
    <div className="space-y-5 max-w-[1200px]"><div className="h-8 bg-slate-200 rounded w-40 animate-pulse"/>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({length:6}).map((_,i)=><div key={i} className="bg-white rounded-2xl border p-5 animate-pulse h-28"/>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="bg-white rounded-2xl border p-5 animate-pulse h-72"/>)}</div></div>
  );

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] flex items-center gap-2.5"><BarChart3 className="w-6 h-6 text-blue-500"/> Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Track your job search and outreach performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {(['7','30','90'] as const).map(r=>(
              <button key={r} onClick={()=>setRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range===r?'bg-blue-50 text-blue-600':'text-slate-500 hover:bg-slate-50'}`}>
                {r==='7'?'7D':r==='30'?'30D':'90D'}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5"/> Export CSV
          </button>
        </div>
      </div>

      {/* 6 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map(m=>(
          <div key={m.t} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 ${m.bg} rounded-xl flex items-center justify-center`}><m.icon className={`w-4 h-4 ${m.cl}`}/></div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${m.tr==='up'?'text-emerald-600 bg-emerald-50':m.tr==='down'?'text-red-600 bg-red-50':'text-slate-400 bg-slate-50'}`}>
                {m.tr==='up'?<ArrowUpRight className="w-2.5 h-2.5"/>:m.tr==='down'?<ArrowDownRight className="w-2.5 h-2.5"/>:null}{m.c}
              </span>
            </div>
            <p className="text-xl font-bold text-[#1e293b]">{m.v}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{m.t}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads + Emails Over Time */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-sm font-bold text-[#1e293b]">Leads & Emails Over Time</h3>
          <p className="text-[11px] text-slate-400 mb-3">Last {range} days</p>
          {lot.some(d=>d.leads>0||d.emails>0)?(
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={lot}>
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} tickLine={false} axisLine={false} interval={Math.max(0,Math.floor(lot.length/7)-1)}/>
                <YAxis tick={{fontSize:10,fill:'#94a3b8'}} tickLine={false} axisLine={false} allowDecimals={false}/>
                <Tooltip {...tip}/>
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} fill="url(#lg1)" name="Leads"/>
                <Area type="monotone" dataKey="emails" stroke="#8b5cf6" strokeWidth={2} fill="url(#lg2)" name="Emails"/>
              </AreaChart>
            </ResponsiveContainer>
          ):<div className="h-[240px] flex items-center justify-center text-sm text-slate-400">No data yet</div>}
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-sm font-bold text-[#1e293b]">Pipeline Funnel</h3>
          <p className="text-[11px] text-slate-400 mb-3">Status breakdown</p>
          {total>0?(
            <div className="space-y-2.5 mt-2">
              {funnel.map((f,i)=>{const pct=total>0?Math.round((f.v/total)*100):0;const prev=i>0?funnel[i-1].v:total;const cvt=prev>0?Math.round((f.v/prev)*100):0;return(
                <div key={f.n}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background:f.f}}/><span className="text-xs font-semibold text-[#1e293b]">{f.n}</span></div>
                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-[#1e293b]">{f.v}</span>{i>0&&<span className="text-[10px] text-slate-400">{cvt}%</span>}</div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:f.f}}/></div>
                </div>
              )})}
            </div>
          ):<div className="h-[200px] flex items-center justify-center text-sm text-slate-400">Add leads to see funnel</div>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sources Pie */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-sm font-bold text-[#1e293b]">Lead Sources</h3>
          <p className="text-[11px] text-slate-400 mb-3">Where your leads come from</p>
          {srcData.length>0?(
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart><Pie data={srcData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {srcData.map((_,i)=><Cell key={i} fill={PC[i%PC.length]}/>)}
                </Pie><Tooltip {...tip}/></PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {srcData.map((s,i)=><div key={s.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background:PC[i%PC.length]}}/><span className="text-xs text-slate-600">{s.name}</span></div><span className="text-xs font-bold text-[#1e293b]">{s.value}</span></div>)}
              </div>
            </div>
          ):<div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No source data</div>}
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-sm font-bold text-[#1e293b]">Activity Heatmap</h3>
          <p className="text-[11px] text-slate-400 mb-3">Last 12 weeks</p>
          <div className="flex gap-1 items-start">
            <div className="flex flex-col gap-1 mr-1 mt-0.5">{['M','T','W','T','F','S','S'].map((d,i)=><span key={i} className="text-[9px] text-slate-400 h-[14px] flex items-center">{d}</span>)}</div>
            <div className="flex gap-1">{heatmap.map((week,wi)=>(
              <div key={wi} className="flex flex-col gap-1">{week.map((c,di)=>{const opacity=c===0?0.06:Math.max(0.15,c/maxAct);return(
                <div key={di} className="w-[14px] h-[14px] rounded-sm cursor-pointer hover:ring-1 hover:ring-blue-400 transition-all" title={`${c} actions`}
                  style={{background:`rgba(59,130,246,${opacity})`}}/>
              )})}</div>
            ))}</div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[9px] text-slate-400">Less</span>
            {[0.06,0.2,0.4,0.7,1].map((o,i)=><div key={i} className="w-[10px] h-[10px] rounded-sm" style={{background:`rgba(59,130,246,${o})`}}/>)}
            <span className="text-[9px] text-slate-400">More</span>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500"/> AI Insights</h3>
          <button onClick={fetchInsights} disabled={insightLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
            {insightLoading?<Loader2 className="w-3 h-3 animate-spin"/>:<RefreshCw className="w-3 h-3"/>} {insights.length>0?'Refresh':'Generate'}
          </button>
        </div>
        {insights.length>0?(
          <div className="space-y-2">{insights.map((ins,i)=>(
            <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white/70 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</span>
              <p className="text-xs text-slate-600 leading-relaxed">{ins}</p>
            </div>
          ))}</div>
        ):<p className="text-xs text-slate-400">Click &quot;Generate&quot; to get AI-powered insights based on your data.</p>}
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1e293b]">Lead Performance</h3>
          <span className="text-[11px] text-slate-400">{total} total leads</span>
        </div>
        {total>0?(
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-slate-50/50 border-b border-slate-100">
                  {['Company','Position','Status','Days','Source','Email','Actions'].map(h=><th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody>{pageLeads.map(l=>{const days=Math.floor((Date.now()-new Date(l.created_at).getTime())/86400000);return(
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-semibold text-[#1e293b]">{l.company||'—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{l.title||'—'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{background:`${SC[l.status]}15`,color:SC[l.status]}}>{l.status}</span></td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{days}d</td>
                    <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-500">{l.source||'—'}</span></td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-400 font-mono truncate max-w-[140px]">{l.email||'—'}</td>
                    <td className="px-4 py-2.5"><a href="/crm" className="text-blue-500 hover:text-blue-600"><ExternalLink className="w-3.5 h-3.5"/></a></td>
                  </tr>
                )})}</tbody>
              </table>
            </div>
            {totalPages>1&&(
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Page {tablePage+1} of {totalPages}</span>
                <div className="flex gap-1.5">
                  <button onClick={()=>setTablePage(p=>Math.max(0,p-1))} disabled={tablePage===0} className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-30">Prev</button>
                  <button onClick={()=>setTablePage(p=>Math.min(totalPages-1,p+1))} disabled={tablePage>=totalPages-1} className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </>
        ):<div className="p-12 text-center text-sm text-slate-400">No leads yet — add leads from the Discover page</div>}
      </div>
    </div>
  );
}
