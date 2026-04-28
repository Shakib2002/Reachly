import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, domain, linkedinUrl } = await request.json();

    if (!domain && !linkedinUrl) {
      return NextResponse.json({ error: 'domain or linkedinUrl is required' }, { status: 400 });
    }

    // Try user's custom Skrapp key first, fall back to platform key
    let apiKey = process.env.SKRAPP_API_KEY;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('skrapp_api_key')
          .eq('user_id', user.id)
          .single();
        if (settings?.skrapp_api_key) apiKey = settings.skrapp_api_key;
      }
    } catch { /* use platform key */ }

    if (!apiKey) {
      return NextResponse.json({ error: 'Email finder not configured' }, { status: 503 });
    }

    // Skrapp.io API v2
    const body = linkedinUrl
      ? { linkedInUrl: linkedinUrl }
      : { firstName, lastName, domain };

    const response = await fetch('https://api.skrapp.io/api/v2/find', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Skrapp API error:', err);
      return NextResponse.json({ error: 'Email finder request failed', found: false }, { status: 200 });
    }

    const data = await response.json();

    // Skrapp returns: { email, firstName, lastName, domain, accuracy, ... }
    if (data?.email) {
      return NextResponse.json({
        found: true,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        domain: data.domain,
        accuracy: data.accuracy ?? null,
      });
    }

    return NextResponse.json({ found: false, email: null });
  } catch (error) {
    console.error('Email finder error:', error);
    return NextResponse.json({ error: 'Internal error', found: false }, { status: 500 });
  }
}
