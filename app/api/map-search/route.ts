import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const mapSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  maxResults: z.number().int().min(1).max(100).default(20),
  minRating: z.number().min(0).max(5).default(3.5),
  maxRating: z.number().min(0).max(5).default(4.3),
  minReviews: z.number().int().min(0).max(10000).default(15),
  maxReviews: z.number().int().min(0).max(100000).default(120),
  websiteFilter: z.enum(['none', 'has', 'any']).default('any'),
  requirePhone: z.boolean().default(true),
  onlyOpen: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 map searches per 60 seconds per IP
    const rateLimited = await applyRateLimit(request, 'search');
    if (rateLimited) return rateLimited;

    const parsed = mapSearchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, maxResults, minRating, maxRating, minReviews, maxReviews, websiteFilter, requirePhone, onlyOpen } = parsed.data;

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ error: 'Map search not configured' }, { status: 503 });
    }

    // Start Apify Google Maps Extractor run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/2Mdma1N6Fd0y3QEjR/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          searchStringsArray: [query.trim()],
          maxCrawledPlacesPerSearch: Math.min(maxResults * 3, 150), // over-fetch for filtering
          language: 'en',
          exportPlaceUrls: false,
          includeWebResults: false,
        }),
      }
    );

    if (!runRes.ok) {
      const err = await runRes.text();
      console.error('Apify start error:', err);
      return NextResponse.json({ error: 'Failed to start map search' }, { status: 502 });
    }

    const runData = await runRes.json();
    const runId: string = runData.data.id;

    // Store filter params in response so client can use them when polling
    return NextResponse.json({
      runId,
      status: 'RUNNING',
      filters: { minRating, maxRating, minReviews, maxReviews, websiteFilter, requirePhone, onlyOpen, maxResults },
    });
  } catch (error) {
    console.error('Map search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
