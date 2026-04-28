import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: settings } = await supabase.from('user_settings').select('subscription_id').eq('user_id', user.id).single();
    if (!settings?.subscription_id) return NextResponse.json({ error: 'No subscription' }, { status: 400 });

    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(settings.subscription_id);
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.customer as string,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal' }, { status: 500 });
  }
}
