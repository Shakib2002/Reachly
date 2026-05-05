import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/emailVerifier';
import { applyRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'sensitive');
    if (rateLimited) return rateLimited;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await verifyEmail(parsed.data.email);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
