import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Input validation schema — prevents injection of arbitrary fields into Supabase
const leadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  company: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  salary: z.string().max(100).optional().nullable(),
  status: z.enum(['new', 'applied', 'interview', 'offer', 'closed']).default('new'),
  source: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.from('leads').insert({ ...parsed.data, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('activities').insert({ user_id: user.id, action: 'lead_added', description: `Added lead: ${parsed.data.title || 'New Lead'}` });
  return NextResponse.json(data, { status: 201 });
}
