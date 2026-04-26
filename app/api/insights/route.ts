import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json();
    if (!summary) return NextResponse.json({ error: 'Summary required' }, { status: 400 });

    const aiKey = process.env.AI_API_KEY;
    const aiBase = process.env.AI_BASE_URL || 'https://api.modelrouter.app/v1';
    const aiModel = process.env.AI_MODEL || 'google/gemini-2.5-flash';
    if (aiKey) {
      try {
        const res = await fetch(`${aiBase}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey}` },
          body: JSON.stringify({
            model: aiModel, max_tokens: 500,
            messages: [{ role: 'user', content: `Analyze this job search analytics data and give exactly 5 short, actionable insights. Each insight should be 1 sentence. Return ONLY a JSON array of strings.\n\nData: ${JSON.stringify(summary)}` }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || '[]';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const insights = JSON.parse(cleaned);
          return NextResponse.json({ insights });
        }
      } catch (e) { console.warn('AI API failed:', e); }
    }

    // Smart fallback insights based on actual data
    const insights: string[] = [];
    const { totalLeads = 0, emailsSent = 0, byStatus = {}, bySource = {} } = summary;
    
    if (totalLeads === 0) {
      insights.push('Start by adding leads from the Discover page to begin tracking your pipeline.');
    } else {
      if ((byStatus.new || 0) > totalLeads * 0.5) insights.push(`${Math.round((byStatus.new / totalLeads) * 100)}% of your leads are still in "New" — consider applying to move them forward.`);
      if ((byStatus.interview || 0) > 0) insights.push(`You have ${byStatus.interview} leads in interview stage — prepare follow-up emails for each.`);
      if ((byStatus.offer || 0) > 0) insights.push(`Congrats! ${byStatus.offer} offer(s) received. Your conversion rate is ${Math.round((byStatus.offer / totalLeads) * 100)}%.`);
      const topSource = Object.entries(bySource).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      if (topSource) insights.push(`"${topSource[0]}" is your best lead source with ${topSource[1]} leads — double down on this channel.`);
      if (emailsSent === 0) insights.push('You haven\'t sent any outreach emails yet — try the Outreach module to increase responses.');
      else insights.push(`You've sent ${emailsSent} emails — aim for a follow-up within 3 days for best response rates.`);
      if ((byStatus.applied || 0) > 3 && (byStatus.interview || 0) === 0) insights.push('Multiple applications but no interviews — consider revising your resume or cover letter approach.');
    }
    
    while (insights.length < 4) insights.push('Keep adding leads and sending emails to unlock more personalized insights.');
    return NextResponse.json({ insights: insights.slice(0, 5) });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
