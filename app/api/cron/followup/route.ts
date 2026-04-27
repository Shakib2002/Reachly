import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Move client creation inside the handler so it only runs at request time,
// not at build time (which causes "supabaseUrl is required" during Vercel build)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Guard: env vars not set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get pending follow-ups that are due
    const { data: dueFollowUps, error } = await supabaseAdmin
      .from('follow_ups')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true })
      .limit(50);

    if (error) throw error;
    if (!dueFollowUps || dueFollowUps.length === 0) {
      return NextResponse.json({ message: 'No follow-ups due', processed: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const fu of dueFollowUps) {
      try {
        // Get lead email based on type
        let recipientEmail = '';
        if (fu.lead_type === 'job') {
          const { data: lead } = await supabaseAdmin.from('leads').select('email, title, company').eq('id', fu.lead_id).single();
          recipientEmail = lead?.email || '';
        } else {
          const { data: client } = await supabaseAdmin.from('client_leads').select('email, client_name').eq('id', fu.lead_id).single();
          recipientEmail = client?.email || '';
        }

        if (!recipientEmail) {
          await supabaseAdmin.from('follow_ups').update({ status: 'failed' }).eq('id', fu.id);
          failed++;
          continue;
        }

        // Send via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
            body: JSON.stringify({
              from: 'Reachly <noreply@reachly.app>',
              to: recipientEmail,
              subject: fu.subject,
              html: fu.body.replace(/\n/g, '<br>'),
            }),
          });

          if (!res.ok) throw new Error(`Resend API error: ${res.status}`);
        }

        // Update follow-up status
        await supabaseAdmin.from('follow_ups').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }).eq('id', fu.id);

        // Log to emails_sent
        await supabaseAdmin.from('emails_sent').insert({
          user_id: fu.user_id,
          lead_id: fu.lead_id,
          subject: fu.subject,
          body: fu.body,
          recipient_email: recipientEmail,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        // Log activity
        await supabaseAdmin.from('activities').insert({
          user_id: fu.user_id,
          lead_id: fu.lead_id,
          action: 'followup_sent',
          description: `Follow-up #${fu.sequence_order} sent: ${fu.subject}`,
        });

        sent++;
      } catch (e) {
        console.error(`Follow-up ${fu.id} failed:`, e);
        await supabaseAdmin.from('follow_ups').update({ status: 'failed' }).eq('id', fu.id);
        failed++;
      }
    }

    return NextResponse.json({ message: 'Follow-ups processed', sent, failed, total: dueFollowUps.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to process follow-ups' }, { status: 500 });
  }
}
