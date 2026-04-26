import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { incrementUsage } from '@/lib/planLimits';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const month = new Date().toISOString().slice(0, 7);
  const { data } = await supabase.from('usage_tracking').select('*').eq('user_id', user.id).eq('month', month).single();
  return NextResponse.json(data || { leads_count: 0, emails_count: 0, job_searches_count: 0, ai_generations_count: 0 });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { feature } = await request.json();
  if (!['leads', 'emails', 'jobSearches', 'aiGenerations'].includes(feature)) return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
  await incrementUsage(user.id, feature);
  return NextResponse.json({ success: true });
}
