import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const jobSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(200),
  location: z.string().max(200).optional(),
  jobType: z.string().max(50).optional(),
  datePosted: z.string().max(30).optional(),
  page: z.number().int().min(1).max(50).optional(),
});

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string;
  job_state: string;
  job_country: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string;
  job_salary_period: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_employment_type: string;
  job_is_remote: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 searches per 60 seconds per IP
    const rateLimited = await applyRateLimit(request, 'search');
    if (rateLimited) return rateLimited;

    const parsed = jobSearchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, location, jobType, datePosted, page } = parsed.data;

    // Try user's custom key first, fall back to platform key
    let apiKey = process.env.RAPIDAPI_KEY;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('rapidapi_key')
          .eq('user_id', user.id)
          .single();
        if (settings?.rapidapi_key) apiKey = settings.rapidapi_key;
      }
    } catch { /* use platform key */ }

    // Try real API first
    if (apiKey) {
      let searchQuery = query;
      if (location) searchQuery += ` in ${location}`;

      const params = new URLSearchParams({
        query: searchQuery,
        page: String(page || 1),
        num_pages: '3',
        country: 'us',
      });

      if (datePosted && datePosted !== 'all') params.set('date_posted', datePosted);
      if (jobType && jobType !== 'all') params.set('employment_types', jobType);

      try {
        const response = await fetch(
          `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'jsearch.p.rapidapi.com',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const jobs = (data.data || []).map((job: JSearchJob) => ({
            id: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            logo: job.employer_logo,
            city: job.job_city,
            state: job.job_state,
            country: job.job_country,
            minSalary: job.job_min_salary,
            maxSalary: job.job_max_salary,
            salaryCurrency: job.job_salary_currency,
            salaryPeriod: job.job_salary_period,
            description: job.job_description,
            applyLink: job.job_apply_link,
            postedAt: job.job_posted_at_datetime_utc,
            employmentType: job.job_employment_type,
            isRemote: job.job_is_remote,
          }));

          return NextResponse.json({ jobs, totalResults: jobs.length });
        }

        console.warn('JSearch API unavailable, using demo data');
      } catch (apiError) {
        console.warn('JSearch API error, falling back to demo:', apiError);
      }
    }

    // Fallback: Generate realistic demo jobs
    const jobs = generateDemoJobs(query, location, jobType);
    return NextResponse.json({ jobs, totalResults: jobs.length, isDemo: true });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateDemoJobs(query: string, location?: string, _jobType?: string) {
  const companies = [
    { name: 'Google', logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
    { name: 'Microsoft', logo: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64' },
    { name: 'Amazon', logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64' },
    { name: 'Meta', logo: 'https://www.google.com/s2/favicons?domain=meta.com&sz=64' },
    { name: 'Apple', logo: 'https://www.google.com/s2/favicons?domain=apple.com&sz=64' },
    { name: 'Netflix', logo: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64' },
    { name: 'Stripe', logo: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=64' },
    { name: 'Shopify', logo: 'https://www.google.com/s2/favicons?domain=shopify.com&sz=64' },
    { name: 'Spotify', logo: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=64' },
    { name: 'Airbnb', logo: 'https://www.google.com/s2/favicons?domain=airbnb.com&sz=64' },
    { name: 'Uber', logo: 'https://www.google.com/s2/favicons?domain=uber.com&sz=64' },
    { name: 'Salesforce', logo: 'https://www.google.com/s2/favicons?domain=salesforce.com&sz=64' },
  ];

  const titleVariations = [
    `Senior ${query}`,
    query,
    `${query} (Remote)`,
    `Lead ${query}`,
    `Junior ${query}`,
    `Staff ${query}`,
    `Principal ${query}`,
    `${query} II`,
    `${query} - Growth Team`,
    `${query}, Platform`,
    `${query} - Infrastructure`,
    `${query} - Full Stack`,
  ];

  const locations = location
    ? [{ city: location, state: '', remote: false }]
    : [
        { city: 'San Francisco', state: 'CA', remote: false },
        { city: 'New York', state: 'NY', remote: false },
        { city: 'Seattle', state: 'WA', remote: false },
        { city: '', state: '', remote: true },
        { city: 'Austin', state: 'TX', remote: false },
        { city: 'Los Angeles', state: 'CA', remote: false },
        { city: '', state: '', remote: true },
        { city: 'Chicago', state: 'IL', remote: false },
        { city: 'Boston', state: 'MA', remote: false },
        { city: '', state: '', remote: true },
        { city: 'Denver', state: 'CO', remote: false },
        { city: 'Miami', state: 'FL', remote: false },
      ];

  const types = ['FULLTIME', 'FULLTIME', 'FULLTIME', 'CONTRACTOR', 'FULLTIME', 'PARTTIME'];
  const salaryRanges = [
    { min: 120000, max: 180000 },
    { min: 150000, max: 220000 },
    { min: 90000, max: 140000 },
    { min: 130000, max: 200000 },
    null,
    { min: 100000, max: 160000 },
    { min: 170000, max: 250000 },
    null,
    { min: 110000, max: 175000 },
    { min: 140000, max: 210000 },
    null,
    { min: 95000, max: 150000 },
  ];

  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => {
    const co = companies[i % companies.length];
    const loc = locations[i % locations.length];
    const salary = salaryRanges[i % salaryRanges.length];
    const daysAgo = Math.floor(Math.random() * 14) + 1;

    return {
      id: `demo-job-${i}-${Date.now()}`,
      title: titleVariations[i % titleVariations.length],
      company: co.name,
      logo: co.logo,
      city: loc.city,
      state: loc.state,
      country: 'US',
      minSalary: salary?.min ?? null,
      maxSalary: salary?.max ?? null,
      salaryCurrency: 'USD',
      salaryPeriod: 'YEAR',
      description: `We are looking for a talented ${query} to join our team at ${co.name}. You will work on cutting-edge projects, collaborate with world-class engineers, and help build products used by millions of people worldwide. Strong problem-solving skills and passion for technology required.`,
      applyLink: `https://careers.${co.name.toLowerCase()}.com/jobs`,
      postedAt: new Date(now - daysAgo * 86400000).toISOString(),
      employmentType: types[i % types.length],
      isRemote: loc.remote,
    };
  });
}
