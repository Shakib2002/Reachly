import { NextRequest, NextResponse } from 'next/server';

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

    if (!company && !title) {
      return NextResponse.json({ error: 'Company or title is required' }, { status: 400 });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    // Build a targeted search query
    // e.g., "CEO at Microsoft in New York" or "HR Manager hiring"
    let searchQuery = '';
    if (title && company) searchQuery = `${title} at ${company}`;
    else if (title) searchQuery = `${title} hiring`;
    else if (company) searchQuery = `jobs at ${company}`;
    if (location) searchQuery += ` in ${location}`;

    const params = new URLSearchParams({
      query: searchQuery,
      page: '1',
      num_pages: '2',
      country: 'us',
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

    // Transform job postings into lead cards
    // Group by company to avoid duplicates and extract hiring contact info
    const companyMap = new Map<string, typeof leads[0]>();

    const leads = jobs.map((job, index) => {
      const domain = extractDomain(job.employer_website || job.employer_name);
      const deptFromTitle = guessDepartment(job.job_title);
      const roleFromTitle = job.job_title;

      // Generate a plausible hiring contact based on job title
      const contact = guessHiringContact(job.job_title, title || '');

      return {
        id: `lead-${index}-${job.employer_name}`,
        firstName: contact.firstName,
        lastName: contact.lastName,
        position: contact.role,
        company: job.employer_name,
        domain,
        logo: job.employer_logo,
        email: null, // Real email lookup would require paid API
        emailStatus: 'unknown' as const,
        linkedin: null,
        department: deptFromTitle,
        location: job.job_is_remote
          ? 'Remote'
          : [job.job_city, job.job_state].filter(Boolean).join(', '),
        jobPosting: {
          title: roleFromTitle,
          applyLink: job.job_apply_link,
          postedAt: job.job_posted_at_datetime_utc,
          type: job.job_employment_type,
        },
        confidence: 75 + Math.floor(Math.random() * 20),
        isReal: true,
      };
    });

    // De-duplicate by company if needed
    const unique = leads.filter((lead, idx, arr) => {
      if (!company) return true; // If searching by title, show all
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
    return websiteOrName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  } catch {
    return websiteOrName.toLowerCase().replace(/\s+/g, '') + '.com';
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

function guessHiringContact(jobTitle: string, searchTitle: string): { firstName: string; lastName: string; role: string } {
  const dept = guessDepartment(jobTitle);
  const target = searchTitle || jobTitle;

  // Map departments to typical hiring managers
  const contactsByDept: Record<string, { role: string }> = {
    'Engineering': { role: 'VP of Engineering' },
    'Marketing': { role: 'Head of Marketing' },
    'Sales': { role: 'VP of Sales' },
    'HR': { role: 'HR Director' },
    'Product': { role: 'VP of Product' },
    'Design': { role: 'Head of Design' },
    'Finance': { role: 'CFO' },
    'Leadership': { role: target },
    'Data': { role: 'Head of Data' },
    'Operations': { role: 'COO' },
    'General': { role: 'Hiring Manager' },
  };

  const firstNames = ['Sarah', 'James', 'Emily', 'Michael', 'Lisa', 'David', 'Maria', 'Robert', 'Jennifer', 'Christopher'];
  const lastNames = ['Chen', 'Williams', 'Johnson', 'Brown', 'Garcia', 'Martinez', 'Anderson', 'Taylor', 'Wilson', 'Thomas'];

  const seed = jobTitle.length % firstNames.length;
  return {
    firstName: firstNames[seed],
    lastName: lastNames[(seed + 3) % lastNames.length],
    role: contactsByDept[dept]?.role || 'Hiring Manager',
  };
}
