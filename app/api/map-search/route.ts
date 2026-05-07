import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const mapSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  maxResults: z.number().int().min(1).max(100).default(20),
  minRating: z.number().min(0).max(5).default(1.0),
  maxRating: z.number().min(0).max(5).default(5.0),
  minReviews: z.number().int().min(0).max(100000).default(1),
  maxReviews: z.number().int().min(0).max(100000).default(10000),
  websiteFilter: z.enum(['none', 'has', 'any']).default('any'),
  requirePhone: z.boolean().default(false),
  onlyOpen: z.boolean().default(false),
  painKeywords: z.array(z.string()).default([]),
});

/**
 * Map Search — ASYNC POLLING approach.
 * 1. Start Apify run (returns immediately with run ID)
 * 2. Poll run status every 5 seconds until done
 * 3. Fetch dataset items
 * This avoids Next.js dev server timeout issues.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'search');
    if (rateLimited) return rateLimited;

    const parsed = mapSearchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, maxResults, minRating, maxRating, minReviews, maxReviews, websiteFilter, requirePhone, onlyOpen, painKeywords } = parsed.data;

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ error: 'Map search not configured. Add APIFY_API_TOKEN to .env.local' }, { status: 503 });
    }

    const crawlLimit = maxResults + 10;

    // ═══ Step 1: Start the Apify run (returns immediately) ═══
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/2Mdma1N6Fd0y3QEjR/runs?token=${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [query.trim()],
          maxCrawledPlacesPerSearch: crawlLimit,
          language: 'en',
          exportPlaceUrls: false,
          includeWebResults: false,
          includeHistogram: false,
          includePeopleAlsoSearch: false,
          scrapeReviewerName: false,
          scrapeReviewId: false,
          scrapeReviewUrl: false,
          scrapeResponseFromOwnerText: false,
        }),
      }
    );

    if (!startRes.ok) {
      const errText = await startRes.text().catch(() => '');
      console.error('[Map Search] Failed to start Apify run:', startRes.status, errText);
      return NextResponse.json({ error: 'Failed to start map search. Please try again.' }, { status: 502 });
    }

    const startData = await startRes.json();
    const runId = startData.data?.id;
    if (!runId) {
      console.error('[Map Search] No run ID returned:', JSON.stringify(startData));
      return NextResponse.json({ error: 'Map search returned invalid response.' }, { status: 502 });
    }

    console.log(`[Map Search] Run started: ${runId} for query: "${query}"`);

    // ═══ Step 2: Poll for completion (max 5 minutes, every 5 seconds) ═══
    const maxPollTime = 5 * 60 * 1000; // 5 minutes
    const pollInterval = 5000; // 5 seconds
    const pollStart = Date.now();
    let runStatus = 'RUNNING';

    while (Date.now() - pollStart < maxPollTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        const statusRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const statusData = await statusRes.json();
        runStatus = statusData.data?.status;

        console.log(`[Map Search] Poll: ${runStatus} (${Math.round((Date.now() - pollStart) / 1000)}s)`);

        if (runStatus === 'SUCCEEDED' || runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
          break;
        }
      } catch (pollErr) {
        console.error('[Map Search] Poll error:', pollErr);
        // Continue polling even if one poll request fails
      }
    }

    if (runStatus !== 'SUCCEEDED') {
      console.error(`[Map Search] Run ended with status: ${runStatus}`);
      return NextResponse.json({
        mode: 'instant',
        status: 'SUCCEEDED',
        businesses: [],
        total: 0,
        message: runStatus === 'TIMED-OUT'
          ? 'Google Maps scan timed out. Try: 1) Reduce max results, 2) Use a specific city name.'
          : `Map search ${runStatus?.toLowerCase() || 'failed'}. Please try again.`,
      });
    }

    // ═══ Step 3: Fetch dataset items ═══
    const datasetId = (await (await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`)).json()).data?.defaultDatasetId;

    if (!datasetId) {
      console.error('[Map Search] No dataset ID for run:', runId);
      return NextResponse.json({ mode: 'instant', status: 'SUCCEEDED', businesses: [], total: 0 });
    }

    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}&format=json`,
      { signal: AbortSignal.timeout(30000) }
    );

    if (!itemsRes.ok) {
      console.error('[Map Search] Failed to fetch dataset items:', itemsRes.status);
      return NextResponse.json({ mode: 'instant', status: 'SUCCEEDED', businesses: [], total: 0 });
    }

    const rawItems = await itemsRes.json();

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({
        mode: 'instant',
        status: 'SUCCEEDED',
        businesses: [],
        total: 0,
        message: 'No results found. Try a different search query or location.',
      });
    }

    console.log(`[Map Search] Got ${rawItems.length} raw items from Apify`);

    // ═══ Apply filters ═══
    const filtered = rawItems.filter((biz) => {
      const rating = biz.totalScore || 0;
      if (rating < minRating || rating > maxRating) return false;

      const reviews = biz.reviewsCount || 0;
      if (reviews < minReviews || reviews > maxReviews) return false;

      if (requirePhone && !biz.phone) return false;
      if (onlyOpen && (biz.permanentlyClosed || biz.temporarilyClosed)) return false;

      if (websiteFilter === 'none' && biz.website) return false;
      if (websiteFilter === 'has' && !biz.website) return false;

      return true;
    });

    // ═══ Score and transform ═══
    const businesses = filtered
      .map((biz) => ({
        id: biz.placeId || `${biz.title}-${Math.random().toString(36).slice(2)}`,
        name: biz.title || biz.name || 'Unknown',
        category: biz.categoryName || 'Local Business',
        address: biz.address || '',
        city: biz.city || '',
        phone: biz.phone || null,
        website: biz.website || null,
        rating: biz.totalScore || 0,
        reviewsCount: biz.reviewsCount || 0,
        imagesCount: biz.imageCount || biz.imagesCount || 0,
        isOpen: !biz.permanentlyClosed && !biz.temporarilyClosed,
        mapsUrl: biz.url || biz.googleMapsUri || '',
        imageUrl: biz.imageUrl || null,
        description: biz.description || null,
        openingHours: biz.openingHours || [],
        socialMedia: {
          facebook: biz.facebookUrl || (Array.isArray(biz.facebooks) && biz.facebooks[0]) || null,
          instagram: biz.instagramUrl || (Array.isArray(biz.instagrams) && biz.instagrams[0]) || null,
          twitter: biz.twitterUrl || (Array.isArray(biz.twitters) && biz.twitters[0]) || null,
          linkedin: biz.linkedInUrl || (Array.isArray(biz.linkedIns) && biz.linkedIns[0]) || null,
        },
        leadScore: calcLeadScore(biz, painKeywords),
        hasPainKeywords: checkPainKeywords(biz, painKeywords),
        websiteMissing: !biz.website,
      }))
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, maxResults);

    return NextResponse.json({
      mode: 'instant',
      status: 'SUCCEEDED',
      businesses,
      total: businesses.length,
      rawTotal: rawItems.length,
    });
  } catch (error) {
    console.error('[Map Search] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcLeadScore(biz: any, painKeywords: string[] = []): number {
  let score = 40;

  const rating = biz.totalScore || 0;
  if (rating >= 3.8 && rating <= 4.2) score += 20;
  else if (rating >= 3.5 && rating <= 4.3) score += 12;

  const rev = biz.reviewsCount || 0;
  if (rev >= 20 && rev <= 100) score += 15;
  else if (rev >= 15 && rev <= 120) score += 8;

  if (!biz.website) score += 12;
  else score += 3;

  if (biz.phone) score += 8;

  const photos = biz.imagesCount || biz.imageCount || 0;
  if (photos < 10) score += 8;
  else if (photos < 25) score += 4;

  if (!biz.permanentlyClosed && !biz.temporarilyClosed) score += 5;

  if (checkPainKeywords(biz, painKeywords)) score += 10;

  return Math.min(score, 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkPainKeywords(biz: any, painKeywords: string[] = []): boolean {
  if (painKeywords.length === 0) return false;
  const searchText = [
    biz.description || '',
    biz.reviewsText || '',
    ...(Array.isArray(biz.reviews) ? biz.reviews.map((r: { text?: string }) => r.text || '') : []),
  ].join(' ').toLowerCase();
  return painKeywords.some(kw => searchText.includes(kw.toLowerCase()));
}
