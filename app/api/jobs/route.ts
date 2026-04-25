import { NextRequest, NextResponse } from 'next/server';

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
    const { query, location, jobType, datePosted, page } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Build search query
    let searchQuery = query;
    if (location) searchQuery += ` in ${location}`;

    const params = new URLSearchParams({
      query: searchQuery,
      page: String(page || 1),
      num_pages: '3',
      country: 'us',
    });

    if (datePosted && datePosted !== 'all') {
      params.set('date_posted', datePosted);
    }
    if (jobType && jobType !== 'all') {
      params.set('employment_types', jobType);
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('JSearch API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch jobs from API' },
        { status: response.status }
      );
    }

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

    return NextResponse.json({
      jobs,
      totalResults: data.data?.length || 0,
    });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
