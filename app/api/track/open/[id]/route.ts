import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 1x1 transparent GIF (43 bytes)
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const trackingId = params.id;

  // Fire-and-forget: log the open event
  try {
    const supabase = createClient();
    await supabase.from('email_events').insert({
      tracking_id: trackingId,
      event_type: 'open',
      ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    // Increment open_count (fire-and-forget)
    void (async () => {
      try {
        const { data } = await supabase
          .from('emails_sent')
          .select('open_count')
          .eq('tracking_id', trackingId)
          .single();
        if (data) {
          await supabase
            .from('emails_sent')
            .update({ open_count: (data.open_count || 0) + 1 })
            .eq('tracking_id', trackingId);
        }
      } catch { /* ignore */ }
    })();
  } catch {
    // Never fail — always serve the pixel
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': PIXEL.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
