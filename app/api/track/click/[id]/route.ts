import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const trackingId = params.id;
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL to prevent open redirect attacks
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Fire-and-forget: log the click event
  try {
    const supabase = createClient();
    await supabase.from('email_events').insert({
      tracking_id: trackingId,
      event_type: 'click',
      url,
      ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    // Increment click_count (fire-and-forget)
    void (async () => {
      try {
        const { data } = await supabase
          .from('emails_sent')
          .select('click_count')
          .eq('tracking_id', trackingId)
          .single();
        if (data) {
          await supabase
            .from('emails_sent')
            .update({ click_count: (data.click_count || 0) + 1 })
            .eq('tracking_id', trackingId);
        }
      } catch { /* ignore */ }
    })();
  } catch {
    // Never block the redirect
  }

  // 302 redirect to the actual URL
  return NextResponse.redirect(url, 302);
}
