import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


function buildDateSeries(days: number): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  return map;
}

function parseBudget(range: string | null): number {
  if (!range) return 0;
  const nums = range.match(/[\d,]+/g);
  if (!nums || nums.length === 0) return 0;
  const values = nums.map(n => parseInt(n.replace(/,/g, '')));
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const period = parseInt(sp.get('period') || '30');
    const mode = sp.get('mode') || 'combined';

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    const prevCutoff = new Date();
    prevCutoff.setDate(prevCutoff.getDate() - period * 2);

    const uid = user.id;

    // ─── Job Data ──────────────────────────────────────────────
    const jobResult = (mode === 'job' || mode === 'combined') ? await (async () => {
      const [leadsRes, emailsRes, fuRes, activitiesRes] = await Promise.all([
        supabase.from('leads').select('id,status,source,created_at').eq('user_id', uid),
        supabase.from('emails_sent').select('id,status,sent_at').eq('user_id', uid),
        supabase.from('follow_ups').select('id,status,scheduled_date,sent_at').eq('user_id', uid).eq('lead_type', 'job'),
        supabase.from('activities').select('id,created_at').eq('user_id', uid).gte('created_at', new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const leads = leadsRes.data || [];
      const emails = emailsRes.data || [];
      const followUps = fuRes.data || [];
      const activities = activitiesRes.data || [];

      const leadsInPeriod = leads.filter(l => new Date(l.created_at) >= cutoff);
      const leadsInPrevPeriod = leads.filter(l => new Date(l.created_at) >= prevCutoff && new Date(l.created_at) < cutoff);
      const emailsInPeriod = emails.filter(e => new Date(e.sent_at) >= cutoff);
      const emailsInPrev = emails.filter(e => new Date(e.sent_at) >= prevCutoff && new Date(e.sent_at) < cutoff);
      const fuSent = followUps.filter(f => f.status === 'sent' && f.sent_at && new Date(f.sent_at) >= cutoff);
      const fuSentPrev = followUps.filter(f => f.status === 'sent' && f.sent_at && new Date(f.sent_at) >= prevCutoff && new Date(f.sent_at) < cutoff);

      const byStatus: Record<string, number> = {};
      leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
      const bySource: Record<string, number> = {};
      leads.forEach(l => { const s = l.source || 'Other'; bySource[s] = (bySource[s] || 0) + 1; });

      // Leads over time
      const lotMap = buildDateSeries(period);
      const emailMap = buildDateSeries(period);
      leadsInPeriod.forEach(l => { const k = l.created_at.slice(0, 10); if (k in lotMap) lotMap[k]++; });
      emailsInPeriod.forEach(e => { const k = e.sent_at.slice(0, 10); if (k in emailMap) emailMap[k]++; });
      const leadsOverTime = Object.keys(lotMap).map(date => ({
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        leads: lotMap[date],
        emails: emailMap[date],
      }));

      // Heatmap (last 84 days = 12 weeks)
      const heatmapMap: Record<string, number> = {};
      activities.forEach(a => { const k = a.created_at.slice(0, 10); heatmapMap[k] = (heatmapMap[k] || 0) + 1; });
      const heatmap: { date: string; count: number }[] = [];
      for (let i = 83; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        heatmap.push({ date: k, count: heatmapMap[k] || 0 });
      }

      const total = leads.length;
      const offers = byStatus['offer'] || 0;
      const interviews = byStatus['interview'] || 0;

      const pct = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);

      return {
        totalLeads: total,
        totalLeadsPct: pct(leadsInPeriod.length, leadsInPrevPeriod.length),
        emailsSent: emailsInPeriod.length,
        emailsSentPct: pct(emailsInPeriod.length, emailsInPrev.length),
        followUpsSent: fuSent.length,
        followUpsPct: pct(fuSent.length, fuSentPrev.length),
        interviews,
        offers,
        conversionRate: total > 0 ? parseFloat(((offers / total) * 100).toFixed(1)) : 0,
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        bySource: Object.entries(bySource).map(([source, count]) => ({ source, count })),
        leadsOverTime,
        heatmap,
      };
    })() : null;

    // ─── Client Data ───────────────────────────────────────────
    const clientResult = (mode === 'client' || mode === 'combined') ? await (async () => {
      const [clientsRes, clientFuRes] = await Promise.all([
        supabase.from('client_leads').select('id,status,source,priority,project_type,budget_range,created_at,won_at,lost_at').eq('user_id', uid),
        supabase.from('follow_ups').select('id,status,sent_at').eq('user_id', uid).eq('lead_type', 'client'),
      ]);

      const clients = clientsRes.data || [];
      const clientFu = clientFuRes.data || [];

      const inPeriod = clients.filter(c => new Date(c.created_at) >= cutoff);
      const inPrev = clients.filter(c => new Date(c.created_at) >= prevCutoff && new Date(c.created_at) < cutoff);

      const byStatus: Record<string, number> = {};
      clients.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
      const bySource: Record<string, number> = {};
      clients.forEach(c => { const s = c.source || 'Other'; bySource[s] = (bySource[s] || 0) + 1; });
      const byType: Record<string, number> = {};
      clients.forEach(c => { const t = c.project_type || 'Other'; byType[t] = (byType[t] || 0) + 1; });

      const won = byStatus['won'] || 0;
      const lost = byStatus['lost'] || 0;
      const pipelineValue = clients
        .filter(c => !['won', 'lost'].includes(c.status))
        .reduce((sum, c) => sum + parseBudget(c.budget_range), 0);

      // Won vs Lost over time
      const wlMap = buildDateSeries(period);
      const lostMap = buildDateSeries(period);
      clients.forEach(c => {
        if (c.won_at) { const k = c.won_at.slice(0, 10); if (k in wlMap) wlMap[k]++; }
        if (c.lost_at) { const k = c.lost_at.slice(0, 10); if (k in lostMap) lostMap[k]++; }
      });
      const wonVsLostOverTime = Object.keys(wlMap).map(date => ({
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        won: wlMap[date],
        lost: lostMap[date],
      }));

      const addedOverTime = buildDateSeries(period);
      inPeriod.forEach(c => { const k = c.created_at.slice(0, 10); if (k in addedOverTime) addedOverTime[k]++; });
      const clientsOverTime = Object.keys(addedOverTime).map(date => ({
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        clients: addedOverTime[date],
      }));

      const pct = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);
      const fuSentClient = clientFu.filter(f => f.status === 'sent' && f.sent_at && new Date(f.sent_at) >= cutoff);

      return {
        totalClients: clients.length,
        totalClientsPct: pct(inPeriod.length, inPrev.length),
        proposalsSent: byStatus['proposal'] || 0,
        activeNegotiations: byStatus['negotiation'] || 0,
        projectsWon: won,
        projectsLost: lost,
        pipelineValue,
        winRate: (won + lost) > 0 ? parseFloat(((won / (won + lost)) * 100).toFixed(1)) : 0,
        followUpsSent: fuSentClient.length,
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        bySource: Object.entries(bySource).map(([source, count]) => ({ source, count })),
        byProjectType: Object.entries(byType).map(([type, count]) => ({ type, count })),
        wonVsLostOverTime,
        clientsOverTime,
      };
    })() : null;

    return NextResponse.json({ job: jobResult, client: clientResult });
  } catch (err) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
