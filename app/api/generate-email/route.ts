import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { purpose, tone, keyPoints, recipientInfo } = await request.json();

    if (!purpose) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    }

    const purposeMap: Record<string, string> = {
      'job-application': 'a job application email expressing interest in the position',
      'follow-up': 'a professional follow-up email after an application or interview',
      'introduction': 'a networking introduction email to establish a professional connection',
      'thank-you': 'a sincere thank you email after an interview or meeting',
      'cold-outreach': 'a compelling cold outreach email to a potential employer or client',
    };

    const toneMap: Record<string, string> = {
      professional: 'professional and polished',
      friendly: 'friendly yet professional',
      formal: 'formal and business-like',
      casual: 'casual but respectful',
    };

    const purposeDesc = purposeMap[purpose] || purpose;
    const toneDesc = toneMap[tone] || tone || 'professional';

    const prompt = `Generate ${purposeDesc} with a ${toneDesc} tone.

${recipientInfo ? `Recipient: ${recipientInfo}` : ''}
${keyPoints ? `Key points to include: ${keyPoints}` : ''}

Use these template variables where appropriate:
- {{name}} for the recipient's name
- {{company}} for the company name
- {{position}} for the job position
- {{my_name}} for the sender's name

Return ONLY a JSON object with exactly these fields (no markdown, no code blocks):
{"subject": "email subject line", "body": "email body text with proper paragraphs separated by double newlines"}`;

    // Try AI API (ModelRouter / OpenAI-compatible)
    const aiKey = process.env.AI_API_KEY;
    const aiBase = process.env.AI_BASE_URL || 'https://api.modelrouter.app/v1';
    const aiModel = process.env.AI_MODEL || 'google/gemini-2.5-flash';
    if (aiKey) {
      try {
        const response = await fetch(`${aiBase}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey}` },
          body: JSON.stringify({
            model: aiModel, max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || '';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return NextResponse.json({ subject: parsed.subject, body: parsed.body });
        }
      } catch (e) {
        console.warn('AI API failed, using built-in templates:', e);
      }
    }

    // Fallback: built-in smart templates
    const templates = generateBuiltInTemplate(purpose, tone, keyPoints);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Generate email error:', error);
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
  }
}

function generateBuiltInTemplate(purpose: string, tone: string, keyPoints?: string): { subject: string; body: string } {
  const isFormal = tone === 'formal';
  const greeting = isFormal ? 'Dear {{name}},' : 'Hi {{name}},';
  const signoff = isFormal ? 'Sincerely,\n{{my_name}}' : 'Best regards,\n{{my_name}}';
  const extra = keyPoints ? `\n\n${keyPoints}` : '';

  switch (purpose) {
    case 'job-application':
      return {
        subject: 'Application for {{position}} at {{company}}',
        body: `${greeting}

I am writing to express my strong interest in the {{position}} role at {{company}}. With my background and experience, I believe I would be a valuable addition to your team.${extra}

I am particularly drawn to {{company}}'s mission and the opportunity to contribute to impactful projects. I am confident that my skills align well with what you're looking for.

I would welcome the opportunity to discuss how my experience can contribute to your team's goals. I have attached my resume for your review.

Thank you for your time and consideration.

${signoff}`,
      };
    case 'follow-up':
      return {
        subject: 'Following Up - {{position}} at {{company}}',
        body: `${greeting}

I hope this message finds you well. I wanted to follow up on my application for the {{position}} position at {{company}}.${extra}

I remain very enthusiastic about the opportunity and would love to learn more about the role and how I can contribute to your team.

Please let me know if there's any additional information I can provide. I look forward to hearing from you.

${signoff}`,
      };
    case 'thank-you':
      return {
        subject: 'Thank You - {{position}} Interview at {{company}}',
        body: `${greeting}

Thank you so much for taking the time to meet with me today regarding the {{position}} role at {{company}}. I truly enjoyed our conversation and learning more about the team.${extra}

Our discussion reinforced my excitement about this opportunity. I am confident that my skills and experience would be a great fit for the role.

Please don't hesitate to reach out if you need any additional information from my end. I look forward to the next steps.

${signoff}`,
      };
    case 'cold-outreach':
      return {
        subject: 'Quick question about opportunities at {{company}}',
        body: `${greeting}

I came across {{company}} and was impressed by the work your team is doing. I'm reaching out because I believe my experience could be valuable to your organization.${extra}

I'd love the opportunity to have a brief conversation about potential opportunities where I could contribute to {{company}}'s success.

Would you be open to a quick 15-minute call this week?

${signoff}`,
      };
    default:
      return {
        subject: 'Connecting regarding {{position}} at {{company}}',
        body: `${greeting}

I wanted to reach out and introduce myself. I've been following {{company}}'s work and am very interested in the {{position}} opportunity.${extra}

I believe my background could be a strong fit, and I'd love to discuss this further at your convenience.

${signoff}`,
      };
  }
}
