import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan || 'pro';
      if (userId) {
        await supabaseAdmin.from('user_settings').update({
          plan, subscription_id: session.subscription as string, updated_at: new Date().toISOString(),
        }).eq('user_id', userId);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      if (sub.metadata?.user_id) {
        await supabaseAdmin.from('user_settings').update({ plan: 'free', subscription_id: null, updated_at: new Date().toISOString() }).eq('user_id', sub.metadata.user_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
