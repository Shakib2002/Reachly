import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, from_name, variables } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Replace template variables
    const vars = variables || {};
    const processedSubject = replaceVariables(subject, vars);
    const processedBody = replaceVariables(body, vars);

    // Convert plain text to styled HTML
    const html = `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        ${textToHtml(processedBody)}
      </div>
    `;

    const senderName = from_name || 'Reachly';

    const { data, error } = await resend.emails.send({
      from: `${senderName} <onboarding@resend.dev>`,
      to: [to],
      subject: processedSubject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
