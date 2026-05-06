import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Multi-provider contact enrichment API
 * Queries Hunter.io, Skrapp, and Apollo APIs in waterfall pattern
 * Returns enriched contact data with email, phone, social profiles
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

    // Provider 1: Hunter.io — Domain Search
    const hunterKey = process.env.HUNTER_API_KEY;
    if (hunterKey) {
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
            });
          }
        }
      } catch { /* Hunter failed, try next */ }
    }

    // Provider 2: Skrapp.io — Email Finder (works with domain search)
    const skrappKey = process.env.SKRAPP_API_KEY;
    if (skrappKey && targetDomain) {
      try {
        // Skrapp domain search — find emails at a domain without needing person names
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
          });
        }
      } catch { /* Skrapp failed */ }
    }

    // Provider 3: Apollo.io — People Search
    const apolloKey = process.env.APOLLO_API_KEY;
    if (apolloKey) {
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
              });
            }
          }
        }
      } catch { /* Apollo failed */ }
    }

    // Sort by confidence (highest first)
    contacts.sort((a, b) => b.confidence - a.confidence);

    // De-duplicate by email
    const unique = contacts.filter((c, i, arr) =>
      c.email && arr.findIndex(x => x.email === c.email) === i
    );

    return NextResponse.json({
      contacts: unique,
      totalResults: unique.length,
      providers_queried: [
        hunterKey ? 'hunter' : null,
        skrappKey ? 'skrapp' : null,
        apolloKey ? 'apollo' : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('[Contact Enrichment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
