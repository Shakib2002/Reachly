import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Resend Webhook Endpoint
 * Receives email events: delivered, opened, clicked, bounced, complained
 * Set this URL in Resend Dashboard → Webhooks → https://your-domain.com/api/webhooks/resend
 */

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: { link: string };
    bounce?: { message: string };
    complaint?: { feedback_type: string };
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: ResendWebhookPayload = await request.json();
    const supabase = createClient();

    const eventType = payload.type;
    const emailId = payload.data?.email_id;
    const toEmail = payload.data?.to?.[0];

    if (!eventType || !emailId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Map Resend event types to our event types
    const eventMap: Record<string, string> = {
      'email.delivered': 'delivered',
      'email.opened': 'open',
      'email.clicked': 'click',
      'email.bounced': 'bounce',
      'email.complained': 'complaint',
      'email.delivery_delayed': 'delayed',
    };

    const mappedType = eventMap[eventType];
    if (!mappedType) {
      return NextResponse.json({ ok: true, skipped: eventType });
    }

    // Store the event
    await supabase.from('email_events').insert({
      tracking_id: emailId,
      event_type: mappedType,
      url: payload.data.click?.link || null,
      ip: 'webhook',
      user_agent: `resend-webhook/${eventType}`,
    });

    // For bounces/complaints — update the inbox_messages table for unified inbox
    if (mappedType === 'bounce' || mappedType === 'complaint') {
      await supabase.from('inbox_messages').insert({
        direction: 'system',
        from_email: 'system@reachly.app',
        to_email: toEmail || '',
        subject: mappedType === 'bounce'
          ? `⚠️ Email bounced: ${payload.data.subject}`
          : `🚫 Spam complaint: ${payload.data.subject}`,
        body: mappedType === 'bounce'
          ? `Your email to ${toEmail} bounced. Reason: ${payload.data.bounce?.message || 'Unknown'}`
          : `Your email to ${toEmail} was marked as spam. Type: ${payload.data.complaint?.feedback_type || 'Unknown'}`,
        status: 'unread',
        resend_email_id: emailId,
      });

      // Update deliverability stats
      await supabase.from('deliverability_stats').upsert({
        date: new Date().toISOString().split('T')[0],
        [`${mappedType}_count`]: 1,
      }, { onConflict: 'date' });
    }

    // For delivered — track for deliverability
    if (mappedType === 'delivered') {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('deliverability_stats')
        .select('*')
        .eq('date', today)
        .single();

      if (existing) {
        await supabase.from('deliverability_stats')
          .update({ delivered_count: (existing.delivered_count || 0) + 1 })
          .eq('date', today);
      } else {
        await supabase.from('deliverability_stats')
          .insert({ date: today, delivered_count: 1, sent_count: 0, bounce_count: 0, complaint_count: 0, open_count: 0, click_count: 0 });
      }
    }

    return NextResponse.json({ ok: true, event: mappedType });
  } catch (error) {
    console.error('[Resend Webhook]', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
