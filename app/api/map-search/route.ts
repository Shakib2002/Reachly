import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      maxResults = 20,
      minRating = 3.5,
      maxRating = 4.3,
      minReviews = 15,
      maxReviews = 120,
      websiteFilter = 'any', // 'none' | 'has' | 'any'
      requirePhone = true,
      onlyOpen = true,
    } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

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
