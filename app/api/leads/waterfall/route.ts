import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Waterfall Enrichment API
 * Queries multiple data providers sequentially for highest accuracy
 * Provider order: Hunter → Skrapp → Apollo → Clearbit → fallback patterns
 * 
 * Returns the BEST result from all providers, not just the first match
 */

interface EnrichmentResult {
  email: string | null;
  confidence: number;
  first_name: string;
  last_name: string;
  title: string;
  company: string;
  domain: string;
  linkedin: string | null;
  phone: string | null;
  location: string | null;
  source: string;
  enrichment_score: number;
}

interface ProviderResult {
  provider: string;
  success: boolean;
  data: Partial<EnrichmentResult> | null;
  latency_ms: number;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'search');
    if (rateLimited) return rateLimited;

    const { first_name, last_name, company, domain, role } = await request.json();

    if (!first_name && !company && !domain) {
      return NextResponse.json({ error: 'Provide first_name + company, or domain' }, { status: 400 });
    }

    const targetDomain = domain || guessDomain(company);
    const results: ProviderResult[] = [];
    let bestResult: EnrichmentResult = {
      email: null, confidence: 0, first_name: first_name || '', last_name: last_name || '',
      title: role || '', company: company || '', domain: targetDomain,
      linkedin: null, phone: null, location: null, source: 'none', enrichment_score: 0,
    };

    // ─── Provider 1: Hunter.io ───
    const hunterKey = process.env.HUNTER_API_KEY;
    if (hunterKey && first_name && last_name) {
      const start = Date.now();
      try {
        const res = await fetch(
          `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(targetDomain)}&first_name=${encodeURIComponent(first_name)}&last_name=${encodeURIComponent(last_name)}&api_key=${hunterKey}`,
          { signal: AbortSignal.timeout(6000) }
        );
        const data = await res.json();
        if (data.data?.email) {
          const r: Partial<EnrichmentResult> = {
            email: data.data.email,
            confidence: data.data.confidence || 70,
            first_name: data.data.first_name || first_name,
            last_name: data.data.last_name || last_name,
            title: data.data.position || role || '',
            linkedin: data.data.linkedin || null,
            phone: data.data.phone_number || null,
            source: 'hunter',
          };
          results.push({ provider: 'hunter', success: true, data: r, latency_ms: Date.now() - start });
          if ((r.confidence || 0) > bestResult.confidence) {
            bestResult = { ...bestResult, ...r, enrichment_score: calculateScore(r) } as EnrichmentResult;
          }
        } else {
          results.push({ provider: 'hunter', success: false, data: null, latency_ms: Date.now() - start });
        }
      } catch {
        results.push({ provider: 'hunter', success: false, data: null, latency_ms: Date.now() - start });
      }
    }

    // ─── Provider 2: Skrapp ───
    const skrappKey = process.env.SKRAPP_API_KEY;
    if (skrappKey && first_name && last_name) {
      const start = Date.now();
      try {
        const res = await fetch(
          `https://api.skrapp.io/api/v2/find?firstName=${encodeURIComponent(first_name)}&lastName=${encodeURIComponent(last_name)}&domain=${encodeURIComponent(targetDomain)}`,
          { headers: { 'X-Access-Key': skrappKey }, signal: AbortSignal.timeout(6000) }
        );
        const data = await res.json();
        if (data.email) {
          const r: Partial<EnrichmentResult> = {
            email: data.email,
            confidence: data.accuracy || 75,
            linkedin: data.linkedin || null,
            source: 'skrapp',
          };
          results.push({ provider: 'skrapp', success: true, data: r, latency_ms: Date.now() - start });
          if ((r.confidence || 0) > bestResult.confidence) {
            bestResult = { ...bestResult, ...r, enrichment_score: calculateScore(r) } as EnrichmentResult;
          }
        } else {
          results.push({ provider: 'skrapp', success: false, data: null, latency_ms: Date.now() - start });
        }
      } catch {
        results.push({ provider: 'skrapp', success: false, data: null, latency_ms: Date.now() - start });
      }
    }

    // ─── Provider 3: Apollo ───
    const apolloKey = process.env.APOLLO_API_KEY;
    if (apolloKey) {
      const start = Date.now();
      try {
        const body: Record<string, unknown> = {
          api_key: apolloKey,
          q_organization_domains: targetDomain,
          page: 1, per_page: 1,
        };
        if (first_name) body.q_keywords = `${first_name} ${last_name || ''}`.trim();
        if (role) body.person_titles = [role];

        const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(6000),
        });
        const data = await res.json();
        const person = data.people?.[0];
        if (person?.email) {
          const r: Partial<EnrichmentResult> = {
            email: person.email,
            confidence: person.email_status === 'verified' ? 95 : 75,
            first_name: person.first_name || first_name,
            last_name: person.last_name || last_name,
            title: person.title || role,
            company: person.organization?.name || company,
            linkedin: person.linkedin_url || null,
            phone: person.phone_numbers?.[0]?.sanitized_number || null,
            location: [person.city, person.state, person.country].filter(Boolean).join(', ') || null,
            source: 'apollo',
          };
          results.push({ provider: 'apollo', success: true, data: r, latency_ms: Date.now() - start });
          if ((r.confidence || 0) > bestResult.confidence) {
            bestResult = { ...bestResult, ...r, enrichment_score: calculateScore(r) } as EnrichmentResult;
          }
        } else {
          results.push({ provider: 'apollo', success: false, data: null, latency_ms: Date.now() - start });
        }
      } catch {
        results.push({ provider: 'apollo', success: false, data: null, latency_ms: Date.now() - start });
      }
    }

    // ─── Provider 4: Email Pattern Fallback ───
    if (!bestResult.email && first_name && last_name) {
      const patterns = [
        `${first_name.toLowerCase()}.${last_name.toLowerCase()}@${targetDomain}`,
        `${first_name[0].toLowerCase()}${last_name.toLowerCase()}@${targetDomain}`,
        `${first_name.toLowerCase()}@${targetDomain}`,
        `${first_name.toLowerCase()}${last_name[0].toLowerCase()}@${targetDomain}`,
      ];
      bestResult.email = patterns[0];
      bestResult.confidence = 30;
      bestResult.source = 'pattern';
      bestResult.enrichment_score = 15;
      results.push({
        provider: 'pattern', success: true,
        data: { email: patterns[0], confidence: 30 },
        latency_ms: 0,
      });
    }

    return NextResponse.json({
      result: bestResult,
      waterfall: results,
      providers_queried: results.length,
      providers_matched: results.filter(r => r.success).length,
      total_latency_ms: results.reduce((a, r) => a + r.latency_ms, 0),
    });
  } catch (error) {
    console.error('[Waterfall Enrichment]', error);
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
  }
}

function guessDomain(company: string): string {
  if (!company) return '';
  return company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
}

function calculateScore(data: Partial<EnrichmentResult>): number {
  let score = 0;
  if (data.email) score += 30;
  if ((data.confidence || 0) > 80) score += 20;
  else if ((data.confidence || 0) > 50) score += 10;
  if (data.linkedin) score += 15;
  if (data.phone) score += 15;
  if (data.title) score += 10;
  if (data.location) score += 10;
  return score;
}
