import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { applyRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const emailSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required').max(50000),
  from_name: z.string().max(100).optional(),
  variables: z.record(z.string(), z.string()).optional(),
  variant_id: z.string().optional(),
});

function replaceVariables(text: string, vars: Record<string, string>) {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.6;color:#334155;font-size:15px;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

/**
 * Wrap all links in the email body with click tracking redirects
 */
function wrapLinksForTracking(html: string, trackingId: string, baseUrl: string): string {
  const urlRegex = /href="(https?:\/\/[^"]+)"/g;
  return html.replace(urlRegex, (_match, url) => {
    const trackUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
    return `href="${trackUrl}"`;
  });
}

/**
 * Inject a 1x1 tracking pixel at the end of the email HTML
 */
function injectTrackingPixel(html: string, trackingId: string, baseUrl: string): string {
  const pixel = `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`;
  // Insert before last closing div
  const lastDivIndex = html.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    return html.slice(0, lastDivIndex) + pixel + html.slice(lastDivIndex);
  }
  return html + pixel;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 emails per 60 seconds per IP
    const rateLimited = await applyRateLimit(request, 'sensitive');
    if (rateLimited) return rateLimited;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Lazy init — only created at request time, not build time
    const resend = new Resend(apiKey);

    const parsed = emailSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { to, subject, body, from_name, variables, variant_id } = parsed.data;

    const vars = variables || {};
    const processedSubject = replaceVariables(subject, vars);
    const processedBody = replaceVariables(body, vars);

    // Generate tracking ID
    const trackingId = randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let html = `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        ${textToHtml(processedBody)}
      </div>
    `;

    // Inject tracking: wrap links + add pixel
    html = wrapLinksForTracking(html, trackingId, baseUrl);
    html = injectTrackingPixel(html, trackingId, baseUrl);

    const senderName = from_name || 'Reachly';

    const { data, error } = await resend.emails.send({
      from: `${senderName} <onboarding@resend.dev>`,
      to: [to],
      subject: processedSubject,
      html,
    });

    if (error) {
      console.error('[Email API]', error.message || 'Send failed');
      return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      tracking_id: trackingId,
      variant_id: variant_id || null,
    });
  } catch (error) {
    console.error('[Email API]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
