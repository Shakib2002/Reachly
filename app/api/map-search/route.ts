import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 min for Vercel/Edge

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
});

/**
 * Map Search — SYNCHRONOUS approach.
 * Uses Apify run-sync-get-dataset-items to wait for results in a single HTTP call.
 * Client shows a loading spinner; no polling needed.
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

    const { query, maxResults, minRating, maxRating, minReviews, maxReviews, websiteFilter, requirePhone, onlyOpen } = parsed.data;

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ error: 'Map search not configured. Add APIFY_API_TOKEN to .env.local' }, { status: 503 });
    }

    // Use Apify run-sync-get-dataset-items — blocks until results are ready
    // timeout=300 gives Apify up to 5 min to complete the scrape
    const crawlLimit = Math.min(maxResults + 5, 30); // Keep small for speed

    const runRes = await fetch(
      `https://api.apify.com/v2/acts/2Mdma1N6Fd0y3QEjR/run-sync-get-dataset-items?token=${apiToken}&timeout=300`,
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
        signal: AbortSignal.timeout(360000), // 6 min client-side timeout
      }
    );

    // If timeout exceeded but run started, try to get partial results
    if (!runRes.ok) {
      const errText = await runRes.text().catch(() => '');
      console.error('Apify sync error:', runRes.status, errText);

      // Handle Apify timeout (400 = run timed out, 408 = HTTP timeout)
      if (runRes.status === 400 || runRes.status === 408) {
        return NextResponse.json({
          mode: 'instant',
          status: 'SUCCEEDED',
          businesses: [],
          total: 0,
          message: 'Google Maps scan timed out. Try: 1) Reduce max results to 10, 2) Use a specific city name like "Manhattan, NY" instead of "New York".',
        });
      }

      return NextResponse.json({ error: 'Map search failed. Please try again.' }, { status: 502 });
    }

    // Parse results — run-sync-get-dataset-items returns array directly
    const rawItems = await runRes.json();

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({
        mode: 'instant',
        status: 'SUCCEEDED',
        businesses: [],
        total: 0,
      });
    }

    // Apply all filters
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

    // Score and transform
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
        leadScore: calcLeadScore(biz),
        hasPainKeywords: false,
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
    console.error('Map search error:', error);
    
    // Handle AbortError (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({
        mode: 'instant',
        status: 'SUCCEEDED',
        businesses: [],
        total: 0,
        message: 'Search timed out. Try reducing max results or use a more specific location.',
      });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcLeadScore(biz: any): number {
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

  return Math.min(score, 100);
}
