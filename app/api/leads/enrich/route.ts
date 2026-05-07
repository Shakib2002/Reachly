import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Multi-provider contact enrichment API — Waterfall pattern
 * 
 * Industry best practices implemented:
 * 1. Stop condition — stops as soon as a verified email is found
 * 2. Provider source tracking — logs which provider enriched each contact
 * 3. Confidence scoring — each provider contributes a real confidence score
 * 4. De-duplication — removes duplicate emails across providers
 * 5. Fallback chain — Hunter → Skrapp → Apollo (ordered by accuracy)
 */

interface EnrichedContact {
  email: string | null;
  confidence: number;
  first_name: string;
  last_name: string;
  position: string;
  company: string;
  domain: string;
  linkedin: string | null;
  phone: string | null;
  source: string;
  verified: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'search');
    if (rateLimited) return rateLimited;

    const { domain, company, first_name, last_name, role } = await request.json();

    if (!domain && !company) {
      return NextResponse.json({ error: 'Domain or company required' }, { status: 400 });
    }

    const targetDomain = domain || `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const contacts: EnrichedContact[] = [];
    const providersQueried: string[] = [];
    const providerTimings: Record<string, number> = {};

    // ═══ Provider 1: Hunter.io — Domain Search (highest accuracy for domain-based) ═══
    const hunterKey = process.env.HUNTER_API_KEY;
    if (hunterKey) {
      providersQueried.push('hunter');
      const start = Date.now();
      try {
        const params = new URLSearchParams({ domain: targetDomain, api_key: hunterKey, limit: '10' });
        if (first_name) params.set('first_name', first_name);
        if (last_name) params.set('last_name', last_name);

        const res = await fetch(`https://api.hunter.io/v2/domain-search?${params}`, {
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();

        if (data.data?.emails) {
          for (const email of data.data.emails) {
            contacts.push({
              email: email.value,
              confidence: email.confidence || 70,
              first_name: email.first_name || '',
              last_name: email.last_name || '',
              position: email.position || '',
              company: company || data.data.organization || targetDomain,
              domain: targetDomain,
              linkedin: email.linkedin || null,
              phone: email.phone_number || null,
              source: 'hunter',
              verified: email.verification?.status === 'valid',
            });
          }
        }
        providerTimings.hunter = Date.now() - start;
      } catch { /* Hunter failed, try next */ }

      // ─── STOP CONDITION: If Hunter found a high-confidence verified email, skip others ───
      const bestHunter = contacts.find(c => c.source === 'hunter' && c.confidence >= 90);
      if (bestHunter) {
        console.log(`[Enrich] Hunter found high-confidence email (${bestHunter.confidence}%), skipping other providers`);
        return buildResponse(contacts, providersQueried, providerTimings);
      }
    }

    // ═══ Provider 2: Skrapp.io — Email Finder ═══
    const skrappKey = process.env.SKRAPP_API_KEY;
    if (skrappKey && targetDomain) {
      providersQueried.push('skrapp');
      const start = Date.now();
      try {
        const skrappUrl = first_name && last_name
          ? `https://api.skrapp.io/api/v2/find?firstName=${encodeURIComponent(first_name)}&lastName=${encodeURIComponent(last_name)}&domain=${encodeURIComponent(targetDomain)}`
          : `https://api.skrapp.io/api/v2/find?domain=${encodeURIComponent(targetDomain)}`;
        const res = await fetch(skrappUrl, {
          headers: { 'X-Access-Key': skrappKey, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();

        if (data.email && !contacts.some(c => c.email === data.email)) {
          contacts.push({
            email: data.email,
            confidence: data.accuracy || 75,
            first_name: data.firstName || first_name || '',
            last_name: data.lastName || last_name || '',
            position: data.title || role || '',
            company: company || targetDomain,
            domain: targetDomain,
            linkedin: data.linkedin || null,
            phone: null,
            source: 'skrapp',
            verified: (data.accuracy || 0) >= 90,
          });
        }
        providerTimings.skrapp = Date.now() - start;
      } catch { /* Skrapp failed */ }

      // ─── STOP CONDITION: If Skrapp found high-accuracy email, skip Apollo ───
      const bestSkrapp = contacts.find(c => c.source === 'skrapp' && c.confidence >= 85);
      if (bestSkrapp) {
        console.log(`[Enrich] Skrapp found good email (${bestSkrapp.confidence}%), skipping Apollo`);
        return buildResponse(contacts, providersQueried, providerTimings);
      }
    }

    // ═══ Provider 3: Apollo.io — People Search (broadest database) ═══
    const apolloKey = process.env.APOLLO_API_KEY;
    if (apolloKey) {
      providersQueried.push('apollo');
      const start = Date.now();
      try {
        const body: Record<string, unknown> = {
          api_key: apolloKey,
          q_organization_domains: targetDomain,
          page: 1,
          per_page: 10,
        };
        if (role) body.person_titles = [role];
        if (first_name) body.q_keywords = `${first_name} ${last_name || ''}`.trim();

        const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();

        if (data.people) {
          for (const person of data.people) {
            const email = person.email;
            if (email && !contacts.some(c => c.email === email)) {
              contacts.push({
                email,
                confidence: person.email_status === 'verified' ? 95 : 70,
                first_name: person.first_name || '',
                last_name: person.last_name || '',
                position: person.title || '',
                company: person.organization?.name || company || targetDomain,
                domain: targetDomain,
                linkedin: person.linkedin_url || null,
                phone: person.phone_numbers?.[0]?.sanitized_number || null,
                source: 'apollo',
                verified: person.email_status === 'verified',
              });
            }
          }
        }
        providerTimings.apollo = Date.now() - start;
      } catch { /* Apollo failed */ }
    }

    return buildResponse(contacts, providersQueried, providerTimings);
  } catch (error) {
    console.error('[Contact Enrichment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildResponse(
  contacts: EnrichedContact[],
  providersQueried: string[],
  providerTimings: Record<string, number>
) {
  // Sort: verified first, then by confidence (highest first)
  contacts.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return b.confidence - a.confidence;
  });

  // De-duplicate by email
  const unique = contacts.filter((c, i, arr) =>
    c.email && arr.findIndex(x => x.email === c.email) === i
  );

  // Log enrichment summary
  const sources = unique.reduce((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`[Enrich] Found ${unique.length} contacts from ${Object.keys(sources).join(', ')}. Timings: ${JSON.stringify(providerTimings)}`);

  return NextResponse.json({
    contacts: unique,
    totalResults: unique.length,
    providers_queried: providersQueried,
    provider_timings: providerTimings,
    sources,
  });
}
