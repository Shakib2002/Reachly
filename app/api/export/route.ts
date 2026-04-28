import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const mode = sp.get('mode') || 'job';
    const uid = user.id;
    const date = new Date().toISOString().slice(0, 10);

    const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const row = (cols: string[]) => cols.map(esc).join(',');

    if (mode === 'job') {
      const [leadsRes, emailsRes] = await Promise.all([
        supabase.from('leads')
          .select('id,title,company,location,salary,status,source,email,created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
        supabase.from('emails_sent')
          .select('lead_id')
          .eq('user_id', uid),
      ]);

      const leads = leadsRes.data || [];
      const emailCount: Record<string, number> = {};
      (emailsRes.data || []).forEach((e: { lead_id: string }) => {
        emailCount[e.lead_id] = (emailCount[e.lead_id] || 0) + 1;
      });

      const headers = ['Title', 'Company', 'Location', 'Salary', 'Status', 'Source', 'Email', 'Emails Sent', 'Created Date'];
      const rows = leads.map((l: {
        id: string; title: string; company: string | null; location: string | null;
        salary: string | null; status: string; source: string | null;
        email: string | null; created_at: string;
      }) => row([
        l.title, l.company || '', l.location || '', l.salary || '',
        l.status, l.source || '', l.email || '',
        String(emailCount[l.id] || 0),
        new Date(l.created_at).toLocaleDateString(),
      ]));

      const csv = [headers.map(esc).join(','), ...rows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="reachly-job-report-${date}.csv"`,
        },
      });
    }

    if (mode === 'client') {
      const clientsRes = await supabase.from('client_leads')
        .select('client_name,contact_person,email,project_type,budget_range,status,source,priority,created_at,won_at,lost_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      const clients = clientsRes.data || [];
      const headers = ['Client Name', 'Contact Person', 'Email', 'Project Type', 'Budget', 'Status', 'Source', 'Priority', 'Created Date', 'Won/Lost Date'];
      const rows = clients.map((c: {
        client_name: string; contact_person: string | null; email: string | null;
        project_type: string | null; budget_range: string | null; status: string;
        source: string | null; priority: string; created_at: string;
        won_at: string | null; lost_at: string | null;
      }) => row([
        c.client_name, c.contact_person || '', c.email || '',
        c.project_type || '', c.budget_range || '', c.status,
        c.source || '', c.priority,
        new Date(c.created_at).toLocaleDateString(),
        c.won_at ? new Date(c.won_at).toLocaleDateString() : c.lost_at ? new Date(c.lost_at).toLocaleDateString() : '',
      ]));

      const csv = [headers.map(esc).join(','), ...rows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="reachly-client-report-${date}.csv"`,
        },
      });
    }

    // Combined
    const [leadsRes2, clientsRes2] = await Promise.all([
      supabase.from('leads').select('title,company,status,source,created_at').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('client_leads').select('client_name,project_type,status,source,budget_range,created_at').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);

    const headers = ['Type', 'Name/Title', 'Company/Project', 'Budget', 'Status', 'Source', 'Created Date'];
    const jobRows = (leadsRes2.data || []).map((l: { title: string; company: string | null; status: string; source: string | null; created_at: string }) =>
      row(['job', l.title, l.company || '', '', l.status, l.source || '', new Date(l.created_at).toLocaleDateString()])
    );
    const clientRows = (clientsRes2.data || []).map((c: { client_name: string; project_type: string | null; budget_range: string | null; status: string; source: string | null; created_at: string }) =>
      row(['client', c.client_name, c.project_type || '', c.budget_range || '', c.status, c.source || '', new Date(c.created_at).toLocaleDateString()])
    );

    const csv = [headers.map(esc).join(','), ...jobRows, ...clientRows].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reachly-combined-report-${date}.csv"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
