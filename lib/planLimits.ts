// Re-export constants from the shared constants file
export { PLAN_LIMITS } from '@/lib/planLimitsConstants';

import { createClient } from '@/lib/supabase';

type Feature = 'leads' | 'emails' | 'jobSearches' | 'aiGeneration' | 'analytics' | 'sequences';

import { PLAN_LIMITS as PL } from '@/lib/planLimitsConstants';

export async function checkLimit(userId: string, feature: Feature): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createClient();
  const month = new Date().toISOString().slice(0, 7);

  const { data: settings } = await supabase.from('user_settings').select('plan').eq('user_id', userId).single();
  const plan = (settings?.plan || 'free') as keyof typeof PL;
  const limits = PL[plan];
  const limit = limits[feature as keyof typeof limits];

  if (typeof limit === 'boolean') return { allowed: limit, current: 0, limit: limit ? 1 : 0 };

  const { data: usage } = await supabase.from('usage_tracking').select('*').eq('user_id', userId).eq('month', month).single();
  const countMap: Record<string, string> = { leads: 'leads_count', emails: 'emails_count', jobSearches: 'job_searches_count' };
  const current = usage?.[countMap[feature]] || 0;

  return { allowed: current < (limit as number), current, limit: limit as number };
}

export async function incrementUsage(userId: string, feature: 'leads' | 'emails' | 'jobSearches' | 'aiGenerations') {
  const supabase = createClient();
  const month = new Date().toISOString().slice(0, 7);
  const col = { leads: 'leads_count', emails: 'emails_count', jobSearches: 'job_searches_count', aiGenerations: 'ai_generations_count' }[feature];

  const { data } = await supabase.from('usage_tracking').select('id,' + col).eq('user_id', userId).eq('month', month).single();
  if (data) {
    await supabase.from('usage_tracking').update({ [col]: ((data as unknown as Record<string, number>)[col] || 0) + 1 }).eq('id', (data as unknown as Record<string, string>).id);
  } else {
    await supabase.from('usage_tracking').insert({ user_id: userId, month, [col]: 1 });
  }
}
