import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

interface JSearchJob {
  employer_name: string;
  employer_website: string | null;
  job_title: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_apply_link: string;
  job_description: string;
  employer_logo: string | null;
  job_posted_at_datetime_utc: string;
  job_is_remote: boolean;
  job_employment_type: string;
}

export async function POST(request: NextRequest) {
  try {
    const { company, title, location } = await request.json();

    // Rate limit: 20 searches per 60 seconds per IP
    const rateLimited = await applyRateLimit(request, 'search');
    if (rateLimited) return rateLimited;

    if (!company && !title) {
      return NextResponse.json({ error: 'Company or title is required' }, { status: 400 });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    // Build search query from user inputs
    let searchQuery = '';
    if (title && company) searchQuery = `${title} at ${company}`;
    else if (title) searchQuery = `${title} hiring`;
    else if (company) searchQuery = `jobs at ${company}`;
    if (location) searchQuery += ` in ${location}`;

    const params = new URLSearchParams({
      query: searchQuery,
      page: '1',
      num_pages: '2',
    });

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`JSearch error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: JSearchJob[] = data.data || [];

    if (jobs.length === 0) {
      return NextResponse.json({ leads: [], totalResults: 0 });
    }

    // Transform job postings into REAL lead cards
    // All data is 100% from the API — no fake names, no fabricated contacts
    const leads = jobs.map((job, index) => {
      const domain = extractDomain(job.employer_website || '');
      const department = guessDepartment(job.job_title);

      return {
        id: `lead-${index}-${job.employer_name}-${Date.now()}`,
        // Use REAL company name as the lead identity — NOT fake person names
        firstName: job.employer_name,
        lastName: '',
        position: job.job_title,
        company: job.employer_name,
        domain,
        logo: job.employer_logo,
        email: null,        // Real — will be enriched via Find Email button
        emailStatus: 'unknown' as const,
        linkedin: null,     // Real — will be found via LinkedIn button
        department,
        location: job.job_is_remote
          ? 'Remote'
          : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
        jobPosting: {
          title: job.job_title,
          applyLink: job.job_apply_link,
          postedAt: job.job_posted_at_datetime_utc,
          type: job.job_employment_type,
        },
        confidence: 0,       // Real — 0 until enriched via waterfall API
        isReal: true,
      };
    });

    // De-duplicate by company
    const unique = leads.filter((lead, idx, arr) => {
      if (!company) return true;
      return arr.findIndex(l => l.company === lead.company) === idx;
    });

    return NextResponse.json({
      leads: unique,
      totalResults: unique.length,
      source: 'jsearch',
    });
  } catch (error) {
    console.error('Lead search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function extractDomain(websiteOrName: string): string {
  if (!websiteOrName) return '';
  try {
    if (websiteOrName.startsWith('http')) {
      return new URL(websiteOrName).hostname.replace('www.', '');
    }
    return '';
  } catch {
    return '';
  }
}

function guessDepartment(jobTitle: string): string {
  const title = jobTitle.toLowerCase();
  if (title.includes('engineer') || title.includes('developer') || title.includes('software') || title.includes('tech')) return 'Engineering';
  if (title.includes('market') || title.includes('brand') || title.includes('growth') || title.includes('seo')) return 'Marketing';
  if (title.includes('sales') || title.includes('account') || title.includes('revenue') || title.includes('bdr') || title.includes('sdr')) return 'Sales';
  if (title.includes('hr') || title.includes('human resource') || title.includes('talent') || title.includes('recruit') || title.includes('people')) return 'HR';
  if (title.includes('product') || title.includes('pm') || title.includes('roadmap')) return 'Product';
  if (title.includes('design') || title.includes('ux') || title.includes('ui') || title.includes('creative')) return 'Design';
  if (title.includes('finance') || title.includes('cfo') || title.includes('accounting') || title.includes('controller')) return 'Finance';
  if (title.includes('ceo') || title.includes('coo') || title.includes('president') || title.includes('founder') || title.includes('vp') || title.includes('director')) return 'Leadership';
  if (title.includes('data') || title.includes('analyst') || title.includes('scientist') || title.includes('bi')) return 'Data';
  if (title.includes('ops') || title.includes('operation') || title.includes('supply')) return 'Operations';
  return 'General';
}
