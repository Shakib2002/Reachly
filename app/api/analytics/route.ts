import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const period = request.nextUrl.searchParams.get('period') || '30';
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - parseInt(period));

  const [leads, emails, activities] = await Promise.all([
    supabase.from('leads').select('id,status,source,created_at').eq('user_id', user.id),
    supabase.from('emails_sent').select('id,status,sent_at').eq('user_id', user.id).gte('sent_at', cutoff.toISOString()),
    supabase.from('activities').select('id,action,created_at').eq('user_id', user.id).gte('created_at', cutoff.toISOString()),
  ]);

  const allLeads = leads.data || [];
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  allLeads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; const s = l.source || 'Other'; bySource[s] = (bySource[s] || 0) + 1; });

  return NextResponse.json({
    totalLeads: allLeads.length, emailsSent: (emails.data || []).length,
    byStatus, bySource, recentLeads: allLeads.filter(l => new Date(l.created_at) > cutoff).length,
    activities: (activities.data || []).length,
  });
}
