import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Dynamic Image Personalization API
 * Generates SVG-based personalized images with prospect name/company
 * Used in email templates: <img src="/api/personalize-image?name=John&company=Stripe&template=hero" />
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'there';
  const company = searchParams.get('company') || '';
  const role = searchParams.get('role') || '';
  const template = searchParams.get('template') || 'greeting';
  const theme = searchParams.get('theme') || 'blue';

  const themes: Record<string, { bg1: string; bg2: string; text: string; accent: string }> = {
    blue: { bg1: '#3b82f6', bg2: '#6366f1', text: '#ffffff', accent: '#93c5fd' },
    green: { bg1: '#10b981', bg2: '#059669', text: '#ffffff', accent: '#6ee7b7' },
    purple: { bg1: '#8b5cf6', bg2: '#7c3aed', text: '#ffffff', accent: '#c4b5fd' },
    orange: { bg1: '#f97316', bg2: '#ea580c', text: '#ffffff', accent: '#fdba74' },
    dark: { bg1: '#1e293b', bg2: '#0f172a', text: '#f8fafc', accent: '#94a3b8' },
    rose: { bg1: '#f43f5e', bg2: '#e11d48', text: '#ffffff', accent: '#fda4af' },
  };

  const t = themes[theme] || themes.blue;

  let svg = '';

  switch (template) {
    case 'greeting':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${t.bg1}"/>
      <stop offset="100%" style="stop-color:${t.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="200" rx="16" fill="url(#bg)"/>
  <circle cx="520" cy="40" r="60" fill="${t.accent}" opacity="0.1"/>
  <circle cx="80" cy="160" r="40" fill="${t.accent}" opacity="0.1"/>
  <text x="40" y="60" font-family="Arial,sans-serif" font-size="14" fill="${t.accent}" font-weight="600">PERSONALIZED FOR YOU</text>
  <text x="40" y="100" font-family="Arial,sans-serif" font-size="32" fill="${t.text}" font-weight="700">Hey ${escapeXml(name)} 👋</text>
  <text x="40" y="140" font-family="Arial,sans-serif" font-size="18" fill="${t.accent}">${company ? `We'd love to work with ${escapeXml(company)}` : 'We have something special for you'}</text>
  <text x="40" y="175" font-family="Arial,sans-serif" font-size="12" fill="${t.accent}" opacity="0.7">Powered by Reachly</text>
</svg>`;
      break;

    case 'hero':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${t.bg1}"/>
      <stop offset="100%" style="stop-color:${t.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="300" rx="20" fill="url(#bg)"/>
  <circle cx="500" cy="60" r="80" fill="${t.accent}" opacity="0.08"/>
  <circle cx="100" cy="250" r="60" fill="${t.accent}" opacity="0.08"/>
  <rect x="40" y="30" width="80" height="4" rx="2" fill="${t.accent}" opacity="0.5"/>
  <text x="40" y="80" font-family="Arial,sans-serif" font-size="16" fill="${t.accent}" font-weight="600">EXCLUSIVE INVITATION</text>
  <text x="40" y="130" font-family="Arial,sans-serif" font-size="36" fill="${t.text}" font-weight="800">${escapeXml(name)},</text>
  <text x="40" y="170" font-family="Arial,sans-serif" font-size="22" fill="${t.text}" font-weight="600">${company ? `${escapeXml(company)} deserves better` : 'You deserve the best tools'}</text>
  ${role ? `<text x="40" y="200" font-family="Arial,sans-serif" font-size="14" fill="${t.accent}">Built for ${escapeXml(role)}s like you</text>` : ''}
  <rect x="40" y="230" width="180" height="40" rx="10" fill="${t.text}"/>
  <text x="85" y="256" font-family="Arial,sans-serif" font-size="14" fill="${t.bg1}" font-weight="700">Learn More →</text>
</svg>`;
      break;

    case 'stats':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" viewBox="0 0 600 180">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${t.bg1}"/>
      <stop offset="100%" style="stop-color:${t.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="180" rx="16" fill="url(#bg)"/>
  <text x="40" y="45" font-family="Arial,sans-serif" font-size="14" fill="${t.accent}" font-weight="600">${escapeXml(name)} @ ${escapeXml(company || 'Your Company')}</text>
  <rect x="40" y="60" width="520" height="1" fill="${t.accent}" opacity="0.2"/>
  <text x="80" y="105" font-family="Arial,sans-serif" font-size="36" fill="${t.text}" font-weight="800">3x</text>
  <text x="80" y="125" font-family="Arial,sans-serif" font-size="11" fill="${t.accent}">More replies</text>
  <text x="240" y="105" font-family="Arial,sans-serif" font-size="36" fill="${t.text}" font-weight="800">50%</text>
  <text x="240" y="125" font-family="Arial,sans-serif" font-size="11" fill="${t.accent}">Time saved</text>
  <text x="420" y="105" font-family="Arial,sans-serif" font-size="36" fill="${t.text}" font-weight="800">10x</text>
  <text x="420" y="125" font-family="Arial,sans-serif" font-size="11" fill="${t.accent}">ROI boost</text>
  <text x="40" y="165" font-family="Arial,sans-serif" font-size="10" fill="${t.accent}" opacity="0.6">Personalized by Reachly · reachly.app</text>
</svg>`;
      break;

    default:
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="150" viewBox="0 0 600 150">
  <rect width="600" height="150" rx="12" fill="${t.bg1}"/>
  <text x="300" y="75" font-family="Arial,sans-serif" font-size="24" fill="${t.text}" font-weight="700" text-anchor="middle">Hi ${escapeXml(name)}!</text>
  <text x="300" y="105" font-family="Arial,sans-serif" font-size="14" fill="${t.accent}" text-anchor="middle">${company ? `Custom for ${escapeXml(company)}` : 'Made just for you'}</text>
</svg>`;
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
