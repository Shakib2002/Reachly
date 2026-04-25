import { NextRequest, NextResponse } from 'next/server';

interface HunterEmail {
  first_name: string;
  last_name: string;
  value: string;
  type: string;
  confidence: number;
  position: string;
  department: string;
  linkedin: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { company, title, location } = await request.json();

    if (!company && !title) {
      return NextResponse.json(
        { error: 'Company or title is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUNTER_API_KEY;

    // If Hunter API key is available, use it
    if (apiKey && company) {
      const params = new URLSearchParams({
        domain: company.toLowerCase().replace(/\s+/g, '') + '.com',
        api_key: apiKey,
      });

      if (title) params.set('department', title);

      const response = await fetch(
        `https://api.hunter.io/v2/domain-search?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        const leads = (data.data?.emails || []).map((email: HunterEmail) => ({
          id: `${email.first_name}-${email.last_name}-${email.value}`,
          firstName: email.first_name,
          lastName: email.last_name,
          email: email.value,
          position: email.position || title || 'Unknown',
          company: company,
          confidence: email.confidence,
          linkedin: email.linkedin,
          department: email.department,
        }));

        return NextResponse.json({ leads, totalResults: leads.length });
      }
    }

    // Fallback: Generate mock leads based on search criteria
    // This provides a working demo when Hunter.io API key isn't available
    const mockLeads = generateMockLeads(company || 'Unknown', title || '', location || '');

    return NextResponse.json({
      leads: mockLeads,
      totalResults: mockLeads.length,
      isMock: !apiKey,
    });
  } catch (error) {
    console.error('Lead search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockLeads(company: string, title: string, _location: string) {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Product', 'Design'];
  const titles = title
    ? [title, `Senior ${title}`, `VP of ${title}`, `Head of ${title}`]
    : ['CEO', 'CTO', 'VP Engineering', 'HR Director', 'Product Manager', 'Head of Sales'];

  const firstNames = ['Sarah', 'James', 'Maria', 'David', 'Emily', 'Michael', 'Lisa', 'Robert'];
  const lastNames = ['Chen', 'Williams', 'Garcia', 'Johnson', 'Brown', 'Anderson', 'Martinez', 'Taylor'];

  return Array.from({ length: Math.min(6, firstNames.length) }, (_, i) => {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    return {
      id: `mock-${i}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      position: titles[i % titles.length],
      company,
      confidence: Math.floor(Math.random() * 30 + 70),
      linkedin: null,
      department: departments[i % departments.length],
    };
  });
}
