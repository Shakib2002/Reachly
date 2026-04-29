import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ApifyBusiness {
  title: string;
  categoryName: string;
  address: string;
  city: string;
  phone: string;
  website: string | null;
  totalScore: number;
  reviewsCount: number;
  imagesCount: number;
  permanentlyClosed: boolean;
  temporarilyClosed: boolean;
  url: string;
  imageUrl: string | null;
  description: string | null;
  openingHours: { day: string; hours: string }[];
  placeId: string;
}

interface FilterParams {
  minRating: number;
  maxRating: number;
  minReviews: number;
  maxReviews: number;
  websiteFilter: 'none' | 'has' | 'any';
  requirePhone: boolean;
  onlyOpen: boolean;
  maxResults: number;
  painKeywords?: string[];
}

function calcLeadScore(biz: ApifyBusiness, _filters: FilterParams): number {
  let score = 40; // base

  // Rating sweet spot 3.8–4.2 → max points
  const rating = biz.totalScore || 0;
  if (rating >= 3.8 && rating <= 4.2) score += 20;
  else if (rating >= 3.5 && rating <= 4.3) score += 12;

  // Review count sweet spot 20–100
  const rev = biz.reviewsCount || 0;
  if (rev >= 20 && rev <= 100) score += 15;
  else if (rev >= 15 && rev <= 120) score += 8;

  // No website = easier sell
  if (!biz.website) score += 12;
  else score += 3;

  // Has phone
  if (biz.phone) score += 8;

  // Fewer images = incomplete profile
  if (biz.imagesCount < 10) score += 8;
  else if (biz.imagesCount < 25) score += 4;

  // Is open (not closed)
  if (!biz.permanentlyClosed && !biz.temporarilyClosed) score += 5;

  return Math.min(score, 100);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;
    const url = new URL(request.url);

    // Parse filter params from query string
    const filters: FilterParams = {
      minRating: parseFloat(url.searchParams.get('minRating') || '3.5'),
      maxRating: parseFloat(url.searchParams.get('maxRating') || '4.3'),
      minReviews: parseInt(url.searchParams.get('minReviews') || '15'),
      maxReviews: parseInt(url.searchParams.get('maxReviews') || '120'),
      websiteFilter: (url.searchParams.get('websiteFilter') || 'any') as FilterParams['websiteFilter'],
      requirePhone: url.searchParams.get('requirePhone') !== 'false',
      onlyOpen: url.searchParams.get('onlyOpen') !== 'false',
      maxResults: parseInt(url.searchParams.get('maxResults') || '20'),
      painKeywords: url.searchParams.get('painKeywords')?.split(',').filter(Boolean) || [],
    };

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }

    // Check run status
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    );

    if (!statusRes.ok) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const statusData = await statusRes.json();
    const status: string = statusData.data.status;

    if (status === 'RUNNING' || status === 'READY') {
      return NextResponse.json({ status: 'RUNNING' });
    }

    if (status !== 'SUCCEEDED') {
      return NextResponse.json({ status: 'FAILED', error: 'Scraping failed' });
    }

    // Fetch results
    const datasetId: string = statusData.data.defaultDatasetId;
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?limit=200`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    );

    const rawItems: ApifyBusiness[] = await itemsRes.json();

    // Apply all filters
    const filtered = rawItems.filter((biz) => {
      // Rating filter
      const rating = biz.totalScore || 0;
      if (rating < filters.minRating || rating > filters.maxRating) return false;

      // Review count filter
      const reviews = biz.reviewsCount || 0;
      if (reviews < filters.minReviews || reviews > filters.maxReviews) return false;

      // Phone filter
      if (filters.requirePhone && !biz.phone) return false;

      // Status filter
      if (filters.onlyOpen && (biz.permanentlyClosed || biz.temporarilyClosed)) return false;

      // Website filter
      if (filters.websiteFilter === 'none' && biz.website) return false;
      if (filters.websiteFilter === 'has' && !biz.website) return false;

      return true;
    });

    // Score and sort
    const scored = filtered
      .map((biz) => ({
        id: biz.placeId || `${biz.title}-${Math.random()}`,
        name: biz.title,
        category: biz.categoryName,
        address: biz.address,
        city: biz.city,
        phone: biz.phone || null,
        website: biz.website || null,
        rating: biz.totalScore,
        reviewsCount: biz.reviewsCount,
        imagesCount: biz.imagesCount,
        isOpen: !biz.permanentlyClosed && !biz.temporarilyClosed,
        mapsUrl: biz.url,
        imageUrl: biz.imageUrl || null,
        description: biz.description || null,
        openingHours: biz.openingHours || [],
        leadScore: calcLeadScore(biz, filters),
        hasPainKeywords: false, // Could extend with review analysis
        websiteMissing: !biz.website,
      }))
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, filters.maxResults);

    return NextResponse.json({
      status: 'SUCCEEDED',
      businesses: scored,
      total: scored.length,
      rawTotal: rawItems.length,
      filtered: filtered.length,
    });
  } catch (error) {
    console.error('Map results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
