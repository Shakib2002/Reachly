import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Public REST API — Reachly API Platform
 * Authenticated via API key in header: X-Reachly-Key
 * 
 * Endpoints:
 * GET  /api/v1?resource=leads        — List leads
 * GET  /api/v1?resource=templates    — List templates
 * GET  /api/v1?resource=campaigns    — List sent emails
 * POST /api/v1?resource=leads        — Create lead
 * POST /api/v1?resource=webhooks     — Register webhook
 */

async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-reachly-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!apiKey) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from('api_keys')
    .select('user_id, name, permissions, rate_limit, last_used_at')
    .eq('key', apiKey)
    .eq('active', true)
    .single();

  if (data) {
    // Update last_used_at
    await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key', apiKey);
  }

  return data;
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key', docs: 'Add X-Reachly-Key header' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  const supabase = createClient();

  switch (resource) {
    case 'leads': {
      const { data, error, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('user_id', auth.user_id)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data, total: count, page, limit });
    }

    case 'templates': {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, body, created_at')
        .eq('user_id', auth.user_id)
        .order('created_at', { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    case 'campaigns': {
      const { data, error, count } = await supabase
        .from('emails_sent')
        .select('*', { count: 'exact' })
        .eq('user_id', auth.user_id)
        .range(offset, offset + limit - 1)
        .order('sent_at', { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data, total: count, page, limit });
    }

    case 'webhooks': {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', auth.user_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    default:
      return NextResponse.json({
        error: 'Missing resource parameter',
        available: ['leads', 'templates', 'campaigns', 'webhooks'],
        usage: '/api/v1?resource=leads&page=1&limit=50',
      }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');
  const body = await request.json();
  const supabase = createClient();

  switch (resource) {
    case 'leads': {
      const { data, error } = await supabase.from('leads').insert({
        user_id: auth.user_id,
        name: body.name,
        email: body.email,
        company: body.company,
        title: body.title || body.position,
        phone: body.phone,
        status: body.status || 'new',
        source: body.source || 'api',
        notes: body.notes,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Fire webhooks for lead.created
      fireWebhooks(supabase, auth.user_id, 'lead.created', data);

      return NextResponse.json({ data }, { status: 201 });
    }

    case 'webhooks': {
      if (!body.url || !body.events) {
        return NextResponse.json({ error: 'url and events[] required' }, { status: 400 });
      }
      const { data, error } = await supabase.from('webhooks').insert({
        user_id: auth.user_id,
        url: body.url,
        events: body.events,
        secret: `whsec_${crypto.randomUUID().replace(/-/g, '')}`,
        active: true,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data }, { status: 201 });
    }

    default:
      return NextResponse.json({
        error: 'Missing or invalid resource',
        available_post: ['leads', 'webhooks'],
      }, { status: 400 });
  }
}

async function fireWebhooks(supabase: ReturnType<typeof createClient>, userId: string, event: string, payload: unknown) {
  try {
    const { data: hooks } = await supabase
      .from('webhooks')
      .select('url, secret')
      .eq('user_id', userId)
      .eq('active', true)
      .contains('events', [event]);

    if (hooks) {
      for (const hook of hooks) {
        fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Reachly-Event': event,
            'X-Reachly-Signature': hook.secret,
          },
          body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
        }).catch(() => {});
      }
    }
  } catch { /* ignore webhook failures */ }
}
